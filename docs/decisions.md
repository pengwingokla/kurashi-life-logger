# Decision Log

## 2026-04-15 — Use Supabase over SQLite
**Decision:** Supabase (hosted Postgres)  
**Alternatives considered:** SQLite (simpler, no hosting needed)  
**Why:** Free tier covers personal use. Built-in file storage needed for future photo logging in the fitness logger MVP. Avoids a migration later.

## 2026-04-15 — Use Next.js App Router + Vercel
**Decision:** Next.js 14 with App Router, deployed to Vercel  
**Alternatives considered:** Remix, plain Express + React  
**Why:** API routes + frontend in one project. Vercel free tier deploys from git automatically. PWA support is straightforward.

## 2026-04-15 — No auth in MVP
**Decision:** Skip authentication entirely  
**Why:** Personal use only. Auth adds setup time, session management, and UI complexity with zero benefit when there's one user.

## 2026-04-15 — iOS Shortcut as primary workout/log trigger
**Decision:** iOS Shortcut → webhook POST instead of native app notification  
**Alternatives considered:** In-app reminder, push notification  
**Why:** Neither iPhone Reminders nor Google Calendar fires a webhook on completion. Shortcut is a one-time setup, works as a home screen widget, and logs without opening the app.

## 2026-04-15 — Matcha collection as pre-set list
**Decision:** User builds their matcha collection once, selects from list per log  
**Alternatives considered:** Free-text input every time, barcode scan  
**Why:** Reduces per-log friction. Most people use 3–5 matchas regularly. One-time setup pays off immediately.
