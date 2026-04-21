"""
fetcher.py — SerpAPI search for Greenhouse job listings.

Runs a set of targeted queries against site:boards.greenhouse.io,
filters to US-based roles, and returns a deduplicated list of URLs.
"""

import os
import re
from serpapi import GoogleSearch

SEARCH_QUERIES = [
    '"AI Engineer" site:boards.greenhouse.io',
    '"Applied AI Engineer" site:boards.greenhouse.io',
    '"Machine Learning Engineer" site:boards.greenhouse.io',
    '"LLM Engineer" site:boards.greenhouse.io',
    '"Data Scientist" site:boards.greenhouse.io',
    '"Data Engineer" site:boards.greenhouse.io',
    '"Software Engineer" "AI" OR "ML" site:boards.greenhouse.io',
]

GREENHOUSE_URL_RE = re.compile(
    r"https://boards\.greenhouse\.io/[^/]+/jobs/\d+", re.IGNORECASE
)

US_LOCATION_HINTS = [
    "united states", "us", "usa", "remote", "new york", "san francisco",
    "seattle", "austin", "boston", "chicago", "los angeles", "denver",
    "atlanta", "washington", "nyc", "sf", "bay area",
]


def _looks_us_based(snippet: str) -> bool:
    """Heuristic: accept if snippet mentions a US location or 'remote'."""
    lower = snippet.lower()
    return any(hint in lower for hint in US_LOCATION_HINTS)


def fetch_greenhouse_urls(max_per_query: int = 10) -> list[str]:
    """
    Run all search queries via SerpAPI, return deduplicated Greenhouse URLs
    for US-based roles.
    """
    api_key = os.environ["SERPAPI_KEY"]
    seen: set[str] = set()
    urls: list[str] = []

    for query in SEARCH_QUERIES:
        try:
            results = GoogleSearch({
                "q": query,
                "api_key": api_key,
                "num": max_per_query,
                "gl": "us",   # geo: United States
                "hl": "en",
            }).get_dict()

            organic = results.get("organic_results", [])
            for result in organic:
                url: str = result.get("link", "")
                snippet: str = result.get("snippet", "") + result.get("title", "")

                # Only keep clean Greenhouse job board URLs
                if not GREENHOUSE_URL_RE.match(url):
                    continue

                # Filter to US-based / remote roles
                if not _looks_us_based(snippet):
                    continue

                if url not in seen:
                    seen.add(url)
                    urls.append(url)

        except Exception as exc:
            print(f"[fetcher] SerpAPI error for query '{query}': {exc}")

    print(f"[fetcher] Found {len(urls)} unique Greenhouse URLs")
    return urls
