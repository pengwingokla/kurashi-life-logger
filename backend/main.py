"""
main.py — FastAPI app for the kurashi job intelligence backend.

M1 endpoints:
  POST /jobs/fetch    — run full pipeline: search → parse → store
  GET  /jobs          — list stored jobs (unseen first)
  GET  /profile       — read resume profile
  POST /setup         — seed resume profile (idempotent)
"""

import asyncio
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

load_dotenv()

# ---------------------------------------------------------------------------
# Supabase client (module-level singleton)
# ---------------------------------------------------------------------------

def _get_db() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


db: Client = None  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db
    db = _get_db()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="kurashi job intelligence",
    description="M1 data pipeline — fetch, parse, and store AI/ML job postings",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/setup")
def setup():
    """Seed the resume profile (idempotent — safe to call multiple times)."""
    from resume.profile import seed_profile
    seed_profile(db)
    return {"ok": True, "message": "Resume profile seeded"}


@app.post("/jobs/fetch")
async def fetch_jobs():
    """
    Run the full M1 pipeline:
    1. SerpAPI → Greenhouse URLs
    2. httpx + BeautifulSoup → parsed job objects
    3. Supabase upsert → new jobs with seen=false

    Returns count of newly stored jobs.
    """
    from jobs.fetcher import fetch_greenhouse_urls
    from jobs.parser import parse_jobs
    from jobs.store import store_jobs

    urls = fetch_greenhouse_urls()
    if not urls:
        return {"new_jobs": 0, "message": "No Greenhouse URLs found"}

    parsed = await parse_jobs(urls)
    new_count = store_jobs(parsed, db)

    return {
        "urls_found": len(urls),
        "jobs_parsed": len(parsed),
        "new_jobs": new_count,
    }


@app.get("/jobs")
def list_jobs(limit: int = 50, unseen_only: bool = False):
    """List stored jobs, unseen first."""
    query = db.table("jobs").select(
        "id, greenhouse_id, title, company, location, is_remote, url, "
        "salary_range, fetched_at, seen"
    )
    if unseen_only:
        query = query.eq("seen", False)
    result = query.order("seen").order("fetched_at", desc=True).limit(limit).execute()
    return {"jobs": result.data, "count": len(result.data)}


@app.get("/profile")
def get_profile():
    """Return the current resume profile."""
    from resume.profile import get_profile
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found — run POST /setup first")
    return profile
