# Changelog

All notable changes to this project will be documented here.
Format: `## [version or milestone] — YYYY-MM-DD`

---

## [MVP] — 2026-04-16

### Added
- **Dashboard home screen** — module card grid; Matcha Log is the first module
- **Matcha Log module** at `/matcha` — heatmap, Today/Streak stats, inline log form, day log list
- **Streak heatmap** — 12 weeks, Sunday-aligned columns, Mon/Wed/Fri row labels, click to switch selected day in place (no navigation)
- **Inline log form** — matcha dropdown, gram presets (2g/3g/4g/Other), Confirm button; logs for selected date
- **Edit/Delete per log entry** — inline expand with matcha selector and gram picker
- **Settings page** — manage matcha collection, add new matcha, iOS Shortcut setup instructions
- **Natural language logging** — Claude AI parses free text (e.g. "3g of Ippodo just now") via `/api/parse`
- **iOS Shortcut webhook** — `/api/shortcut` accepts `text` or `matcha_name` + `grams` for one-tap logging from iPhone
- **PWA** — installable on iPhone home screen via `manifest.json`
- **Washi paper background** — real paper photo as repeating CSS texture; all cards transparent
- **JetBrains Mono** — self-hosted via `next/font/local`
- **Doodle design system** — thick black borders, offset box shadows, pill buttons with press effect, monochrome
- **Typography scale** — `t-h1` / `t-h2` / `t-stat` / `t-label` / `t-body` defined in `globals.css` with size, weight, and color; applied across all screens
- **`TopBar` component** — reusable nav bar with centered title and left/right slots
- **Gear icon** in nav bar (`setting-2.svg`) linking to Settings
- **Eastern Time** as single source of truth for all date/time (`src/lib/time.ts`)

### Technical
- Next.js App Router with TypeScript and Tailwind v4
- Supabase (Postgres) for storage; all queries server-side where possible
- Vercel deployment from `main` branch
- `MatchaDashboard` client component handles heatmap interaction and log form state
- `LogActions` colocated in `src/app/matcha/`

### Removed
- Separate `/log` page — logging is now inline on the Matcha Log screen
- `/day/[date]` route — day detail is now inline via heatmap click

---

## [Scaffold] — 2026-02-01

### Added
- Project scaffolded (Next.js, TypeScript, Tailwind, App Router)
- Supabase and Anthropic SDK installed
- Dev docs created (decisions, scope, changelog, status)
- Portfolio entry written (problem, product definition, UX decisions)
