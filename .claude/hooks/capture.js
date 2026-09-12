#!/usr/bin/env node
// 8x assignment capture hook for Claude Code.
//
// Wired to two lifecycle events in .claude/settings.json:
//   UserPromptSubmit -> appends a PROMPT entry (verbatim prompt, UTC timestamp, model)
//   Stop             -> appends a RESPONSE entry (final assistant text of the turn, model)
//
// Captures ONLY the prompt and the final response. Thinking, tool calls, tool
// results and intermediate assistant text are deliberately not written.
//
// One file per session in .agent-logs/: YYYY-MM-DD_HH-MM-SS_<session-id>.md
// Entries are append-only. The only after-the-fact write is the frontmatter
// header (counts / times / latest model), plus filling in a "(pending)" model
// on a PROMPT entry when the model was not yet knowable at prompt time (first
// prompt of a fresh session, before any assistant message exists).

const fs = require('fs');
const path = require('path');

const TOOL = 'claude-code';
const AUTHOR = 'Santhoshini2989';
const PROJECT = 'fanthom-clone';
const LOG_DIR = '.agent-logs';
const PENDING_MODEL = '(pending)';

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch (e) { return ''; }
}

function readTranscript(p) {
  if (!p || !fs.existsSync(p)) return [];
  const out = [];
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (e) { /* partial line, skip */ }
  }
  return out;
}

function isMainAssistant(e) {
  return e && e.type === 'assistant' && !e.isSidechain && e.message && e.message.role === 'assistant';
}

function latestModel(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (isMainAssistant(e) && e.message.model) return e.message.model;
  }
  return process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || null;
}

// Final response = text blocks of the trailing run of main-thread assistant
// entries after the last user entry (real prompt or tool_result).
function finalResponse(entries) {
  const texts = [];
  let model = null;
  let sawAssistant = false;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e || e.isSidechain) continue;
    if (e.type === 'user') { if (sawAssistant) break; else continue; }
    if (!isMainAssistant(e)) continue;
    sawAssistant = true;
    if (!model && e.message.model) model = e.message.model;
    const c = e.message.content;
    if (Array.isArray(c)) {
      for (const b of c) if (b.type === 'text' && b.text) texts.unshift(b.text);
    } else if (typeof c === 'string') {
      texts.unshift(c);
    }
  }
  return { text: texts.join('\n\n'), model };
}

function tsForName(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}_${p(d.getUTCHours())}-${p(d.getUTCMinutes())}-${p(d.getUTCSeconds())}`;
}

function findSessionFile(dir, sessionId) {
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find((f) => f.endsWith(`_${sessionId}.md`));
  return hit ? path.join(dir, hit) : null;
}

function frontmatter(meta) {
  return [
    '---',
    `session_id: ${meta.session_id}`,
    `date: ${meta.date}`,
    `author: ${meta.author}`,
    `model: ${meta.model}`,
    `tool: ${meta.tool}`,
    `project: ${meta.project}`,
    `total_exchanges: ${meta.total_exchanges}`,
    `first_prompt_time: ${meta.first_prompt_time}`,
    `last_prompt_time: ${meta.last_prompt_time}`,
    '---',
  ].join('\n');
}

function parseFrontmatter(body) {
  const m = body.match(/^---\n([\s\S]*?)\n---/);
  const meta = {};
  if (m) for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, headerLen: m ? m[0].length : 0 };
}

function main() {
  const raw = readStdin();
  let input = {};
  try { input = JSON.parse(raw); } catch (e) { input = {}; }

  const cwd = input.cwd || process.cwd();
  const sessionId = input.session_id || 'unknown-session';
  const shortId = sessionId.slice(0, 8);
  const event = input.hook_event_name || (input.prompt !== undefined ? 'UserPromptSubmit' : 'Stop');
  const now = new Date();
  const nowIso = now.toISOString();
  const entries = readTranscript(input.transcript_path);

  const dir = path.join(cwd, LOG_DIR);
  fs.mkdirSync(dir, { recursive: true });

  let file = findSessionFile(dir, sessionId);
  let body = file ? fs.readFileSync(file, 'utf8') : '';

  if (!file) {
    // First event of this session: create the file.
    file = path.join(dir, `${tsForName(now)}_${sessionId}.md`);
    const meta = {
      session_id: sessionId,
      date: nowIso.slice(0, 10),
      author: AUTHOR,
      model: latestModel(entries) || PENDING_MODEL,
      tool: TOOL,
      project: PROJECT,
      total_exchanges: 0,
      first_prompt_time: nowIso,
      last_prompt_time: nowIso,
    };
    body = `${frontmatter(meta)}\n\n# Session Log - ${meta.date}\n\nSession: \`${shortId}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\`\n\n---\n`;
  }

  const { meta, headerLen } = parseFrontmatter(body);
  let rest = body.slice(headerLen);

  if (event === 'UserPromptSubmit') {
    const model = latestModel(entries) || PENDING_MODEL;
    const num = (rest.match(/\[LOG_ENTRY type=PROMPT /g) || []).length + 1;
    rest += `\n[LOG_ENTRY type=PROMPT num=${num} session=${shortId}]\ntimestamp: ${nowIso}\nmodel: ${model}\n\n${input.prompt || ''}\n\n`;
    meta.total_exchanges = String(num);
    meta.last_prompt_time = nowIso;
    if (model !== PENDING_MODEL) meta.model = model;
    if (!meta.first_prompt_time || meta.total_exchanges === '1') meta.first_prompt_time = nowIso;
  } else if (event === 'Stop') {
    const { text, model: respModel } = finalResponse(entries);
    const model = respModel || latestModel(entries) || PENDING_MODEL;
    const prompts = (rest.match(/\[LOG_ENTRY type=PROMPT /g) || []).length;
    const responses = (rest.match(/\[LOG_ENTRY type=RESPONSE /g) || []).length;
    const num = Math.max(prompts, responses + 1);
    // Backfill a model that was unknowable at prompt time (first prompt of a session).
    if (model !== PENDING_MODEL) rest = rest.split(`model: ${PENDING_MODEL}`).join(`model: ${model}`);
    rest += `\n[LOG_ENTRY type=RESPONSE num=${num} session=${shortId}]\ntimestamp: ${nowIso}\nmodel: ${model}\n\n${text}\n\n`;
    if (model !== PENDING_MODEL) meta.model = model;
  } else {
    return; // not an event we log
  }

  fs.writeFileSync(file, `${frontmatter(meta)}${rest}`);
}

try { main(); } catch (e) {
  // Never block the agent on a logging failure; surface it on stderr instead.
  process.stderr.write(`[capture hook] ${e && e.stack || e}\n`);
}
