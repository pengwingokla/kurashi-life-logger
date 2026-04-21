"""
Tests for #13 — M2 route skeleton:
  POST /digest, GET /digest, POST /chat
"""

import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# GET /digest
# ---------------------------------------------------------------------------

class TestGetDigest:
    def test_returns_404_when_no_digest(self, test_client, db):
        db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = []

        resp = test_client.get("/digest")

        assert resp.status_code == 404
        assert "No digest found" in resp.json()["detail"]

    def test_returns_digest_with_scored_jobs(self, test_client, db):
        digest = {
            "id": "digest-uuid-1",
            "created_at": "2026-04-20T10:00:00Z",
            "market_summary": "Scored 5 jobs. Average fit: 72%.",
        }
        scored_jobs = [
            {
                "fit_score": 85,
                "matched_skills": ["RAG", "FastAPI"],
                "gaps": ["Go"],
                "notes": "Strong match.",
                "jobs": {
                    "id": "job-uuid-1",
                    "title": "AI Engineer",
                    "company": "Acme",
                    "location": "Remote",
                    "is_remote": True,
                    "url": "https://boards.greenhouse.io/acme/jobs/123",
                    "salary_range": "$150k-$180k",
                },
            }
        ]

        # First .execute() call → digests table
        digest_chain = MagicMock()
        digest_chain.execute.return_value.data = [digest]

        # Second .execute() call → digest_jobs table
        jobs_chain = MagicMock()
        jobs_chain.execute.return_value.data = scored_jobs

        # Route hits db.table("digests") first, then db.table("digest_jobs")
        db.table.side_effect = lambda name: digest_chain if name == "digests" else jobs_chain

        resp = test_client.get("/digest")

        assert resp.status_code == 200
        body = resp.json()
        assert body["digest_id"] == "digest-uuid-1"
        assert body["market_summary"] == digest["market_summary"]
        assert len(body["jobs"]) == 1
        assert body["jobs"][0]["fit_score"] == 85

    def test_limit_param_forwarded(self, test_client, db):
        digest_chain = MagicMock()
        digest_chain.execute.return_value.data = [
            {"id": "d1", "created_at": "2026-04-20T10:00:00Z", "market_summary": ""}
        ]
        jobs_chain = MagicMock()
        jobs_chain.execute.return_value.data = []
        db.table.side_effect = lambda name: digest_chain if name == "digests" else jobs_chain

        resp = test_client.get("/digest?limit=5")

        assert resp.status_code == 200
        # Confirm .limit(5) was called on the digest_jobs chain
        jobs_chain.select.return_value.eq.return_value.order.return_value.limit.assert_called_with(5)


# ---------------------------------------------------------------------------
# POST /chat
# ---------------------------------------------------------------------------

class TestPostChat:
    def test_returns_501_stub(self, test_client):
        resp = test_client.post("/chat", json={"message": "hello"})
        assert resp.status_code == 501
        assert "M4" in resp.json()["detail"]

    def test_rejects_missing_message_field(self, test_client):
        resp = test_client.post("/chat", json={})
        assert resp.status_code == 422

    def test_accepts_history(self, test_client):
        resp = test_client.post(
            "/chat",
            json={"message": "hi", "history": [{"role": "user", "content": "hey"}]},
        )
        # Still 501 — stub — but the request shape is valid
        assert resp.status_code == 501


# ---------------------------------------------------------------------------
# POST /digest (route delegation only — scorer is tested separately)
# ---------------------------------------------------------------------------

class TestPostDigest:
    def test_no_unseen_jobs_returns_message(self, test_client):
        with patch("agent.scorer.run_digest") as mock_run:
            mock_run.return_value = {"unseen_jobs": 0, "scored": 0, "digest_id": None}
            resp = test_client.post("/digest")

        assert resp.status_code == 200
        body = resp.json()
        assert body["unseen_jobs"] == 0
        assert "No unseen jobs" in body["message"]

    def test_returns_scorer_result(self, test_client):
        scorer_result = {
            "unseen_jobs": 8,
            "scored": 8,
            "digest_id": "digest-abc",
            "market_summary": "Scored 8 jobs.",
        }
        with patch("agent.scorer.run_digest") as mock_run:
            mock_run.return_value = scorer_result
            resp = test_client.post("/digest")

        assert resp.status_code == 200
        assert resp.json()["digest_id"] == "digest-abc"
        assert resp.json()["scored"] == 8
