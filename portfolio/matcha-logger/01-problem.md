# Matcha Logger — Problem

## The Pain

I drink matcha daily as a ritual but had no record of it. I wanted to know:
- Am I being consistent?
- Which matcha am I using most?
- How many grams do I typically use?

Every existing solution (Notion, notes app, habit trackers) required too much manual setup or too many taps to log. I'd start, then stop after a week.

## What I Was Actually Missing

Not a logging app — a **frictionless capture mechanism** that meets me at the moment of action (making matcha) and a **rewarding visualization** that makes consistency feel tangible.

The GitHub contribution chart is the right mental model: one dot per day, the streak speaks for itself.

## The Hypothesis

If logging takes under 20 seconds and the result is immediately visible as a streak, I will use it consistently. The AI layer removes the friction of structured input — I should be able to say "3g of Ippodo" and have it parse correctly without filling out a form.

## Why Start Here (Not the Full Dashboard)

The matcha logger is the simplest possible version of the core pattern:
- One domain, one data type
- No complex AI reasoning needed
- Proves: PWA setup, iOS Shortcut webhook, streak chart, Claude parsing
- Small enough to ship in days, used daily enough to validate quickly

---

Next: [Product Definition](./02-product-definition.md)
