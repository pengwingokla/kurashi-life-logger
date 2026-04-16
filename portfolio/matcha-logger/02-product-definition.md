# Matcha Logger — Product Definition

## Core Definition

> When did I drink matcha, what matcha did I use, how many grams, and am I being consistent?

## MVP Features

| Feature | Description |
|---|---|
| Matcha collection | Add matchas you own once (name, brand, grade). Select from list when logging. |
| One-tap log | Select matcha → tap gram preset → confirm. Under 20 seconds. |
| Gram presets | Quick options: 2g / 3g / 4g + manual override |
| Natural language | "3g of Ippodo this morning" → Claude parses → confirm |
| iOS Shortcut | Tap widget → logs instantly with default matcha + grams. Never opens app. |
| Streak heatmap | GitHub-style chart, last 12 weeks, one dot per day |
| Daily count | How many matchas today |
| Day detail | Tap any heatmap dot → see what you had |

## Explicitly Out of Scope (MVP)

- Preparation type (hot/iced/latte) — adds no insight right now
- Cost tracking
- Brand/cafe tracking  
- Photo logging
- Push notifications (use iOS Reminders manually)
- Multi-device sync beyond basic web app
- Google Calendar integration

## Data Model

```
matcha_logs
├── id
├── timestamp
├── matcha_id (FK → matcha_collection)
├── grams
└── notes (optional)

matcha_collection
├── id
├── name
├── brand
└── grade (ceremonial / culinary)
```

## Scope Decisions

| Decision | Reason |
|---|---|
| Removed preparation type from MVP | Core value is when + what + grams. Preparation is context, not insight. |
| No push notifications in app | iOS Reminders handles this. Don't rebuild native OS features. |
| No auth | Personal use only. Skip the complexity. |
| Supabase over SQLite | Need file storage for future photo logging. Free tier covers personal use. |

---

Next: [UX Decisions](./03-ux-decisions.md)
