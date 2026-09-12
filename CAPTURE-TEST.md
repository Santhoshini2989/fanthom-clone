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

### Canary 2 and 3 — interactive sessions in the desktop app

_To be pasted below by the author after sending the canary from the desktop app in the
original session and again in a second session opened in this folder. See "Status" below._

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
- [x] Prompt capture verified in a fresh, separately launched session (Canary 1)
- [x] Response extraction verified against a synthetic end-of-turn transcript
- [ ] Interactive canary in the original desktop session
- [ ] Interactive canary in a second desktop session opened in this folder
