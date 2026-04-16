# Matcha Logger — UX Decisions

## Screens (4 total)

### Home
- Streak heatmap (first thing you see — the reward)
- Today's count + current streak
- Single CTA: Log Matcha
- Today's log list below

### Log Matcha
- Matcha selector (from collection)
- Gram presets: 2g / 3g / 4g + manual
- Auto-timestamp (editable)
- Natural language text input as alternative
- Confirm button

### Day Detail
- Triggered by tapping heatmap dot
- Read-only: timestamp, matcha name, grams

### Matcha Collection (via Settings)
- List of owned matchas with use count
- Add new matcha form

## Key UX Decisions

**1. Heatmap is the primary view, not a dashboard widget**

The streak chart is the most motivating element. Burying it below stats or making it secondary would reduce the reward loop. It's the first thing you see on Home.

**2. iOS Shortcut for zero-friction check-in**

The moment of action (making matcha) is not at a desk. iOS Shortcut widget on home screen → one tap → logged. No app opening required. This is the fastest possible logging path and sets a default (last used matcha + grams).

**3. Matcha collection as one-time setup**

Instead of typing the matcha name every time, build the collection once and select. Reduces per-log friction significantly. Common pattern borrowed from expense trackers.

**4. Gram presets over a number input**

Most people use 2–4g. Presets cover 90% of cases with one tap. Manual input exists for edge cases. Avoids keyboard appearing on every log.

**5. Natural language as an alternative, not the primary path**

Text input is available but not forced. Quick-select UI is faster for the common case. NL input is useful when the Shortcut wasn't used and details vary.

**6. No confirmation screen after Shortcut**

Shortcut logs silently. No toast, no redirect. If you want to verify, open the app and see it in today's list. Interrupting the moment of use kills the friction benefit.

## UX Principles

- Home screen is the reward, not a menu
- Every log action targets under 20 seconds
- Shortcut handles the most common case without opening the app
- AI estimate is a starting point — always show breakdown, always allow editing
- No empty states that feel punishing

## User Flows

**Flow 1 — Shortcut (fastest)**
```
Tap Shortcut widget → POST /api/log-workout → streak updates
```

**Flow 2 — With details**
```
Open app → Log Matcha → select matcha → tap gram preset → Confirm → Home
```

**Flow 3 — Natural language**
```
Open app → Log Matcha → type "3g of Ippodo just now" → Claude parses → Confirm → Home
```

**Flow 4 — Browse history**
```
Open app → see heatmap → tap past day → Day Detail
```

---

Next: [Build](./04-build.md)
