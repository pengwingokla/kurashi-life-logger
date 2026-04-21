"""
Tests for #15 — per-job fit scoring and gap analysis:
  _score_job: Claude API call, prompt caching, structured JSON output
  run_digest: full pipeline — fetch unseen → score → store → mark seen
"""

import json
import pytest
from unittest.mock import MagicMock, patch, call


SAMPLE_JOB = {
    "id": "job-uuid-1",
    "title": "AI Engineer",
    "company": "Acme Corp",
    "location": "Remote",
    "is_remote": True,
    "url": "https://boards.greenhouse.io/acme/jobs/1",
    "raw_jd_text": "We need RAG expertise and Python skills.",
    "salary_range": "$150k",
}

SAMPLE_SCORE = {
    "fit_score": 82,
    "matched_skills": ["RAG", "Python"],
    "missing_skills": ["Go"],
    "seniority_match": True,
    "notes": "Strong candidate for this role.",
}

SYSTEM_PROMPT = "You are a job intelligence agent."


# ---------------------------------------------------------------------------
# _score_job
# ---------------------------------------------------------------------------

class TestScoreJob:
    def _make_claude(self, response_text):
        text_block = MagicMock()
        text_block.text = response_text
        response = MagicMock()
        response.content = [text_block]
        client = MagicMock()
        client.messages.create.return_value = response
        return client

    def test_returns_parsed_dict_on_success(self):
        from agent.scorer import _score_job
        claude = self._make_claude(json.dumps(SAMPLE_SCORE))
        result = _score_job(SAMPLE_JOB, SYSTEM_PROMPT, claude)
        assert result["fit_score"] == 82
        assert "RAG" in result["matched_skills"]
        assert result["seniority_match"] is True

    def test_passes_system_prompt_with_cache_control(self):
        from agent.scorer import _score_job
        claude = self._make_claude(json.dumps(SAMPLE_SCORE))
        _score_job(SAMPLE_JOB, SYSTEM_PROMPT, claude)

        call_kwargs = claude.messages.create.call_args.kwargs
        system = call_kwargs["system"]
        assert isinstance(system, list)
        assert system[0]["text"] == SYSTEM_PROMPT
        assert system[0]["cache_control"] == {"type": "ephemeral"}

    def test_uses_correct_model(self):
        from agent.scorer import _score_job, MODEL
        claude = self._make_claude(json.dumps(SAMPLE_SCORE))
        _score_job(SAMPLE_JOB, SYSTEM_PROMPT, claude)

        call_kwargs = claude.messages.create.call_args.kwargs
        assert call_kwargs["model"] == MODEL

    def test_job_title_appears_in_user_message(self):
        from agent.scorer import _score_job
        claude = self._make_claude(json.dumps(SAMPLE_SCORE))
        _score_job(SAMPLE_JOB, SYSTEM_PROMPT, claude)

        call_kwargs = claude.messages.create.call_args.kwargs
        user_content = call_kwargs["messages"][0]["content"]
        assert "AI Engineer" in user_content
        assert "Acme Corp" in user_content

    def test_truncates_long_jd_text(self):
        from agent.scorer import _score_job
        long_job = {**SAMPLE_JOB, "raw_jd_text": "x" * 20_000}
        claude = self._make_claude(json.dumps(SAMPLE_SCORE))
        _score_job(long_job, SYSTEM_PROMPT, claude)

        call_kwargs = claude.messages.create.call_args.kwargs
        user_content = call_kwargs["messages"][0]["content"]
        # raw_jd_text is capped at 8000 chars in _job_user_message
        assert len(user_content) < 15_000

    def test_returns_none_on_api_error(self):
        from agent.scorer import _score_job
        claude = MagicMock()
        claude.messages.create.side_effect = Exception("API down")
        result = _score_job(SAMPLE_JOB, SYSTEM_PROMPT, claude)
        assert result is None

    def test_returns_none_on_invalid_json(self):
        from agent.scorer import _score_job
        claude = self._make_claude("not valid json {{")
        result = _score_job(SAMPLE_JOB, SYSTEM_PROMPT, claude)
        assert result is None


# ---------------------------------------------------------------------------
# run_digest
# ---------------------------------------------------------------------------

class TestRunDigest:
    def _make_db(self, unseen_jobs=None, digest_id="digest-1"):
        db = MagicMock()

        # jobs query (unseen)
        jobs_chain = MagicMock()
        jobs_chain.execute.return_value.data = unseen_jobs or []

        # digests insert
        digest_chain = MagicMock()
        digest_chain.execute.return_value.data = [{"id": digest_id}]

        # digest_jobs insert
        dj_chain = MagicMock()
        dj_chain.execute.return_value.data = [{}]

        # jobs update (mark seen)
        update_chain = MagicMock()

        def table_side_effect(name):
            if name == "jobs":
                return jobs_chain
            if name == "digests":
                return digest_chain
            if name == "digest_jobs":
                return dj_chain
            return MagicMock()

        db.table.side_effect = table_side_effect
        return db, jobs_chain, digest_chain, dj_chain

    def test_returns_early_when_no_unseen_jobs(self):
        from agent.scorer import run_digest
        db, *_ = self._make_db(unseen_jobs=[])
        result = run_digest(db)
        assert result["unseen_jobs"] == 0
        assert result["digest_id"] is None

    def test_scores_all_unseen_jobs(self):
        from agent.scorer import run_digest
        jobs = [
            {**SAMPLE_JOB, "id": f"job-{i}"}
            for i in range(3)
        ]
        db, *_ = self._make_db(unseen_jobs=jobs)

        with patch("agent.scorer.build_system_prompt", return_value=SYSTEM_PROMPT), \
             patch("agent.scorer._score_job", return_value=SAMPLE_SCORE) as mock_score, \
             patch("anthropic.Anthropic"):
            result = run_digest(db)

        assert mock_score.call_count == 3
        assert result["scored"] == 3

    def test_creates_digest_row(self):
        from agent.scorer import run_digest
        db, _, digest_chain, _ = self._make_db(unseen_jobs=[SAMPLE_JOB])

        with patch("agent.scorer.build_system_prompt", return_value=SYSTEM_PROMPT), \
             patch("agent.scorer._score_job", return_value=SAMPLE_SCORE), \
             patch("anthropic.Anthropic"):
            run_digest(db)

        digest_chain.insert.assert_called_once()
        insert_arg = digest_chain.insert.call_args.args[0]
        assert "market_summary" in insert_arg

    def test_inserts_digest_jobs_rows(self):
        from agent.scorer import run_digest
        db, _, _, dj_chain = self._make_db(unseen_jobs=[SAMPLE_JOB])

        with patch("agent.scorer.build_system_prompt", return_value=SYSTEM_PROMPT), \
             patch("agent.scorer._score_job", return_value=SAMPLE_SCORE), \
             patch("anthropic.Anthropic"):
            run_digest(db)

        dj_chain.insert.assert_called_once()
        row = dj_chain.insert.call_args.args[0]
        assert row["fit_score"] == 82
        assert "RAG" in row["matched_skills"]
        assert "Go" in row["gaps"]

    def test_marks_scored_jobs_as_seen(self):
        from agent.scorer import run_digest
        db, jobs_chain, _, _ = self._make_db(unseen_jobs=[SAMPLE_JOB])

        with patch("agent.scorer.build_system_prompt", return_value=SYSTEM_PROMPT), \
             patch("agent.scorer._score_job", return_value=SAMPLE_SCORE), \
             patch("anthropic.Anthropic"):
            run_digest(db)

        jobs_chain.update.assert_called_with({"seen": True})

    def test_skips_failed_scores_without_crashing(self):
        from agent.scorer import run_digest
        jobs = [
            {**SAMPLE_JOB, "id": "job-ok"},
            {**SAMPLE_JOB, "id": "job-fail"},
        ]
        db, _, _, _ = self._make_db(unseen_jobs=jobs)

        def score_side_effect(job, *args, **kwargs):
            return SAMPLE_SCORE if job["id"] == "job-ok" else None

        with patch("agent.scorer.build_system_prompt", return_value=SYSTEM_PROMPT), \
             patch("agent.scorer._score_job", side_effect=score_side_effect), \
             patch("anthropic.Anthropic"):
            result = run_digest(db)

        assert result["scored"] == 1
        assert result["unseen_jobs"] == 2

    def test_market_summary_contains_avg_fit_and_gaps(self):
        from agent.scorer import _build_market_summary
        scored = [
            {"job": SAMPLE_JOB, "score": {**SAMPLE_SCORE, "fit_score": 80, "missing_skills": ["Go", "Rust"]}},
            {"job": SAMPLE_JOB, "score": {**SAMPLE_SCORE, "fit_score": 60, "missing_skills": ["Go"]}},
        ]
        summary = _build_market_summary(scored)
        assert "70" in summary       # avg of 80 and 60
        assert "Go" in summary        # most common gap
        assert "2 jobs" in summary
