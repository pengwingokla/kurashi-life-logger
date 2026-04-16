# Scope Log

## In MVP

- Matcha collection (one-time setup: name, brand, grade)
- Log entry: matcha selection + grams + timestamp
- Gram presets: 2g / 3g / 4g + manual override
- Natural language input → Claude parses matcha + grams + time
- iOS Shortcut → webhook → logs with defaults
- Streak heatmap (12 weeks, GitHub style)
- Daily count + current streak on Home
- Day Detail (tap heatmap dot)
- PWA config (installable on iPhone)

## Out of Scope (V2)

| Feature | Reason deferred |
|---|---|
| Preparation type (hot/iced/latte) | Core value is when + what + grams. Preparation is context, not insight. |
| Photo logging | Adds camera permission, storage complexity. Not needed for matcha. |
| Cost tracking | Useful but not core to the consistency question. |
| Push notifications | Use iOS Reminders manually. Don't rebuild OS features. |
| Google Calendar integration | No native "on complete" webhook. iOS Shortcut solves the same problem more reliably. |
| Multi-user / auth | Personal use only. |
| Macros / nutrition | Not relevant for matcha logger. Belongs in fitness logger. |

## Scope Changes

*Log any changes here as they happen during build.*
