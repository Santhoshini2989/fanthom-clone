# Walkthrough: first run on your machine

This takes about 15 minutes the first time. Afterwards it is two commands.

You need: Node 22.12 or newer, Google Chrome installed, a Gemini API key from https://aistudio.google.com/apikey, and a spare Google account for the notetaker (any Gmail account that is **not** the one hosting your meetings).

## 1. Install

```bash
git clone git@github.com:Santhoshini2989/fanthom-clone.git
cd fanthom-clone
npm install
npx playwright install chromium
```

`npm install` also generates the Prisma client. Nothing else is installed on your system: PostgreSQL and ffmpeg come from npm packages.

## 2. Configure

```bash
cp .env.example .env
```

Open `.env` and set the key:

```
GEMINI_API_KEY=AIza...
```

Leave the rest at their defaults for a local run. `.env` is git-ignored.

## 3. Start the database

In its own terminal, and keep it open:

```bash
npm run db:start
```

First run creates `.pgdata/` and the `fathom` database. You should see `PostgreSQL ready on 127.0.0.1:5433`. Then, in a second terminal:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

The seed loads the demo meetings so the dashboard is not empty. Re-running it wipes and reloads them.

## 4. Sign the notetaker in (once)

```bash
npm run bot:login
```

A Chrome window opens on the Google sign-in page. Sign in with the notetaker's Google account, wait until you see the Google account page, then close the window. The session is stored in `.bot-profile/` on this machine only. The app never sees the password.

Why a separate account: Google Meet refuses anonymous guests in meetings hosted by personal Google accounts, and if the bot used the host's own account Meet would offer to "switch" your call instead of adding a participant.

## 5. Run

```bash
npm run dev:all
```

This starts the web app on http://localhost:3000 and the bot worker in the same terminal (prefixed `web` and `bot`). Open http://localhost:3000/api/health and check that it says `"db":true,"gemini":true,"ffmpeg":true`.

## 6. Record a live Google Meet

1. In your normal browser, start a meeting at https://meet.google.com and copy its link (`https://meet.google.com/xxx-xxxx-xxx`).
2. Open http://localhost:3000/my_calls and click **Record**.
3. Paste the link, optionally give it a title, click **Send notetaker**.
4. You land on the call page, which shows "Waiting for the notetaker to pick up this meeting". Within a few seconds the bot terminal prints `claimed meeting`, a Chrome window opens on the Meet lobby, and the page changes to "Joining the meeting".
5. If your meeting requires admission, Meet shows you "Someone wants to join". Click **Admit**. The bot waits up to five minutes for this. If the meeting is open to anyone, it enters directly.
6. The call page shows a red **REC** badge and the bot terminal prints `recording started (real tab audio)`.
7. Talk for a minute or two. A decision, an action item with a name and a day, and a question give the summary something to work with.
8. Click **Stop recording** on the call page, or leave the meeting. The bot also leaves on its own 90 seconds after everyone else has gone.

The page moves through Processing, Transcribing and Analyzing, then reloads with the summary. A two-minute recording takes about a minute to process.

## 7. What to look at

- **Player**: press play. This is the real audio streamed from `storage/recordings/<meetingId>.wav`. The current speaker tile lights up.
- **Transcript tab**: diarized speakers with timestamps. Clicking a line seeks the player. Hover a line to add a highlight.
- **Summary tab**: purpose, key takeaways, topics, next steps and decisions, each bullet timestamped. The template pill switches formats (Sales, Q&A, and so on); the gear regenerates with your own instructions.
- **Ask Fathom tab**: ask anything about the call. Answers cite moments you can click.
- **Sidebar**: action items with checkboxes, highlights with "Download Audio Clip" (cut with ffmpeg), sharing, folders and playlists.
- **Search** in the top bar finds titles, transcript lines and highlights across every meeting.

## 8. Import a recording instead of a live meeting

**Record → Import recording** accepts wav, mp3, m4a, webm, ogg, flac and mp4 and runs the same pipeline. From the CLI:

```bash
npm run process -- path/to/recording.wav "Title"
```

## 9. Day-to-day commands

| Command | Use |
| --- | --- |
| `npm run db:start` | Start the database (needed before anything else) |
| `npm run dev:all` | Web app + bot worker |
| `npm run dev` / `npm run bot` | The two halves separately |
| `npm run process -- <meetingId>` | Re-run transcription and analysis for a meeting |
| `npm run test` | Unit and integration tests (Gemini mocked) |
| `npm run db:studio` | Browse the database |

## 10. When something goes wrong

The call page shows the reason on the failed screen with **Retry**. The bot terminal logs every lobby state it sees (`waiting for host admission`, `admitted`, `explicitly denied`, `timed out`) and saves a screenshot to `storage/work/<meetingId>/` on denial or timeout. The event log for a meeting is at `http://localhost:3000/api/meetings/<meetingId>/events`.

| Message | Meaning |
| --- | --- |
| Google Meet refused the anonymous guest | The bot profile is not signed in. Run `npm run bot:login`. |
| Could not find the Join / Ask to join button within 45s | Wrong link, or the meeting has not started. Check `storage/work/<id>/bot-lobby-timeout.png`. |
| timed out: not admitted within 300s | Nobody clicked Admit. |
| Google Meet refused entry: "…" | The host declined, or the bot was removed. |
| GEMINI_API_KEY is not set | Add the key to `.env`, restart, click Retry processing. |
| This model … is no longer available | Google renamed a model. Change `GEMINI_ANALYSIS_MODEL` or `GEMINI_TRANSCRIBE_MODEL` in `.env`. |
| Recording (MOCK: silent audio) | Real tab capture failed and the bot fell back to a silent placeholder. Run the bot non-headless with Chrome. |
