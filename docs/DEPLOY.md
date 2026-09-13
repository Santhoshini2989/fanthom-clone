# Making it live: Railway and Vercel

The app has three moving parts:

| Part | What it needs |
| --- | --- |
| **Web** (Next.js UI + API) | PostgreSQL, a writable disk for recordings and clips, ffmpeg (bundled via ffmpeg-static) |
| **Bot worker** | PostgreSQL, Chromium (Playwright), a signed-in Google profile, the same disk as the web app **or** `WEB_BASE_URL` so it can upload recordings |
| **PostgreSQL** | any Postgres 14+ |

The two services only talk through the database (the bot polls for `BOT_REQUESTED` meetings), so they can run on different machines. Recordings are the one shared thing: if the bot is not on the same disk as the web app, set `WEB_BASE_URL` on the bot and it uploads each finished recording to `POST /api/meetings/:id/recording`.

**Recommended layout**: web + Postgres on Railway; the bot on Railway too (headless), or on any machine with Chrome pointed at the Railway database. Vercel can host the web app but not the recordings or the bot, so it is documented last with its limits.

The app has no login of its own: it is a single-workspace tool. Do not put it on a public URL without protection (Railway's private networking, an access proxy, or at least a random hostname).

---

## Option A: Railway (everything)

One Dockerfile (based on Microsoft's Playwright image, which has Chromium and its libraries) serves both services. Two Railway services are created from the same repo with different start commands.

### A.1 Database

1. New project → **Add PostgreSQL**.
2. Copy its `DATABASE_URL` (Railway exposes it as a variable reference `${{Postgres.DATABASE_URL}}`).

### A.2 Web service

1. **New service → GitHub repo** → pick this repository. Railway detects the `Dockerfile`.
2. **Variables**:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `GEMINI_API_KEY` | your key |
   | `STORAGE_DIR` | `/data/storage` |
   | `GEMINI_TRANSCRIBE_MODEL` | `gemini-3.5-transcribe` |
   | `GEMINI_ANALYSIS_MODEL` | `gemini-3.6-flash` |

3. **Volume**: add a volume mounted at `/data`. This keeps recordings and clips across deploys.
4. **Settings → Deploy → Start command**: `npm run start:cloud` (runs `prisma migrate deploy` then `next start` on Railway's `$PORT`).
5. **Networking → Generate domain**. Open `https://<domain>/api/health`; it should report `db`, `gemini` and `ffmpeg` true.
6. Seed demo data once if you want the dashboard populated: **service shell** (or `railway run`) → `npm run db:seed`.

### A.3 Bot service

1. **New service → same GitHub repo** (Railway lets one repo back several services).
2. **Variables**: the same as the web service, plus

   | Variable | Value |
   | --- | --- |
   | `BOT_BROWSER_CHANNEL` | `chromium` |
   | `BOT_PROFILE_DIR` | `/data/bot-profile` |
   | `RECORDING_PROVIDER` | `real` |
   | `WEB_BASE_URL` | the web service's public URL (only needed if the bot does **not** share the web volume) |

3. **Volume**: mount the **same** volume at `/data` if Railway offers to share it; otherwise give the bot its own volume and set `WEB_BASE_URL` so recordings are uploaded to the web app.
4. **Start command**: `npm run bot:cloud` (headless worker). No public networking needed.

### A.4 Signing the cloud bot in

There is no screen on Railway, so the Google sign-in happens on your machine and the browser profile is copied up once:

1. Locally: `BOT_BROWSER_CHANNEL=chromium npm run bot:login`, sign in with the notetaker's Google account, close the window. (Use the Chromium channel so the profile format matches the container.)
2. Zip the folder: `.bot-profile/` → `bot-profile.zip`.
3. Open a shell into the bot service (Railway → service → **Shell**, or `railway shell`), upload the zip (`railway` CLI: `railway run --service bot -- true` is not needed; use the web shell's upload or `scp`-style copy through `railway ssh`), and extract it to `/data/bot-profile`.
4. Redeploy the bot service. The log should show `Bot worker started {... "browser":"chromium", "headless":true}`.

Google may ask the account to re-verify the first time it is used from a new location. If the bot logs `sign-in required`, repeat the steps above.

**Known limit**: real tab-audio capture (`getDisplayMedia` inside Chromium) is proven on a desktop Chrome window. In headless mode on a server it may not deliver an audio track; the bot then logs `Real capture failed … falling back to MOCK` and the recording is marked MOCK in the UI. If that happens, run the bot on a machine with a display (Option B) and keep everything else on Railway.

---

## Option B: web on Railway, bot on a desktop machine

Best fidelity for audio capture, and no profile copying.

1. Do A.1 and A.2.
2. On the desktop machine (Windows, macOS or Linux with Chrome), clone the repo, `npm install`, `npx playwright install chromium`, and create `.env` with:

   ```
   DATABASE_URL=<the Railway Postgres public URL>
   GEMINI_API_KEY=...
   WEB_BASE_URL=https://<your-web-domain>
   RECORDING_PROVIDER=real
   ```

   Use the **public** connection string from the Postgres service (Networking → TCP proxy) since the machine is outside Railway's private network.
3. `npm run bot:login` once, then `npm run bot`.

The bot claims jobs from the cloud database, records with the local Chrome, transcribes and analyzes (writing to the cloud database), and uploads the WAV to the web app so playback and clips work there.

---

## Option C: Vercel (web only)

Vercel can serve the Next.js UI and most API routes, with three hard limits:

- **No persistent disk.** Serverless functions can only write to `/tmp`, which is wiped between invocations. Recording playback, clip cutting and the Import flow need a persistent `STORAGE_DIR`, so they do not work on Vercel as-is.
- **Function size and time.** The ffmpeg binary alone is about 70 MB (over the 50 MB bundle limit), and transcription runs longer than a function is allowed to.
- **No long-running process.** The bot cannot run on Vercel.

So on Vercel the app behaves as a read-only dashboard over a database that the bot fills in from elsewhere. If that is what you want:

1. Create a Postgres (Railway, Neon or Vercel Postgres) and run `DATABASE_URL=... npx prisma migrate deploy` from your machine.
2. Import the repo in Vercel. Framework: Next.js. Build command: `npm run build`.
3. Environment variables: `DATABASE_URL`, `GEMINI_API_KEY`, `STORAGE_DIR=/tmp/storage`.
4. Run the bot on a machine with Chrome (Option B, step 2) against the same `DATABASE_URL`, without `WEB_BASE_URL`.

Ask Fathom, search, summaries, action items, highlights, sharing, folders and settings all work there; the player falls back to the simulated clock because the audio file is not reachable.

For the full experience, use Railway (Option A or B).

---

## Checklist before going live

- `GEMINI_API_KEY` is set only as an environment variable on the host. It is not in the repo (`.env` is ignored, `.env.example` has a blank value).
- `.bot-profile/`, `.pgdata/` and `storage/` are not committed.
- `/api/health` returns `ok: true` with `db`, `gemini` and `ffmpeg` true.
- The bot log shows `Bot worker started` and, on a test meeting, `admitted` then `recording started (real tab audio)`.
- The URL is not public without some protection; the app has no authentication.
