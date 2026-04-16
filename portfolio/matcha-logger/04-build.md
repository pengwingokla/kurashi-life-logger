# Matcha Logger — Build

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | API routes + React, PWA-ready |
| Styling | Tailwind CSS | Fast mobile-first UI |
| Database | Supabase | Postgres + free tier, ready for photo storage later |
| AI | Claude API (claude-sonnet-4-6) | Natural language parsing |
| Hosting | Vercel | Free tier, git deploys, works with Next.js |
| Auth | None | Personal use only |

## Build Order

- [ ] Supabase schema (`matcha_collection`, `matcha_logs`)
- [ ] API routes (CRUD for both tables)
- [ ] iOS Shortcut + webhook endpoint
- [ ] Home screen + heatmap
- [ ] Log Matcha screen (collection select + gram presets)
- [ ] Natural language input + Claude parsing
- [ ] Day Detail screen
- [ ] Matcha Collection / Settings screen
- [ ] PWA config (installable on iPhone)

## Timeline

*To be filled as build progresses.*

## Notes

*To be filled during build.*
