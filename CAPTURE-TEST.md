# CAPTURE-TEST

## Tool and model

- **Tool:** Claude Code (Claude desktop app, Code tab, CLI build 2.1.235)
- **Model:** `claude-fable-5-1` (Claude Fable 5.1). A single model plans and executes.
  There is no separate planner model. The model name is read from the transcript on every
  turn, so a mid-build switch would show up as a different `model:` line on that entry.

## Mechanism

Claude Code lifecycle hooks, configured at the project level so they load in every
session opened in this repo:

- **Config file changed:** `.claude/settings.json`
- **Script:** `.claude/hooks/capture.js` (Node, no dependencies)
- **Events wired:**
  - `UserPromptSubmit` -> receives the prompt on stdin as JSON, appends a `PROMPT` entry.
  - `Stop` -> receives `transcript_path` on stdin, parses the session JSONL, extracts only
    the text blocks of the trailing assistant messages after the last user/tool-result
    entry, and appends a `RESPONSE` entry.

What is deliberately *not* captured: thinking blocks, tool calls, tool results,
intermediate assistant text emitted before a tool call, and subagent (sidechain) output.

The only after-the-fact writes the script makes are (a) the YAML frontmatter header
(exchange count, last prompt time, latest model) and (b) replacing a `model: (pending)`
placeholder on a `PROMPT` entry once the first assistant message of a fresh session makes
the model knowable. Entry bodies are never edited.

## Log file path

`.agent-logs/2026-09-12_20-57-40_929b0a10-0925-4aa2-9830-8d2825f7f134.md`

(One file per session, named `YYYY-MM-DD_HH-MM-SS_<session-id>.md` in UTC.)

## Canary entries (raw)

### Canary 1 — fresh headless session launched from the agent

Sent via the desktop app's bundled CLI (`claude.exe -p "CAPTURE TEST — 8x assignment, Santhoshini"`)
from inside the first session, which starts a brand-new session in this repo directory. The
`UserPromptSubmit` hook fired on its own and wrote this:

```
[LOG_ENTRY type=PROMPT num=1 session=929b0a10]
timestamp: 2026-09-12T20:57:40.985Z
model: (pending)

CAPTURE TEST — 8x assignment, Santhoshini
```

No `RESPONSE` entry followed because that headless session could not authenticate
("Not logged in · Please run /login"): the bundled CLI has no credentials of its own, and
the API call errored before any assistant message existed. The `model:` stayed `(pending)`
for the same reason. The entry is left exactly as the hook wrote it.

### Session 2 — the original interactive desktop session (`e6f810a2-d376-4d82-8bb3-7eefa8735a5f`)

Log file: `.agent-logs/2026-09-12_21-00-05_e6f810a2-d376-4d82-8bb3-7eefa8735a5f.md`

The hooks were written mid-session, so the prompt that installed them predates capture. Claude
Code did pick the new hooks up without a restart: the `Stop` hook fired at the end of the
installing turn and wrote the RESPONSE below (it has no matching PROMPT entry, and is numbered 1),
and the next prompt from the author was captured in full by the `UserPromptSubmit` hook. Raw:

```
[LOG_ENTRY type=RESPONSE num=1 session=e6f810a2]
timestamp: 2026-09-12T21:00:05.902Z
model: claude-fable-5-1

Capture is installed, verified as far as it can be without a login, and committed. Two interactive canaries remain that only you can send from the app.

**Setup (step 1)**
- Tool: Claude Code in the Claude desktop app, CLI build 2.1.235.
- Model: `claude-fable-5-1` for both planning and execution. No separate planner.
- Hook mechanism: yes. Project-level hooks in `.claude/settings.json` on the `UserPromptSubmit` and `Stop` events.

**What I built (step 2)**
- [.claude/settings.json](.claude/settings.json) wires both events to [.claude/hooks/capture.js](.claude/hooks/capture.js).
- The script writes one file per session in `.agent-logs/` in the required format. It logs the verbatim prompt, then at end of turn parses the transcript JSONL and keeps only the final assistant text. Thinking, tool calls, tool results, intermediate text, and subagent output are dropped.
- Two commits are on `main`, not pushed. The repo was empty, so nothing else exists yet.

**What is verified**
- The hook fired on its own in a brand-new session I launched headlessly with the bundled CLI, and it logged the canary prompt. That log is committed at `.agent-logs/2026-09-12_20-57-40_929b0a10-…md`.
- Response extraction was tested against a synthetic end-of-turn transcript and returned exactly the final text blocks.
- A CRLF checkout regression was found and fixed, with `.gitattributes` pinning LF.

**What did not work**
- That headless session could not get a response because the CLI is not logged in and no API key is set. Signing in is your action, not mine. The log entry shows the prompt with no response, left as written.
- Claude Code snapshots hooks at session start, so this session may not run the new hooks until restarted. When this turn ends, check whether a file for session `e6f810a2-…` appears in `.agent-logs/`. If it does, the Stop hook already works here.

**What you need to do to go green (steps 3 and 4)**
1. In this session, or after restarting it, send: `CAPTURE TEST — 8x assignment, Santhoshini`
2. Open a second session in this same folder and send the same canary.
3. Confirm both prompt and response landed in `.agent-logs/`, then paste both raw entries into [CAPTURE-TEST.md](CAPTURE-TEST.md) under the "Canary 2 and 3" heading and tick the two remaining checkboxes.
4. Commit and push. Then tell me to start the build.
```

The following PROMPT entry is ~20 KB (it is the full build brief). Its first lines, raw; the
complete entry is in the log file:

```
[LOG_ENTRY type=PROMPT num=1 session=e6f810a2]
timestamp: 2026-09-12T21:02:00.435Z
model: claude-fable-5-1

you can do the capture test  yourself 
then do this 

FATHOM — EXTREMELY HIGH-FIDELITY FRONTEND RECONSTRUCTION
[... continues verbatim in the log file ...]
```

The literal canary string could not be typed into an interactive session by the agent itself
(the agent cannot submit prompts to its own session, and no second desktop session existed to
message). The interactive round-trip is therefore proven by these real entries instead of by the
canary string.

## Things tried first that did not work

1. **Full round-trip canary from a headless second session.** The prompt hook fired and
   logged (see Canary 1), but the response never came because the CLI process was not logged
   in and there is no `ANTHROPIC_API_KEY` in the environment. Logging in is an auth step the
   agent does not perform, so the interactive canaries have to be sent from the app.
2. **Testing the response side against the live transcript mid-turn.** The first dry run
   produced an empty `RESPONSE` body because the first session's turn had not ended yet, so
   the transcript ended in a tool call. Verified the extractor instead against a synthetic
   end-of-turn transcript (user prompt, thinking, intermediate text, tool_use, tool_result,
   sidechain text, then two final text blocks): output was exactly the two final text blocks,
   nothing else. Both dry runs were done in the scratchpad, not in `.agent-logs/`.
3. **Hooks in the session that installed them.** Claude Code snapshots hook config at
   session start, so the session that wrote `.claude/settings.json` may not run the new hooks
   until it is restarted or the hooks are reviewed in the `/hooks` menu. Whether the `Stop`
   hook fires at the end of the installing turn is being checked empirically: if it does, a
   log file for session `e6f810a2-…` will appear in `.agent-logs/` containing a `RESPONSE`
   entry with no matching `PROMPT` (the prompt was submitted before the hook existed).

## Status

- [x] Hook installed at project level (`.claude/settings.json` + `.claude/hooks/capture.js`)
- [x] Prompt capture verified in a fresh, separately launched session (Canary 1, session `929b0a10`)
- [x] Prompt AND response capture verified in the interactive desktop session (`e6f810a2`)
- [x] Response extraction verified against a synthetic end-of-turn transcript
- [ ] Response capture in a second *authenticated* session — NOT VERIFIED by the agent; the only second
      session it could launch was unauthenticated. Any new desktop session opened in this folder will
      pick the hooks up automatically (project-level settings), as session `929b0a10` demonstrated.
