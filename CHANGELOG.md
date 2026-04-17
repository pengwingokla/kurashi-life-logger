# Changelog

All meaningful changes to kurashi, traced from the beginning.

· · ·

## v0.6.0 - analytics & visualization
*April 16, 2026*

The dashboard gets a lot more informative. You can now see your intake over time and when during the day you tend to drink matcha.

**added**
- Time series area chart for matcha intake (defaults to 30-day view)
- Time-of-day bar: a single horizontal bar showing when during the day you log, with color intensity based on frequency
- Heatmap intensity shading - 4 levels of darkness based on how much you logged that day (no longer binary)

**improved**
- 24h time format in log display
- Gram unit label added to chart Y-axis

**fixed**
- Heatmap off-by-one error caused by ET/local timezone mismatch - resolved by using noon instead of midnight as the reference point

· · ·

## v0.5.0 - logging improvements
*April 16, 2026*

Smoother, more flexible logging. Fewer clicks, fewer dead ends.

**added**
- Time editing on individual log entries (ET-aware)
- Inline "Add new matcha" form directly below the dropdown - no need to go to Settings first

**improved**
- Unified gram input: replaced the "Other" toggle with an always-visible number input
- Edit form now matches the main log form in style and behavior

**fixed**
- DST-unsafe hardcoded ET offset in past-day logging

· · ·

## v0.4.0 - typography system
*April 16, 2026*

A consistent type scale across the whole app. Everything feels more intentional now.

**added**
- `t-h1`, `t-h2`, `t-label`, `t-body`, `t-stat` utility classes defining the full type scale
- Color and font-weight applied to all scale levels
- `t-stat` applied uniformly to all stat cards

· · ·

## v0.3.0 - dashboard & UX polish
*April 16, 2026*

The app grows from a single screen into a proper dashboard with a home screen and a much smoother logging flow.

**added**
- Home dashboard screen with module cards
- Matcha log form embedded inline on the main page - no separate screen
- Inline day view: clicking a heatmap date swaps the log list in place (no navigation)
- Reusable `TopBar` component with home and settings links
- Gear icon replaces "Settings" text in the nav bar

**improved**
- Heatmap now shows Mon/Wed/Fri day labels and aligns weeks to Sunday
- Month labels on the heatmap
- Compact nav bar and square module cards on the dashboard

· · ·

## v0.2.0 - design system & structure
*April 16, 2026*

The app gets its visual identity: a doodle-meets-paper aesthetic that makes it feel handmade and personal.

**added**
- Doodle design system: black borders, offset shadows, hand-drawn feel
- JetBrains Mono as the primary font (local, no external dependency)
- Real Washi paper texture as the background
- Transparent cards so the paper texture shows through

**changed**
- Restructured: app moved to root, removed unused `apps/` and `portfolio/` directories

· · ·

## v0.1.0 - MVP
*April 15, 2026*

First working version. The whole reason this exists: a simple place to log matcha and see the habit take shape.

**added**
- Log matcha by type, brand, grams, and notes
- Matcha collection - save your go-to matchas with grade (ceremonial, premium, culinary, other)
- 12-week streak heatmap
- Streak counter and daily stats (cups + grams)
- Edit and delete individual logs
- ET timezone handling throughout
- iOS Shortcut webhook endpoint for one-tap logging from the home screen
