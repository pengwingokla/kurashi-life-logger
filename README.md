# kurashi 暮らし

A quiet personal dashboard for logging the small things that make up your day: what you drank, how you felt, what you did. Not a productivity app. More like a gentle record of your daily life.

> *kurashi (暮らし)* is the Japanese word for daily life, livelihood, the way you spend your days.

· · ·

## what it does

Kurashi is a collection of small trackers, each focused on one part of your routine. Low friction to log, meaningful to look back on.

### 🍵 matcha tracker
Log your matcha by type, brand, and grams. See your streak, today's total, and a 12-week heatmap of your habit. Pair it with an iOS Shortcut for one-tap logging from your home screen.

More modules coming soon.

· · ·

## tech stack

- **Next.js**: app router, server components
- **Supabase**: database and auth
- **Tailwind CSS**: styling
- **TypeScript**: throughout

· · ·

## getting started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Set up your environment variables. You'll need a Supabase project:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it.

· · ·

## ios shortcut

Each tracker supports a webhook endpoint so you can log from your iPhone without opening the app. Setup instructions are in the Settings page once you're running.

· · ·

*built for personal use, with care.*
