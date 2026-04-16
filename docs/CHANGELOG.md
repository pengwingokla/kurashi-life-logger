# Changelog

## Unreleased

---

## [0.3.0] — 2026-04-16 — UX polish & design system

### Added
- Dashboard home screen at `/` with module card grid
- Matcha Log moved to `/matcha` as a module; clicking the card navigates into it
- `TopBar` reusable component — centered title, left/right slots, border-bottom separator
- Doodle gear icon (`setting-2.svg`) replacing "Settings" text in nav bar
- Heatmap cells clickable to switch the log list in place — no separate day page
- Mon / Wed / Fri row labels on heatmap; weeks now start on Sunday
- Inline log form on Matcha page — matcha dropdown, gram presets, Confirm button
- Log for any selected date (past days logged at noon ET)
- Typography scale in `globals.css`: `t-h1`, `t-h2`, `t-stat`, `t-label`, `t-body` — each with size, weight, and color; applied across all screens
- `washi-card` CSS class for transparent cards showing Washi paper texture through

### Changed
- Settings link replaced with gear icon
- Log form matcha selector changed from stacked buttons to a dropdown
- Gram preset and Confirm buttons made more compact

### Removed
- Separate `/log` page — logging is now inline on Matcha Log
- `/day/[date]` route — day detail is now inline via heatmap click
- `LogActions` moved from `src/app/day/[date]/` to `src/app/matcha/`

---

## [0.2.0] — 2026-04-16 — Visual design

### Added
- Washi paper photo (`public/textures/washi.jpg`) as repeating CSS background
- JetBrains Mono self-hosted via `next/font/local` with `public/fonts/JetBrainsMono.ttf`
- Doodle design system — thick black borders (`border-2 border-black`), offset box shadows (`shadow-[4px_4px_0px_#1a1008]`), pill buttons with hover press effect
- Monochrome color scheme — black/white accents, no green

### Changed
- Cards set to `background-color: transparent` to show Washi texture through them
- `bg-white` removed from `<body>` in `layout.tsx` which was blocking the texture
- Font switched from Caveat → JetBrains Mono

### Fixed
- Accidentally committed font package folder — removed from git, added to `.gitignore`

---

## [0.1.0] — 2026-04-15 — Initial build

### Added
- Supabase schema: `matcha_collection` and `matcha_logs` tables
- API routes: `/api/collection`, `/api/logs`, `/api/logs/[id]`, `/api/parse`, `/api/shortcut`
- Home screen with GitHub-style streak heatmap (12 weeks), Today and Streak stat cards
- Log Matcha screen — AI text input (`/api/parse` → Claude) + manual matcha/gram selector
- Day detail screen — log list with Edit and Delete per entry
- Settings screen — matcha collection manager + iOS Shortcut setup instructions
- Natural language parsing via Claude (`claude-sonnet-4-5`) — auto-logs after parsing
- iOS Shortcut webhook — accepts `text` or `matcha_name` + `grams`
- Eastern Time as single timezone source of truth (`src/lib/time.ts`)
- Edit and delete log entries with inline form
- Month labels on heatmap
- PWA manifest for iPhone home screen install
