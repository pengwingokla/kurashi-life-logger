"""
scorer.py — Score job postings against the candidate profile using Claude.

Each job gets a structured JSON assessment:
  fit_score (0-100), matched_skills, missing_skills, seniority_match, notes

The system prompt is cached via cache_control — it's identical for every job
in a single digest run, so after the first Claude call the prefix is a cache hit.
"""

import json
import os
from collections import Counter

import anthropic
from supabase import Client

MODEL = "claude-opus-4-7"

_FIT_SCORE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "FitScore",
        "schema": {
            "type": "object",
            "properties": {
                "fit_score": {
                    "type": "integer",
                    "description": "0-100 fit score for this role",
                },
                "matched_skills": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Candidate skills that match this role's requirements",
                },
                "missing_skills": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Skills required by the role that the candidate lacks",
                },
                "seniority_match": {
                    "type": "boolean",
                    "description": "True if the role's seniority level suits the candidate",
                },
                "notes": {
                    "type": "string",
                    "description": "Honest 1-3 sentence assessment",
                },
            },
            "required": [
                "fit_score",
                "matched_skills",
                "missing_skills",
                "seniority_match",
                "notes",
            ],
            "additionalProperties": False,
        },
    },
}


def _job_user_message(job: dict) -> str:
    jd = (job.get("raw_jd_text") or "")[:8_000]
    return (
        f"Score this job for the candidate.\n\n"
        f"Title: {job.get('title', 'Unknown')}\n"
        f"Company: {job.get('company', 'Unknown')}\n"
        f"Location: {job.get('location', 'Unknown')} "
        f"({'remote' if job.get('is_remote') else 'on-site'})\n"
        f"Salary: {job.get('salary_range') or 'not listed'}\n\n"
        f"Job description:\n{jd}"
    )


def _score_job(job: dict, system_prompt: str, client: anthropic.Anthropic) -> dict | None:
    """
    Call Claude for one job. The system prompt block carries cache_control so the
    first call in a batch writes the cache; all subsequent calls are cache hits.
    """
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": _job_user_message(job)}],
            output_config={"format": _FIT_SCORE_SCHEMA},
        )
        text = next((b.text for b in response.content if hasattr(b, "text")), "")
        return json.loads(text)
    except Exception as exc:
        print(f"[scorer] Failed to score job {job.get('id')}: {exc}")
        return None


def _build_market_summary(scored: list[dict]) -> str:
    if not scored:
        return "No jobs scored in this digest."

    scores = [s["score"].get("fit_score", 0) for s in scored]
    avg = sum(scores) / len(scores)

    all_gaps: list[str] = []
    for s in scored:
        all_gaps.extend(s["score"].get("missing_skills", []))
    top_gaps = [skill for skill, _ in Counter(all_gaps).most_common(5)]

    top3 = sorted(scored, key=lambda x: x["score"].get("fit_score", 0), reverse=True)[:3]
    top_titles = [
        f"{j['job']['title']} @ {j['job']['company']} ({j['score']['fit_score']}%)"
        for j in top3
    ]

    return (
        f"Scored {len(scored)} jobs. Average fit: {avg:.0f}%. "
        f"Top matches: {', '.join(top_titles)}. "
        f"Most common gaps: {', '.join(top_gaps) if top_gaps else 'none identified'}."
    )


def run_digest(db: Client) -> dict:
    """
    Full M2 digest pipeline:
      1. Fetch unseen jobs from Supabase (up to 50)
      2. Build system prompt with live resume + past digests
      3. Score each job via Claude (system prompt is cached across the batch)
      4. Create a digest row with a market summary
      5. Insert digest_jobs rows with fit scores and gaps
      6. Mark jobs as seen

    Returns summary stats suitable for the POST /digest response.
    """
    from agent.prompt import build_system_prompt

    # 1. Unseen jobs
    rows = (
        db.table("jobs")
        .select(
            "id, title, company, location, is_remote, url, raw_jd_text, salary_range"
        )
        .eq("seen", False)
        .limit(50)
        .execute()
    )
    jobs = rows.data or []
    if not jobs:
        return {"unseen_jobs": 0, "scored": 0, "digest_id": None}

    print(f"[scorer] Scoring {len(jobs)} unseen jobs")

    # 2. System prompt (same for all jobs → cache hit after first call)
    system_prompt = build_system_prompt(db)

    # 3. Score
    claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    scored: list[dict] = []
    for job in jobs:
        result = _score_job(job, system_prompt, claude)
        if result:
            scored.append({"job": job, "score": result})

    # 4. Create digest row
    market_summary = _build_market_summary(scored)
    digest_row = db.table("digests").insert({"market_summary": market_summary}).execute()
    digest_id = digest_row.data[0]["id"]

    # 5. Insert digest_jobs; 6. Mark seen
    seen_ids: list[str] = []
    for item in scored:
        job, score = item["job"], item["score"]
        try:
            db.table("digest_jobs").insert(
                {
                    "digest_id": digest_id,
                    "job_id": job["id"],
                    "fit_score": score.get("fit_score"),
                    "matched_skills": score.get("matched_skills", []),
                    "gaps": score.get("missing_skills", []),
                    "notes": score.get("notes", ""),
                }
            ).execute()
            seen_ids.append(job["id"])
        except Exception as exc:
            print(f"[scorer] Failed to store digest_job for {job.get('id')}: {exc}")

    if seen_ids:
        db.table("jobs").update({"seen": True}).in_("id", seen_ids).execute()

    print(
        f"[scorer] Digest {digest_id}: "
        f"scored {len(scored)}/{len(jobs)}, marked {len(seen_ids)} seen"
    )
    return {
        "unseen_jobs": len(jobs),
        "scored": len(scored),
        "digest_id": digest_id,
        "market_summary": market_summary,
    }
