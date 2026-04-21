"""
Tests for #14 — build_system_prompt:
  Verify the assembled string contains the right sections given mocked DB data.
"""

import pytest
from unittest.mock import MagicMock, patch

from agent.prompt import build_system_prompt, _format_profile, _format_past_digests


SAMPLE_PROFILE = {
    "titles": ["AI Engineer", "ML Engineer"],
    "seniority": ["entry", "mid"],
    "years_experience": 2,
    "remote_preference": "both",
    "strengths": ["RAG pipelines", "multi-agent systems"],
    "skills": {
        "ai_ml": ["RAG", "LangGraph"],
        "languages": ["Python", "SQL"],
        "data_infra": ["dbt", "Airflow"],
        "cloud_devops": ["GCP", "Docker"],
        "backend": ["FastAPI"],
    },
}


# ---------------------------------------------------------------------------
# Unit: _format_profile
# ---------------------------------------------------------------------------

class TestFormatProfile:
    def test_includes_titles(self):
        result = _format_profile(SAMPLE_PROFILE)
        assert "AI Engineer" in result
        assert "ML Engineer" in result

    def test_includes_seniority(self):
        result = _format_profile(SAMPLE_PROFILE)
        assert "entry" in result
        assert "mid" in result

    def test_includes_skills(self):
        result = _format_profile(SAMPLE_PROFILE)
        assert "RAG" in result
        assert "LangGraph" in result
        assert "FastAPI" in result

    def test_includes_strengths(self):
        result = _format_profile(SAMPLE_PROFILE)
        assert "RAG pipelines" in result


# ---------------------------------------------------------------------------
# Unit: _format_past_digests
# ---------------------------------------------------------------------------

class TestFormatPastDigests:
    def test_no_digests_returns_first_run_message(self):
        result = _format_past_digests([])
        assert "first run" in result.lower()

    def test_includes_digest_dates_and_summaries(self):
        digests = [
            {"created_at": "2026-04-18T10:00:00Z", "market_summary": "Strong RAG demand"},
            {"created_at": "2026-04-15T10:00:00Z", "market_summary": "LLM roles up 20%"},
        ]
        result = _format_past_digests(digests)
        assert "2026-04-18" in result
        assert "Strong RAG demand" in result
        assert "LLM roles up 20%" in result

    def test_handles_null_market_summary(self):
        digests = [{"created_at": "2026-04-18T10:00:00Z", "market_summary": None}]
        result = _format_past_digests(digests)
        assert "2026-04-18" in result  # date still shows


# ---------------------------------------------------------------------------
# Integration: build_system_prompt
# ---------------------------------------------------------------------------

class TestBuildSystemPrompt:
    def _make_db(self, profile=None, digests=None, seen_count=0):
        db = MagicMock()

        # resume_profile query (via get_profile inside build_system_prompt)
        profile_chain = MagicMock()
        profile_chain.execute.return_value.data = profile

        # digests query
        digest_chain = MagicMock()
        digest_chain.execute.return_value.data = digests or []

        # jobs seen count
        count_chain = MagicMock()
        count_chain.execute.return_value.count = seen_count

        def table_side_effect(name):
            if name == "resume_profile":
                return profile_chain
            if name == "digests":
                return digest_chain
            if name == "jobs":
                return count_chain
            return MagicMock()

        db.table.side_effect = table_side_effect
        return db

    def test_prompt_contains_profile_info(self):
        db = self._make_db(profile=SAMPLE_PROFILE)
        with patch("resume.profile.get_profile", return_value=SAMPLE_PROFILE):
            prompt = build_system_prompt(db)

        assert "AI Engineer" in prompt
        assert "RAG" in prompt
        assert "FastAPI" in prompt

    def test_prompt_contains_past_digest_summaries(self):
        digests = [{"created_at": "2026-04-18T10:00:00Z", "market_summary": "Strong RAG demand"}]
        db = self._make_db(profile=SAMPLE_PROFILE, digests=digests)
        with patch("resume.profile.get_profile", return_value=SAMPLE_PROFILE):
            prompt = build_system_prompt(db)

        assert "Strong RAG demand" in prompt

    def test_prompt_contains_seen_job_count(self):
        db = self._make_db(profile=SAMPLE_PROFILE, seen_count=42)
        with patch("resume.profile.get_profile", return_value=SAMPLE_PROFILE):
            prompt = build_system_prompt(db)

        assert "42" in prompt

    def test_prompt_handles_missing_profile_gracefully(self):
        db = self._make_db(profile=None)
        with patch("resume.profile.get_profile", return_value=None):
            prompt = build_system_prompt(db)

        assert "not set" in prompt.lower() or "profile" in prompt.lower()

    def test_prompt_mentions_no_prior_digests_on_first_run(self):
        db = self._make_db(profile=SAMPLE_PROFILE, digests=[])
        with patch("resume.profile.get_profile", return_value=SAMPLE_PROFILE):
            prompt = build_system_prompt(db)

        assert "first run" in prompt.lower()
