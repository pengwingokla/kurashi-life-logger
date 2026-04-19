# Planning

Active scope, milestone breakdown, and decisions for modules in development.

· · ·

## job intelligence module

A personal AI job agent for an Applied AI Engineer. Searches for fresh AI/ML/LLM job postings, analyzes market skill trends, and compares them against a resume to surface strengths and gaps. Delivers a digest a few times a week and supports conversational queries.

**branch:** `feature/job-intelligence`

· · ·

### decisions

**job data source: SerpAPI + httpx + BeautifulSoup**

- SerpAPI handles Google search queries (e.g. "AI Engineer jobs San Francisco site:greenhouse.io")
- httpx fetches individual Greenhouse and Lever job pages (clean public HTML, no auth required)
- BeautifulSoup parses the JD text out of the page
- Extracted text is passed to Claude for analysis

Ruled out:
- LinkedIn Jobs API: heavily restricted, hard to get access
- Apify: more overhead than needed for v1
- Direct LinkedIn scraping: fragile, blocks aggressively
- RapidAPI unofficial APIs: unstable, terms risk

**backend: FastAPI (Python)**
- Keeps the scraping + Anthropic SDK work in Python where it's most natural
- Sits alongside the existing Next.js frontend as a separate service

**memory: Supabase**
- Resume profile stored as structured fields (injected into every Claude call)
- Past digest summaries stored and injected for continuity
- Seen job IDs stored for deduplication (never show the same job twice)

· · ·

### milestones

**M1 - data foundation** `#10 #11 #12`
- Resume profile schema in Supabase (skills, experience, titles, seniority)
- SerpAPI search + httpx/BeautifulSoup job page parsing pipeline
- Deduplication via seen job IDs in Supabase

**M2 - agent core** `#13 #14 #15`
- FastAPI backend with /digest and /chat routes
- Persistent system prompt with resume + past digests injected
- Per-job fit scoring: structured JSON output (fit %, matched skills, gaps)

**M3 - digest UI** `#16 #17`
- Job cards with fit score, matched skills, gaps
- Market trends summary card
- Manual "Run Digest" trigger button
- Comic/doodle style matching the matcha tracker

**M4 - conversational layer** `#18`
- Chat interface for ad-hoc queries to the agent
- Message history stored in Supabase

**M5 - scheduling** `#19`
- Cron runs digest automatically a few times a week
- Badge or notification in UI when new digest is ready

· · ·

### open questions

- [ ] Resume format: structured Supabase fields, or paste raw text?
- [ ] Target company list: curated set, or open-ended SerpAPI search?
- [ ] Fit score weights: what matters most — title match, tech stack, seniority, company stage?
- [ ] SerpAPI plan: free tier is 100 searches/month, likely enough for v1
