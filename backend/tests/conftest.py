"""
Shared fixtures for backend tests.

chain(data, count) — builds a fluent mock where every builder method
(.select, .order, .limit, .eq, .in_, .update, .insert, .upsert, .single)
returns self, so any Supabase query chain terminates at the same
.execute() call regardless of depth.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


def chain(data=None, count=None):
    """
    A MagicMock that satisfies Supabase's fluent builder pattern at any depth:
        mock.select(...).order(...).limit(...).execute().data  → data
        mock.select(...).eq(...).execute().count              → count
    """
    m = MagicMock()
    for method in ("select", "order", "limit", "eq", "in_", "update",
                   "insert", "upsert", "single", "delete"):
        getattr(m, method).return_value = m

    exec_result = MagicMock()
    exec_result.data = data if data is not None else []
    exec_result.count = count
    m.execute.return_value = exec_result
    return m


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def test_client(db):
    """FastAPI TestClient with the Supabase db replaced by a mock."""
    with patch("main._get_db", return_value=db):
        with TestClient(__import__("main").app) as client:
            yield client
