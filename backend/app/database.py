import psycopg2
import psycopg2.extras
from fastapi import HTTPException
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL

# How long (seconds) to wait for a TCP connection to the database before giving
# up. Kept well under the frontend's 15s axios timeout so a paused/unreachable
# database fails fast with a clear message instead of hanging the request.
_CONNECT_TIMEOUT = 5

# User-facing message shown when the database cannot be reached. Phrased for a
# non-technical reader and pointing at the most common cause (a paused Supabase
# free-tier project).
_DB_UNAVAILABLE_MESSAGE = (
    "Database is unavailable. The Supabase project is most likely paused or "
    "unreachable. Open the Supabase dashboard, resume the project "
    "(Project → Resume), wait about a minute, then retry. If it is not paused, "
    "check your internet connection and the DATABASE_URL in backend/.env."
)


# ─────────────────────────────────────────────
# Supabase-py client (used for simple CRUD)
# ─────────────────────────────────────────────
def get_supabase_client() -> Client:
    """
    Returns a Supabase client for simple CRUD operations.
    Uses the service-role key (server-side only — bypasses Row Level Security).
    The tables have RLS enabled with no public policy, so the anon key returns
    no rows; the service-role key lets this trusted backend read them while the
    tables stay private. This key is never exposed to the frontend (CORS is
    GET/POST-only and the key lives in backend/.env, which is gitignored).
    Use this for: GET customers, GET products, GET orders (simple list queries).
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ─────────────────────────────────────────────
# psycopg2 connection (used for raw SQL / window functions)
# ─────────────────────────────────────────────
def get_pg_connection():
    """
    Returns a direct psycopg2 connection to the PostgreSQL database.
    Use this for: all window function queries (M1–M10, Req #43 Mega Report).
    psycopg2 handles complex raw SQL better than the Supabase REST client.
    Caller is responsible for calling .close() after use.

    Fails fast: if the database cannot be reached within _CONNECT_TIMEOUT
    seconds (e.g. the Supabase project is paused), raises HTTP 503 with a
    clear, human-readable message instead of hanging the request.
    """
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=_CONNECT_TIMEOUT)
        return conn
    except psycopg2.OperationalError as exc:
        # Connection-level failure: paused project, DNS failure, wrong host,
        # bad credentials, network down, etc.
        raise HTTPException(
            status_code=503,
            detail=_DB_UNAVAILABLE_MESSAGE,
        ) from exc


def execute_raw_query(sql: str, params: tuple = None) -> list[dict]:
    """
    Execute a raw SQL query using psycopg2.
    Returns results as a list of dictionaries (column name → value).
    Used exclusively for window function queries.

    Args:
        sql: The complete SQL string to execute.
        params: Optional tuple of parameters for parameterized queries.

    Returns:
        List of row dicts with column names as keys.

    Raises:
        HTTPException(503): if the database is unreachable (see get_pg_connection).
    """
    conn = None
    try:
        conn = get_pg_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    finally:
        if conn:
            conn.close()
