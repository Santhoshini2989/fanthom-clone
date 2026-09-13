# Fathom clone – local-first AI notetaker

A high-fidelity recreation of [Fathom](https://fathom.video) that actually works end to end on one machine: a Playwright bot joins your Google Meet as a normal participant, records the call audio, Gemini transcribes it with speaker diarization, Gemini produces the summary / action items / highlights, and the existing Fathom UI (My Calls, call page with player + transcript + summary + Ask Fathom, folders, playlists, alerts, search, sharing) reads everything from a local PostgreSQL database.

No cloud services besides the Gemini API. No Redis, no Docker, no admin installs: PostgreSQL and ffmpeg ship as npm packages.

## Quick start

1. **Install** (Node 22.12+):
   ```bash
   npm install
   ```
2. **Create your `.env`** from the template and put your Gemini key in it:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set
   ```
   GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
   ```
   `.env` is git-ignored. The key is read only from this environment variable and is never logged or stored anywhere else.
3. **Start the database** (embedded PostgreSQL 18, data in `.pgdata/`, git-ignored). Leave this running in its own terminal:
   ```bash
   npm run db:start
   ```
4. **Create the schema and seed demo data** (the same demo meetings the UI shipped with):
   ```bash
   npm run db:migrate
   ```
   ```bash
   npm run db:seed
   ```
5. **Install the bot browser** once:
   ```bash
   npx playwright install chromium
   ```
6. **Sign the bot's Google account in** once. This opens a browser window on the persistent profile in `.bot-profile/` (git-ignored). Sign in, then close the window. No password ever passes through this app.
   ```bash
   npm run bot:login
   ```
7. **Run the app and the bot worker**:
   ```bash
   npm run dev:all
   ```
   or in two terminals, `npm run dev` and `npm run bot`.
8. Open http://localhost:3000/my_calls, click **Record**, paste a `https://meet.google.com/xxx-xxxx-xxx` link, and **Send notetaker**. Admit the notetaker when it asks to join. Click **Stop recording** on the call page (or just end the meeting). The page moves through Processing to the finished summary automatically.

Health check: http://localhost:3000/api/health reports `db`, `gemini` and `ffmpeg` readiness.

### Import an existing recording instead

**Record → Import recording** in the UI uploads a wav/mp3/m4a/webm/mp4 file and runs the same pipeline. From the CLI:

```bash
npm run process -- path/to/meeting.wav "Title of the meeting"
```

Re-run transcription and analysis for any meeting that already has a recording:

```bash
npm run process -- <meetingId>
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js app + API on :3000 |
| `npm run bot` | Bot worker: polls the DB for requested meetings, joins, records, processes. `-- --headless` for headless Chromium |
| `npm run bot:login` | Opens the persistent bot profile for Google sign-in |
| `npm run dev:all` | `dev` and `bot` together |
| `npm run db:start` / `db:stop` | Embedded PostgreSQL on `DATABASE_URL` |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:seed` | Reset and seed demo meetings, users, folders, playlists, alerts |
| `npm run db:studio` | Prisma Studio |
| `npm run process -- <id or file>` | Process a meeting or import a file |
| `npm run test` | Vitest: state machine, transcript merge, analysis validation, service integration (DB tests skip when the DB is down) |
| `npm run build` / `lint` | Production build and ESLint |

## Environment

All keys are documented in [.env.example](.env.example). The important ones:

| Key | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for transcription, analysis, Ask Fathom and summary regeneration. Without it, meetings that need processing land in Failed with a clear message and a Retry button. |
| `DATABASE_URL` | Defaults to the embedded server on 127.0.0.1:5433. Any PostgreSQL works. |
| `RECORDING_PROVIDER` | `real` captures the Meet tab's audio. `mock` writes a silent placeholder that is clearly labelled MOCK in the DB and the UI. If real capture fails, the bot falls back to mock and logs it. |
| `BOT_BROWSER_CHANNEL` | `chrome` uses your installed Google Chrome (best for Google sign-in), `chromium` the Playwright-managed one, `msedge` Edge. Falls back to Chromium if the channel is missing. |
| `BOT_NAME` | Display name the bot uses when Meet asks for one (guest joins). |
| `BOT_ADMISSION_TIMEOUT_SECONDS`, `BOT_ALONE_TIMEOUT_SECONDS`, `BOT_MAX_RECORDING_SECONDS` | Give up waiting in the lobby, leave after everyone else has gone, hard cap per recording. |
| `TRANSCRIBE_CHUNK_SECONDS` | Chunk size for long recordings. Gemini diarization is limited to 30 minutes per request, so recordings are split with a 2 s lead-in, transcribed per chunk, and merged with continuous timestamps and unified speaker labels. |

## How it works

```
UI (existing Next.js app)  ──fetch──▶  app/api/*  ──▶  server/meetings/service.ts  ──▶  PostgreSQL (Prisma)
                                                              ▲                              ▲
bot/index.ts  ─claims BOT_REQUESTED─▶  bot/meet.ts  ─records─┘   server/pipeline/process.ts ─┘
                                        (Playwright)              transcribe (gemini-3.5-transcribe)
                                                                  analyze   (gemini-2.5-flash, JSON schema)
```

**Meeting lifecycle** is an explicit state machine (`server/meetings/state.ts`), every transition logged as a `JobEvent`:

```
SCHEDULED → BOT_REQUESTED → BOT_JOINING → RECORDING → PROCESSING → TRANSCRIBING → ANALYZING → COMPLETED
any → FAILED (message stored) → Retry re-enters at BOT_REQUESTED or PROCESSING
```

- **Job claiming**: the bot worker polls the DB and claims a meeting with a conditional `updateMany` (status BOT_REQUESTED and unclaimed), so several workers never take the same meeting. No queue infrastructure.
- **Bot** (`bot/meet.ts`): opens the link in the persistent profile, sets its name, mutes mic and camera, clicks *Ask to join* / *Join now*, waits to be admitted (respects denial), records, and leaves on Stop, when alone, when the call ends, or at the cap. It never bypasses Google authentication or meeting admission.
- **Recording** (`server/recording/provider.ts`): a `RecordingProvider` interface with `LocalTabAudioRecorder` (getDisplayMedia + MediaRecorder inside the Meet tab, chunks streamed to `storage/recordings/<id>.webm`, then converted to 16 kHz WAV) and `MockRecordingProvider`.
- **Transcription** (`server/ai/transcribe.ts`): `gemini-3.5-transcribe` through the Interactions API with word-level timestamps and speaker labels; words are grouped into segments on speaker change or pauses.
- **Analysis** (`server/ai/analyze.ts`): `gemini-2.5-flash` with a JSON response schema, validated with zod, one automatic repair pass, timestamps clamped to the recording. The prompt forbids inventing content and separates explicit from implied decisions. Same module powers template summaries (Sales, Q&A, …), user instructions, and Ask Fathom with `[[meeting@seconds]]` citations.
- **Playback**: the player uses a real `<audio>` element streamed with Range support from `/api/recordings/:id` when a recording exists; seeded demo meetings keep the simulated clock. Transcript, summary bullets, highlights and Ask citations all seek the same clock.
- **Highlights and clips**: manual highlights are time ranges stored in the DB; *Download Audio Clip* cuts the range with ffmpeg into `storage/clips/`.
- **Search** (`/api/search`): titles, participants, topics, decisions, action items, highlight text and transcript lines (ILIKE) across the DB.

### API (all local, JSON)

```
GET/POST   /api/meetings                 list · create {title?, meetUrl?, startNow?}
GET/PATCH/DELETE /api/meetings/:id       read · rename/visibility/share access/folder · delete (+files)
POST /api/meetings/:id/start-bot | stop | retry | process
GET  /api/meetings/:id/status | transcript | summary | action-items | highlights | clips | events
POST /api/meetings/:id/highlights | action-items | comments | shares | clips | transcript | summary | ask
POST /api/meetings/import                multipart file upload
GET  /api/recordings/:meetingId          audio stream (Range)
GET  /api/clips/:id/file
GET  /api/search?q=                      POST /api/ask {question}
GET  /api/bootstrap · /api/health · /api/settings · /api/library/{folders,playlists,playlist-clips,alerts,highlight-types}
```

Inputs are validated with zod (Meet URLs must match `https://meet.google.com/xxx-xxxx-xxx`, uploads are size/type checked), and every AI response is schema-validated before it is stored.

## Storage and security

- `storage/{recordings,clips,exports}` holds all media. It is git-ignored along with `.env`, `.bot-profile/`, `.pgdata/` and audio files.
- The Gemini key is only ever read from `GEMINI_API_KEY`. Logs redact anything that looks like a key, token, cookie or password.
- No Google credentials are stored by the app. Sign-in happens in the real Chrome UI inside the isolated profile, exactly like a user logging in.
- The bot joins as a visible participant with a name and waits for admission. There is no CAPTCHA solving, no lobby bypass, no impersonation.
- When the mock recorder is used, the recording is marked `provider=MOCK` in the database and the UI shows a warning. A silent file is never presented as a real capture.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Meeting stays at "Waiting for the notetaker" | Start `npm run bot`. The page shows when a worker has claimed it. |
| Failed: "bot profile is not signed in" | Run `npm run bot:login`. |
| Failed: "Could not find the Join / Ask to join button" | Check the Meet link is live and the code is valid. |
| Failed: "GEMINI_API_KEY is not set" | Add the key to `.env`, restart `npm run dev`/`bot`, click **Retry processing**. |
| Recording is silent / MOCK warning | Real tab capture needs Chromium flags that headless mode may not honour. Run the bot non-headless (default) with `RECORDING_PROVIDER=real`. |
| `/api/health` says `db: false` | `npm run db:start` is not running, or `DATABASE_URL` points elsewhere. |
| Port 5433 already in use | Change `DATABASE_URL` in `.env` to another port. |
| `npm run build` fails with EPERM on `query_engine-windows.dll.node` | Windows: stop `npm run dev` first (it holds the Prisma engine open), or run `npx next build`. |

## Project layout

```
app/                    routes; app/api/* is the local backend
bot/                    bot worker (index.ts) and Google Meet automation (meet.ts)
components/             UI (unchanged design; call-states, record-meeting and small hooks wire the API)
data/                   UI types, demo users/templates/meetings used by the seed
lib/                    api client, API-backed zustand store, playback clock, local search fallback
prisma/                 schema, migrations, seed
scripts/                embedded Postgres control, process/import CLI
server/                 env, logger, db, state machine, mapper, service, ffmpeg, gemini, transcribe, analyze, recording providers, pipeline
storage/                recordings, clips, exports (git-ignored)
tests/                  vitest suites with mocked Gemini
docs/RECON.md           frontend reconstruction notes from the earlier phase
```

## Agent capture

Prompts and final responses from the coding session are captured automatically to `.agent-logs/` by hooks in `.claude/settings.json`; see [CAPTURE-TEST.md](CAPTURE-TEST.md).
