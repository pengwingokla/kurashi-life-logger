"""
prompt.py — Build the persistent system prompt for the job intelligence agent.

Injected on every Claude call:
  - Structured resume profile (skills, seniority, titles, experience)
  - Past digest summaries (most recent N, for continuity)
  - Count of jobs already seen (so the agent knows prior coverage)
"""

from supabase import Client


_PAST_DIGESTS_LIMIT = 5


def _format_profile(profile: dict) -> str:
    skills = profile.get("skills", {})
    skill_lines = "\n".join(
        f"  {category}: {', '.join(items)}"
        for category, items in skills.items()
        if items
    )
    return f"""\
## Candidate profile
- Target titles: {', '.join(profile.get('titles', []))}
- Seniority: {', '.join(profile.get('seniority', []))}
- Years of experience: {profile.get('years_experience', 'unknown')}
- Remote preference: {profile.get('remote_preference', 'unknown')}
- Core strengths: {', '.join(profile.get('strengths', []))}

### Skills
{skill_lines}"""


def _format_past_digests(digests: list[dict]) -> str:
    if not digests:
        return "No prior digests — this is the first run."
    lines = []
    for d in digests:
        created = d.get("created_at", "unknown date")[:10]
        summary = d.get("market_summary") or "(no summary)"
        lines.append(f"- {created}: {summary}")
    return "## Past digest summaries\n" + "\n".join(lines)


def build_system_prompt(db: Client) -> str:
    """
    Assemble the full system prompt by pulling live data from Supabase.
    Returns a string ready to pass as the `system` parameter to Claude.
    """
    from resume.profile import get_profile

    profile = get_profile(db)
    profile_section = _format_profile(profile) if profile else "## Candidate profile\n(not set — run POST /setup)"

    past_digests = (
        db.table("digests")
        .select("created_at, market_summary")
        .order("created_at", desc=True)
        .limit(_PAST_DIGESTS_LIMIT)
        .execute()
        .data
    )
    digests_section = _format_past_digests(past_digests)

    seen_count = (
        db.table("jobs")
        .select("id", count="exact")
        .eq("seen", True)
        .execute()
        .count
    ) or 0

    return f"""\
You are a personal job intelligence agent for an Applied AI Engineer. \
Your job is to analyze AI/ML job postings and assess how well they match the candidate's profile.

{profile_section}

{digests_section}

## Context
- Jobs already analyzed and seen: {seen_count}
- New jobs presented to you have not been scored yet.

## Your responsibilities
1. Score each job posting against the candidate profile.
2. Identify matched skills and gaps honestly — do not inflate fit scores.
3. Flag roles where seniority or required years of experience is a mismatch.
4. Summarize market skill trends across a batch of jobs when asked.
5. Answer follow-up questions about jobs, the market, or the candidate's positioning.

Always respond with accurate, grounded assessments. Prioritize roles where the candidate \
has genuine strength, and be direct about gaps."""
