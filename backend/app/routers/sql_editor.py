"""
sql_editor.py — FastAPI router for the in-app SQL editor.

Endpoint: POST /api/sql/execute
  - Accepts a raw SQL string from the React frontend
  - Validates it via sql_guard.validate()
  - Executes it via psycopg2
  - Returns structured JSON (rows, columns, duration, errors)

Security:
  - Only SELECT, EXPLAIN, WITH are permitted (enforced by sql_guard)
  - Result sets are truncated at 500 rows to prevent runaway queries
  - Query timeout: 10 seconds (set via psycopg2 statement_timeout)
"""

import time
import psycopg2
import psycopg2.extras
from fastapi import APIRouter
from app.models.schemas import SqlExecuteRequest, SqlExecuteResponse
from app.utils.sql_guard import validate
from app.config import DATABASE_URL

router = APIRouter(prefix="/api/sql", tags=["SQL Editor"])

# Maximum rows returned to the browser in a single response
_MAX_ROWS = 500

# PostgreSQL statement timeout (milliseconds) — prevents runaway queries
_STATEMENT_TIMEOUT_MS = 10_000  # 10 seconds


def _hint_for_pg_error(pg_error: psycopg2.Error, sql: str) -> str:
    """
    Generate a human-readable hint for common PostgreSQL errors.
    Uses the pgcode to map to known error patterns.
    """
    pgcode = getattr(pg_error, "pgcode", None)
    hints = {
        "42703": (
            "A column name in your query does not exist. "
            "Check spelling — PostgreSQL column names are case-sensitive when quoted. "
            "Available tables: customers (customer_id, customer_name, city, signup_date), "
            "products (product_id, product_name, category, brand), "
            "orders (order_id, customer_id, product_id, order_date, quantity, unit_price, discount)."
        ),
        "42P01": (
            "A table or view referenced in your query does not exist. "
            "Available tables: customers, products, orders."
        ),
        "42601": (
            "Syntax error in your SQL. Check for missing commas, unbalanced parentheses, "
            "or typos in SQL keywords."
        ),
        "42P20": (
            "Window function error — this often happens when a window function appears "
            "in a WHERE, GROUP BY, or HAVING clause. Wrap it in a CTE first:\n"
            "WITH cte AS (SELECT ..., ROW_NUMBER() OVER (...) AS rn FROM ...) "
            "SELECT * FROM cte WHERE rn = 1"
        ),
        "42883": (
            "Function does not exist for the given argument types. "
            "If using ROUND() with PERCENT_RANK() or CUME_DIST(), "
            "cast to NUMERIC first: ROUND(PERCENT_RANK() OVER (...)::NUMERIC, 4)"
        ),
        "57014": (
            "Query cancelled — execution exceeded the 10-second timeout. "
            "Try adding a LIMIT clause or narrowing the date range."
        ),
        "08006": "Database connection lost. Please retry the query.",
        "08001": "Cannot connect to the database. Check your Supabase project status.",
    }
    fallback = str(pg_error.pgerror or pg_error).strip()
    if pgcode is None and any(s in fallback.lower() for s in (
        "could not connect", "could not translate host name", "timeout expired",
        "connection refused", "name resolution", "server closed the connection",
    )):
        return (
            "Database is unavailable — the Supabase project may be paused. "
            "Open the Supabase dashboard, resume the project, then retry."
        )
    return hints.get(pgcode, fallback)


@router.post("/execute", response_model=SqlExecuteResponse)
def execute_sql(request: SqlExecuteRequest) -> SqlExecuteResponse:
    """
    Execute a SQL query against the Customer Purchase Analytics database.

    Permitted: SELECT, EXPLAIN, WITH (CTEs)
    Blocked:   INSERT, UPDATE, DELETE, DROP, TRUNCATE, CREATE, ALTER

    Returns up to 500 rows. Results beyond 500 are truncated (truncated=true).
    Execution times out after 10 seconds.
    """
    sql = request.sql.strip()

    # ── Step 1: Validate via sql_guard ────────────────────────────────────
    is_valid, error_code, reason = validate(sql)
    if not is_valid:
        return SqlExecuteResponse(
            status="error",
            error_code=error_code,
            error_message=reason,
            hint="Use the Supabase Dashboard at https://supabase.com/dashboard for write operations.",
            duration_ms=0,
        )

    # ── Step 2: Execute via psycopg2 ──────────────────────────────────────
    conn = None
    start_time = time.perf_counter()

    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)

        # Set statement timeout to prevent runaway queries
        with conn.cursor() as setup_cur:
            setup_cur.execute(f"SET statement_timeout = {_STATEMENT_TIMEOUT_MS};")

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)

            duration_ms = int((time.perf_counter() - start_time) * 1000)

            # Handle queries that return no result description (e.g. some EXPLAIN variants)
            if cur.description is None:
                return SqlExecuteResponse(
                    status="success",
                    row_count=0,
                    columns=[],
                    rows=[],
                    duration_ms=duration_ms,
                    query_type="EXPLAIN",
                )

            # Extract column names from cursor description
            columns = [desc.name for desc in cur.description]

            # Fetch up to MAX_ROWS + 1 to detect truncation
            raw_rows = cur.fetchmany(_MAX_ROWS + 1)
            truncated = len(raw_rows) > _MAX_ROWS
            rows = [dict(row) for row in raw_rows[:_MAX_ROWS]]

            # Serialise non-JSON-safe types (Decimal, date, etc.)
            rows = _serialise_rows(rows)

            return SqlExecuteResponse(
                status="success",
                row_count=len(rows),
                columns=columns,
                rows=rows,
                duration_ms=duration_ms,
                query_type="SELECT",
                truncated=truncated,
                truncated_at=_MAX_ROWS if truncated else None,
            )

    except psycopg2.Error as pg_err:
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        pgcode = getattr(pg_err, "pgcode", "UNKNOWN")
        hint = _hint_for_pg_error(pg_err, sql)
        return SqlExecuteResponse(
            status="error",
            error_code=pgcode,
            error_message=str(pg_err.pgerror or pg_err).strip(),
            hint=hint,
            duration_ms=duration_ms,
        )

    except Exception as exc:
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        return SqlExecuteResponse(
            status="error",
            error_code="INTERNAL_ERROR",
            error_message=str(exc),
            hint="An unexpected server error occurred. Check the backend logs for details.",
            duration_ms=duration_ms,
        )

    finally:
        if conn:
            conn.close()


def _serialise_rows(rows: list[dict]) -> list[dict]:
    """
    Convert non-JSON-serialisable Python types to JSON-safe equivalents.
    Handles: Decimal → float, date/datetime → ISO string, None → None.
    """
    import decimal
    import datetime

    def _coerce(value):
        if value is None:
            return None
        if isinstance(value, decimal.Decimal):
            return float(value)
        if isinstance(value, (datetime.date, datetime.datetime)):
            return value.isoformat()
        return value

    return [{k: _coerce(v) for k, v in row.items()} for row in rows]
