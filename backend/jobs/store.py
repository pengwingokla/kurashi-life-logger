"""
store.py — Write parsed jobs to Supabase, deduplicating via greenhouse_id.

New jobs land with seen=false. Already-stored jobs are skipped entirely
so their seen flag (set to true by M2 after analysis) is not reset.
"""

from datetime import datetime, timezone
from supabase import Client
from jobs.parser import ParsedJob


def store_jobs(jobs: list[ParsedJob], db: Client) -> int:
    """
    Upsert jobs into the jobs table.
    - New jobs: inserted with seen=false
    - Existing jobs (same greenhouse_id): skipped via on_conflict ignore

    Returns the count of newly inserted jobs.
    """
    if not jobs:
        return 0

    now = datetime.now(timezone.utc).isoformat()
    new_count = 0

    for job in jobs:
        row = {
            "greenhouse_id": job.greenhouse_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "is_remote": job.is_remote,
            "url": job.url,
            "raw_jd_text": job.raw_jd_text,
            "requirements": job.requirements,
            "salary_range": job.salary_range,
            "fetched_at": now,
            "seen": False,
        }

        try:
            # Use upsert with ignoreDuplicates=True so existing rows are untouched
            result = (
                db.table("jobs")
                .upsert(row, on_conflict="greenhouse_id", ignore_duplicates=True)
                .execute()
            )
            # supabase-py returns data=[] when the row was ignored (already exists)
            if result.data:
                new_count += 1
        except Exception as exc:
            print(f"[store] Failed to store job {job.greenhouse_id}: {exc}")

    print(f"[store] Stored {new_count} new jobs (skipped {len(jobs) - new_count} duplicates)")
    return new_count
