# Fathom reconstruction — reconnaissance inventory

Everything in this document was observed on 2026-09-12 from publicly reachable sources:

- `https://fathom.ai` (marketing site, Webflow) and `https://fathom.ai/pricing`, `/whats-new`, `/overview`
- `https://fathom.video/users/sign_in` and `/users/sign_up` (the public auth pages of the real web app,
  including their public stylesheet `static.fathom.video/.../webApp-*.css` and font manifest)
- `https://help.fathom.video` articles and the screenshots embedded in them (the only legitimate way to
  observe the authenticated product without creating an account, which the agent does not do)

Anything not observed is marked **NOT VERIFIED**. No authentication, paywall, or bot protection was
bypassed; no credentials, tokens, or private endpoints were touched; no proprietary source was copied.
The app bundle was only inspected for public route strings.

## 1. Route map

| Route | Status | Evidence |
| --- | --- | --- |
| `/` | verified | fathom.ai landing |
| `/pricing` | verified | fathom.ai/pricing (Individuals / Teams toggle, Monthly / Annually toggle) |
| `/overview`, `/solutions/*`, `/integrations/*`, `/resource-hub`, `/whats-new`, `/about-us`, `/vs/*`, `/terms`, `/privacy` | verified (links) | marketing nav + footer |
| `/users/sign_in` | verified | live page |
| `/users/sign_up` | verified | live page; `/users/sign_up/confirm-personal-email` string in public bundle |
| `/my_calls` | verified | route string in the public auth bundle; dashboard tab "My Calls" |
| `/team_calls`, `/folders`, `/playlists`, `/alerts` | inferred from tab names | dashboard tabs; exact paths NOT VERIFIED |
| `/calls/:id` | verified | screenshot address bar `fathom.video/calls/361135142` |
| `/share/:id` | verified (existence) | help center: share links viewable without an account; exact path shape NOT VERIFIED |
| `/customize` | verified | help center links "Settings page (https://fathom.video/customize)" |
| Search | verified (UI) | "Search with AI..." field in the top bar (`NEW` badge); results page path NOT VERIFIED |
| Templates | verified (UI) | no standalone route: templates live in the summary-template selector on a call, the customize modal, and "Default Meeting Summary Template" in settings |

## 2. Screen inventory

### Marketing (fathom.ai)
- Announcement bar (gradient pink→purple): "IT'S A WHOLE NEW ORBIT. ANNOUNCING BOT-FREE CAPTURE, A NEW DESKTOP APP, CHATGPT & CLAUDE INTEGRATIONS & MORE" + "SEE WHAT'S NEW" pill + close.
- Nav: logo, pill-shaped menu (Overview, Solutions ▾, Integrations ▾, Resources ▾, Pricing), Book a Demo, Log In, "SIGN UP FREE" cyan pill.
- Hero: starfield on black, H1 "AI notetaking that is out of this world" (Sora 300, clamp 3.5–5.5rem, -2.5px tracking), sub copy, CTA "GET STARTED - FREE FOREVER" (cyan pill, 56px radius, 16×32 padding, uppercase 17.4px), trust row "SOC 2 Type II | GDPR | HIPAA Compliant | SSO / SCIM", G2 5.0 rating, "Used at 300K+ companies" logo strip.
- Sections (copy captured verbatim in `data/marketing.ts`): capture modes, teams vs individuals toggle, Clarity / Momentum / Ease, stats (95%, 6+ hours, 3X), "Works where you meet" integrations, "Every team in flow" role cards, final CTA.
- Footer: Product, Solutions, Integrations, Resources, Company, Compare, Legal columns.
- Pricing: Individuals (Free $0, Premium $16, Team $15) / Teams (Team $15, Business $25, Enterprise $35), Monthly/Annually toggle, feature comparison table, "More ways to get started" cards, FAQ.

### Auth (fathom.video)
- Body `#0a0a0a`, Sora. Centered logo (176×25). Card 463px wide, `rounded-3xl`, `border-off-white/25`, `bg-neutral-900/80`, backdrop blur, padding 56/20/32.
- Sign in: H "Sign in to Fathom" (30px/700), buttons Continue with Google / Microsoft / SSO (288×56, white, radius 8, 16px/500), "New to Fathom? Sign up", legal line 12px white/40.
- Sign up: 🚀, "Sign up for Fathom", "Connect your work email to get started in minutes", Google / Microsoft, "Already have a Fathom account? Sign in".
- Right column testimonial with 19%-opacity quote marks, gradient orange→yellow emphasis, "Rosanne K. / Executive". Footer band: G2 "#1 rated 6,500+ reviews", "Used at over 290K+ companies", logo tiles.

### App shell
- Top bar `#222124`, 44px: wordmark (white text + cyan mark), "Search with AI..." input with `NEW` badge, bell; right: Refer, Settings, Help & Feedback, ★ points (yellow), avatar. Older variant: Customize, Invite, Help, ★.
- Tab bar under top bar: My Calls, Team Calls, Folders, Playlists, Alerts; active tab cyan with 2px cyan underline.
- User menu (avatar): Start Test Call, Tutorial, FAQs, Quick Reference Guide | Privacy Policy, Terms of Service, Security & Compliance, System Status | Download App, Logout.

### My Calls (dashboard)
- Grid of recording cards (4 columns at ~2000px, 3 at ~1590px), grouped by period ("Last Week", "August", ...). Card: 16:9 thumbnail with visibility badge top-right (yellow lock = private), title, date/duration, hover ⋯ menu (Delete Recording).
- Infinite scroll with animated Fathom-mark spinner at the bottom.
- Right-hand Ask Fathom panel on My Calls / Team Calls (Team plan) — NOT VERIFIED visually.

### Call page (`/calls/:id`)
- Left column: player (black, 16:9), controls row (volume, 0:00, cyan progress bar, platform logo), speaker name; tabs SUMMARY / TRANSCRIPT / ASK FATHOM (uppercase, cyan active + underline).
- Summary tab: template pill (icon + name ▾ | gear "Customize"), language pill (flag EN ▾: English, Spanish, Portuguese, German, French, Italian, Dutch), "Copy Summary" cyan button (with/without links). Summary sections: Meeting Purpose, Key Takeaways, Topics (sub-heading + bullets), Next Steps.
- Transcript tab: speaker bubbles (`#3e3f3f`), speaker name + pronouns below, hover "+" on the left → ACTION ITEM, BOOKMARK, highlight types (HIGHLIGHT cyan, POSITIVE REACTION green, NEEDS REVIEW yellow, FEEDBACK orange, custom...). Bubble ⋯ menu: Edit transcript, Change speaker, Trim this section, Trim all sections before/after this section. Copy Transcript button above.
- Highlights render as cyan diamond markers on the left rail with the bubbles filled cyan and a "HIGHLIGHT ⋯ <AI title>" header.
- Right column: title, date, "Add to Folder"; Share (cyan text on dark-cyan pill, link icon) + ⋯ (Download Video, Delete Call); ATTENDEES; ACTION ITEMS ("None detected. Add manually on transcript tab" dashed box, or list with checkboxes and assignee); ANNOTATIONS (Highlight – 26s, description, share-link icon, ⋯: Delete Annotation, Download Video Clip (mp4), Add to Playlist).
- Newer (3.0) variant: "Back to My Meetings", chips (date, avatar, Deals), tabs Summary / Action Items (n) / Transcript, "Enhanced Summary ▾", HubSpot "Synced", Share (cyan pill with lock + link), 1x speed pill, "Share meeting" popover with "Share with attendees".
- Share Recording modal: search "Add teams, users, and emails", PEOPLE WITH ACCESS (name, email, role: Owner / Standard / Limited / Admin ▾ with descriptions, Remove), footer visibility dropdown (Anyone with the link can view / Anyone @domain can view / Only people added can view) + "Copy Link". Email variant: chip + Admin ▾, "Individuals will be emailed the enhanced summary and the link to this recording", Cancel / Share Recording.
- Customize template modal: "Customize Sales Template", instruction textarea with placeholder examples, "Regenerate Summary"; afterwards banner "✨ Customized summary generated — Apply to Future Summaries ✎ ↶".

### Settings (`/customize`)
- Sentence-style header: "Auto-record [dropdown] and auto-share [dropdown] with attendees".
- Sections (uppercase gray headings, cards `#26252a`): VIDEO CONFERENCING (Zoom: Fully Enabled, Google Meet, Teams, Enhanced Recording toggle), PREMIUM FEATURES (Zapier, Bot Name with Save / Cancel / Revert to Default, Auto-Generate Action Items, Default Meeting Summary Template, Recording Notification Banner), INTEGRATIONS (Slack, Salesforce Connected ✓, HubSpot, Close), OPTIONS (Auto Request Recording Consent, Make external meetings visible...), FATHOM APPS, HIGHLIGHT OPTIONS (+ Add More, rename, color, reorder, trash), API (API Key, Webhook Secret, Add Webhook, WEBHOOKS list).
- Team admin tabs: Organization Settings / Team Settings / Users / Meeting Types. Org: RECORDING (Auto-Capture Meetings External/Internal/Unscheduled On/Off/Optional, Single Bot per Meeting, Bot Name, Transcription Dictionary), ACCESS CONTROLS (Team Visibility, Default Share Link Access, SSO), INTEGRATIONS, COMPLIANCE (Auto Request Recording Consent RECOMMENDED, Retention Period Forever, Disable Recording Download / Deletion / Modification, Disable Bot-Free Capture, Exclude team data from AI model training).

### Templates
17 summary templates: General/Enhanced, Chronological (deprecated), Sales, Sales – Sandler, Sales – SPICED, Sales – MEDDPICC, Sales – BANT, Q&A, Demo, Customer Success, Customer Success – REACH, One-on-One, Project Update, Project Kick-Off, Candidate Interview, Retrospective (descriptions verbatim in `data/templates.ts`).

### Search / Ask Fathom
- "Search with AI..." field in top bar. Ask Fathom tab on call pages, panel on My Calls / Team Calls / folders. History is not saved. Suggested prompts by role captured verbatim. Result format NOT VERIFIED beyond "answers with links to moments".

## 3. Design tokens (from the public app stylesheet)
- Fonts: Sora (primary), Inter (secondary), IBM Plex Mono (mono). All on Google Fonts.
- shadcn-style tokens, dark: background #0a0a0a, foreground #fafafa, card #171717, popover #212121, primary #e5e5e5, muted #262626, muted-foreground #a3a3a3, accent #404040, border #ffffff1a, input #ffffff26, ring #a3a3a3, sidebar #171717, destructive #f87171. Light: background #fff, foreground #0a0a0a, muted #f5f5f5, muted-foreground #737373, border #e5e5e5, primary #171717.
- Brand: accent-fathom #00beff, fathom-warn #ffc82f, off-white #faf5f5, off-black #191919. Marketing extras: purple #9600ff, pink #ffa8bb, orange #f55200, yellow #fff58c.
- Radius token 0.625rem; text-tiny 0.625rem; transitions 150ms cubic-bezier(.4,0,.2,1).
- Sampled app surfaces: page #1a1a1a, top bar #222124, card #26252a, menu hover #2d2d31, modal #1b1b20 / footer #141417, input #141417, transcript bubble #3e3f3f, share button #202a30, NEW badge #a98d4d.

## 4. Interaction inventory (verified)
- Tabs switch content without navigation; active tab cyan + underline.
- Summary template selector → regenerates summary body; gear → Customize modal → "Regenerate Summary" → banner with Apply to Future Summaries / edit / revert.
- Language selector changes summary language label.
- Copy Summary copies formatted text: "Title - Month Day", "VIEW RECORDING - N mins (No highlights)", then sections.
- Transcript hover "+" → Action Item / Bookmark / highlight types; highlight creation stores a time range and appears in ANNOTATIONS with a share-link copy and ⋯ menu.
- Transcript ⋯ → Edit transcript / Change speaker / Trim.
- Share → modal with access list, role dropdown, visibility dropdown, Copy Link (toast).
- ⋯ on call → Download Video, Delete Call (destructive, cannot be undone).
- Card ⋯ on dashboard → Delete Recording.
- Infinite loading spinner on dashboard.
- Settings dropdowns/toggles persist; Bot Name inline edit Save / Cancel / Revert.

## 5. NOT VERIFIED
- Live meeting workflow (bot join, recording, in-call highlight button) — requires an account.
- Exact search results page and keyboard shortcut.
- Folders / Playlists / Alerts page layouts (only tab names verified).
- Team Calls page beyond the visibility dropdown.
- Player controls beyond volume / time / progress / platform logo (speed "1x" pill seen in 3.0).
- Responsive breakpoints of the authenticated app (auth pages use `lg:` at 1024px; marketing uses Webflow 991/767/479).
- Toast styling, hover animation timings.
