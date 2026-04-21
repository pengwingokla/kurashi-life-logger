"""
profile.py — Read and write the resume_profile table in Supabase.

One row per user (we use a fixed profile_id for the personal dashboard).
"""

import uuid
from supabase import Client

# Fixed profile ID for single-user personal dashboard
PROFILE_ID = "00000000-0000-0000-0000-000000000001"

SEED_PROFILE = {
    "id": PROFILE_ID,
    "titles": [
        "AI Engineer",
        "AI/ML Software Engineer",
        "ML Engineer",
        "Data Scientist",
        "Research Engineer",
    ],
    "seniority": ["entry", "mid"],
    "years_experience": 2,
    "remote_preference": "both",
    "skills": {
        "ai_ml": [
            "RAG", "multi-agent systems", "MCP", "LangGraph", "few-shot prompting",
            "prompt engineering", "Pydantic", "hybrid search", "BM25", "FAISS",
            "Pinecone", "RRF", "CrossEncoder reranking", "vLLM", "Hugging Face",
            "scikit-learn", "MLFlow", "anomaly detection",
        ],
        "languages": ["Python", "SQL", "Java", "Scala", "C/C++", "Bash"],
        "data_infra": [
            "dbt", "Airflow", "Apache Spark", "BigQuery", "PostgreSQL", "MySQL",
            "Snowflake", "Databricks", "DuckDB", "Hadoop HDFS", "Elasticsearch",
        ],
        "cloud_devops": ["GCP", "AWS", "Azure", "Docker", "GitHub Actions", "CI/CD"],
        "backend": ["Flask", "FastAPI", "RESTful APIs"],
    },
    "strengths": [
        "agentic AI systems",
        "RAG pipelines",
        "LLM optimization",
        "production multi-agent systems",
        "ETL at scale",
        "search & retrieval systems",
    ],
}


def seed_profile(db: Client) -> None:
    """Insert the resume profile if it doesn't already exist."""
    existing = db.table("resume_profile").select("id").eq("id", PROFILE_ID).execute()
    if existing.data:
        print("[profile] Resume profile already seeded — skipping")
        return

    db.table("resume_profile").insert(SEED_PROFILE).execute()
    print("[profile] Resume profile seeded")


def get_profile(db: Client) -> dict:
    """Fetch the resume profile row."""
    result = db.table("resume_profile").select("*").eq("id", PROFILE_ID).single().execute()
    return result.data or {}


def update_profile(db: Client, updates: dict) -> dict:
    """Partial update to the resume profile."""
    result = (
        db.table("resume_profile")
        .update(updates)
        .eq("id", PROFILE_ID)
        .execute()
    )
    return result.data[0] if result.data else {}
