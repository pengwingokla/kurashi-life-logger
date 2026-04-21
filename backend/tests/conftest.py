"""
Shared fixtures for backend tests.

db_mock: a MagicMock that mimics Supabase's fluent query builder chain.
Use chain_mock() to set the data returned by .execute() on a specific chain.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


def make_db_mock():
    """
    Build a MagicMock that satisfies Supabase's builder pattern:
        db.table("x").select("...").eq(...).order(...).limit(...).execute()
    Because MagicMock auto-creates child mocks, each step returns a fresh
    MagicMock that also supports further chaining. Tests can configure the
    .execute().data (or .count) on the specific chain they care about.
    """
    return MagicMock()


def execute_returning(data=None, count=None):
    """Return a mock whose .execute() yields the given data/count."""
    m = MagicMock()
    m.execute.return_value.data = data or []
    m.execute.return_value.count = count
    return m


@pytest.fixture
def db():
    return make_db_mock()


@pytest.fixture
def test_client(db):
    """FastAPI TestClient with the Supabase db replaced by a mock."""
    with patch("main._get_db", return_value=db):
        with TestClient(__import__("main").app) as client:
            yield client
