"""
parser.py — Fetch and parse a Greenhouse job page into structured fields.

Uses httpx for async HTTP and BeautifulSoup for HTML extraction.
"""

import re
import httpx
from bs4 import BeautifulSoup
from dataclasses import dataclass, field

GREENHOUSE_ID_RE = re.compile(r"/jobs/(\d+)")
SALARY_RE = re.compile(
    r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per\s+)?(?:year|yr|hour|hr|k))?",
    re.IGNORECASE,
)
REMOTE_HINTS = ["remote", "work from home", "wfh", "distributed", "anywhere"]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class ParsedJob:
    greenhouse_id: str
    title: str
    company: str
    location: str
    is_remote: bool
    url: str
    raw_jd_text: str
    requirements: list[str] = field(default_factory=list)
    salary_range: str = ""


def _extract_greenhouse_id(url: str) -> str:
    m = GREENHOUSE_ID_RE.search(url)
    return m.group(1) if m else ""


def _is_remote(location: str, body_text: str) -> bool:
    combined = (location + " " + body_text).lower()
    return any(hint in combined for hint in REMOTE_HINTS)


def _extract_salary(text: str) -> str:
    m = SALARY_RE.search(text)
    return m.group(0).strip() if m else ""


def _extract_requirements(soup: BeautifulSoup) -> list[str]:
    """
    Pull bullet points from the job description that look like requirements.
    Greenhouse wraps JD content in #content or .job-post or similar.
    """
    requirements: list[str] = []

    # Try to find a requirements/qualifications section
    jd_div = (
        soup.find("div", {"id": "content"})
        or soup.find("div", class_=re.compile(r"job|description|content", re.I))
        or soup.find("main")
    )
    if not jd_div:
        return requirements

    # Grab all list items
    for li in jd_div.find_all("li"):
        text = li.get_text(separator=" ", strip=True)
        if 10 < len(text) < 300:  # skip noise
            requirements.append(text)

    return requirements[:30]  # cap at 30 bullets


async def parse_job(url: str, client: httpx.AsyncClient) -> ParsedJob | None:
    """Fetch a single Greenhouse job URL and parse it into a ParsedJob."""
    try:
        resp = await client.get(url, headers=HEADERS, follow_redirects=True, timeout=15)
        resp.raise_for_status()
    except Exception as exc:
        print(f"[parser] Failed to fetch {url}: {exc}")
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Title
    title_tag = (
        soup.find("h1", class_=re.compile(r"title|heading|job", re.I))
        or soup.find("h1")
    )
    title = title_tag.get_text(strip=True) if title_tag else ""

    # Company — Greenhouse embeds it in the page title or meta
    company = ""
    og_site = soup.find("meta", property="og:site_name")
    if og_site:
        company = og_site.get("content", "")
    if not company:
        # Fall back to first <h2> or page <title> prefix
        h2 = soup.find("h2")
        if h2:
            company = h2.get_text(strip=True)
        if not company:
            page_title = soup.title.string if soup.title else ""
            company = page_title.split(" - ")[0].split(" | ")[0].strip()

    # Location
    location_tag = soup.find(
        ["p", "div", "span"],
        class_=re.compile(r"location|office", re.I),
    )
    location = location_tag.get_text(strip=True) if location_tag else ""

    # Full JD text
    jd_div = (
        soup.find("div", {"id": "content"})
        or soup.find("div", class_=re.compile(r"job|description|content", re.I))
        or soup.find("main")
    )
    raw_jd_text = jd_div.get_text(separator="\n", strip=True) if jd_div else ""

    salary_range = _extract_salary(raw_jd_text)
    requirements = _extract_requirements(soup)
    greenhouse_id = _extract_greenhouse_id(url)
    is_remote = _is_remote(location, raw_jd_text)

    if not title or not greenhouse_id:
        print(f"[parser] Skipping {url} — missing title or greenhouse_id")
        return None

    return ParsedJob(
        greenhouse_id=greenhouse_id,
        title=title,
        company=company,
        location=location,
        is_remote=is_remote,
        url=url,
        raw_jd_text=raw_jd_text[:20_000],  # cap to avoid huge rows
        requirements=requirements,
        salary_range=salary_range,
    )


async def parse_jobs(urls: list[str]) -> list[ParsedJob]:
    """Parse all URLs concurrently with a shared httpx client."""
    import asyncio

    async with httpx.AsyncClient() as client:
        tasks = [parse_job(url, client) for url in urls]
        results = await asyncio.gather(*tasks)

    parsed = [r for r in results if r is not None]
    print(f"[parser] Successfully parsed {len(parsed)}/{len(urls)} jobs")
    return parsed
