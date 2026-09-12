# Fathom – frontend reconstruction

A high-fidelity, frontend-only recreation of [Fathom](https://fathom.video), the AI meeting notetaker: the marketing site, the auth pages, and the authenticated product (My Calls, the integrated call page with player + summary + transcript + highlights + Ask Fathom, sharing, folders, playlists, alerts, search, settings, templates). Everything runs on realistic local mock data; there is no backend, bot, transcription, or calendar integration in this phase.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Useful entry points:

| Route | What it is |
| --- | --- |
| `/` | Marketing landing (fathom.ai) |
| `/pricing` | Pricing with Individuals/Teams and Monthly/Annually toggles |
| `/users/sign_in`, `/users/sign_up` | Auth pages; sign-up continues into onboarding |
| `/my_calls` | Dashboard grid, grouped by period, infinite loading, Ask Fathom panel |
| `/calls/361135142` | Q4 Product Strategy – 8 people, ~1h, highlights, action items |
| `/calls/361148920` | Engineering Standup – 4 people, 15 min |
| `/calls/361152077` | Northwind discovery – sales call with external attendees |
| `/calls/361160311` | Processing state · `/calls/361159804` failed state |
| `/share/361152077` | Public share view as a non-participant with Limited access |
| `/search?q=retention` | Search results across meetings, transcript moments and highlights |
| `/customize` | Settings (personal, Organization, Team, Users, Meeting Types) |
| `/folders`, `/playlists`, `/alerts`, `/team_calls`, `/refer` | Library and account pages |

`npm run build` and `npm run lint` are both clean.

## What was verified, and how

The recon record is in [docs/RECON.md](docs/RECON.md): route map, screen inventory, interaction inventory, design tokens sampled from Fathom's public stylesheet and screenshots, and an explicit **NOT VERIFIED** list. Sources were limited to the public marketing site, the public sign-in/sign-up pages (including the app's public CSS and font manifest), and help-center articles with their screenshots. No account was created and nothing behind authentication was accessed, so the live meeting workflow could not be exercised; its observable outputs (recording page, transcript, summary, highlights, share links) are reconstructed from documentation and screenshots.

## Architecture

```
app/                      routes (App Router)
  page.tsx, pricing/      marketing
  users/sign_in|sign_up   auth + onboarding
  my_calls, team_calls, folders, playlists, alerts, search, refer, customize
  calls/[id]              call page · share/[id] public view
components/
  brand/                  logo mark, wordmark, spinner (original SVG)
  ui/                     button, dropdown, modal, select, tabs, toggle, tooltip, toast, avatar, badge, input
  layout/                 top bar, library tabs, app shell, notifications, user menu, library page frame
  meetings/               card, grid, thumbnail, call view, sidebar, share modal, states, visibility, platform icons
  player/                 simulated recording player with a shared playback clock
  transcript/             transcript with highlights, action items, bookmarks, edit / change speaker / trim
  ai/                     summary panel (templates, languages, copy) and customize modal
  ask/                    Ask Fathom panel (per meeting and account-wide)
  search/                 top-bar AI search and full results
  settings/               personal + admin settings
  marketing/              nav, footer, starfield, CTA, hero vignettes, stub page template
data/                     mock data: users/teams, templates, meetings (4 hand-written + generated), marketing copy
lib/                      store (zustand + localStorage), playback clock, search/ask engine, formatting, copy-summary text
```

The player has no media file. A `usePlayback` clock drives everything: the gallery view lights up the current speaker, the transcript follows and seeks, summary bullets and action items jump to moments, highlights are ranges on the same timeline, and Ask Fathom answers cite timestamps. Highlight creation stores a time range; clip links (`/share/:id?clip=`) open at that range.

State that would live in a backend (meetings, highlights, action items, shares, folders, playlists, alerts, settings, transcript edits, trims) lives in a versioned zustand store persisted to localStorage, shaped so a real API can replace it.

## Agent capture

Prompts and final responses from the coding session are captured automatically to `.agent-logs/` by hooks in `.claude/settings.json`; see [CAPTURE-TEST.md](CAPTURE-TEST.md).
