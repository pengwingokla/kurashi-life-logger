"""
main.py — FastAPI app for the kurashi job intelligence backend.

M1 endpoints:
  POST /jobs/fetch    — run full pipeline: search → parse → store
  GET  /jobs          — list stored jobs (unseen first)
  GET  /profile       — read resume profile
  POST /setup         — seed resume profile (idempotent)

M2 endpoints:
  POST /digest        — trigger digest run: score unseen jobs via Claude, store results
  GET  /digest        — fetch latest digest with scored jobs
  POST /chat          — send a conversational message to the job agent
"""

import asyncio
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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


# ---------------------------------------------------------------------------
# M2 routes
# ---------------------------------------------------------------------------

@app.post("/digest")
async def run_digest():
    """
    Trigger a digest run:
    1. Pull unseen jobs from Supabase
    2. Score each job via Claude (fit score, matched skills, gaps)
    3. Store a digest row + digest_jobs rows in Supabase
    4. Mark jobs as seen

    M2 implementation: agent/scorer.py (see #15)
    """
    raise HTTPException(status_code=501, detail="Not implemented — coming in M2 #15")


@app.get("/digest")
def get_digest(limit: int = 20):
    """
    Fetch the latest digest and its scored jobs.
    Returns the most recent digest row joined with digest_jobs + job metadata.
    """
    digest_row = (
        db.table("digests")
        .select("id, created_at, market_summary")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not digest_row.data:
        raise HTTPException(status_code=404, detail="No digest found — run POST /digest first")

    digest = digest_row.data[0]
    scored_jobs = (
        db.table("digest_jobs")
        .select(
            "fit_score, matched_skills, gaps, notes, "
            "jobs(id, title, company, location, is_remote, url, salary_range)"
        )
        .eq("digest_id", digest["id"])
        .order("fit_score", desc=True)
        .limit(limit)
        .execute()
    )

    return {
        "digest_id": digest["id"],
        "created_at": digest["created_at"],
        "market_summary": digest["market_summary"],
        "jobs": scored_jobs.data,
    }


class ChatMessage(BaseModel):
    message: str
    history: list[dict] = []


@app.post("/chat")
async def chat(body: ChatMessage):
    """
    Send a conversational message to the job agent.
    Maintains history across turns; agent has access to resume + digests.

    M4 implementation (see #18) — stub for route skeleton (#13).
    """
    raise HTTPException(status_code=501, detail="Not implemented — coming in M4 #18")
