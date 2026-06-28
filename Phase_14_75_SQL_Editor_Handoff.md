# Phase 14.75 — In-App SQL Editor
## Technical Handoff Document for Claude Cowork
**Inserted between:** Phase 14 (Req #43 Mega Report) → Phase 14.75 (SQL Editor) → Phase 15 (Final Integration Testing)**
**Project:** Customer Purchase Analytics — Full-Stack Integration**
**Author:** Saikalyan G | Incedo Inc. Internship Task 2**
**Design System:** DESIGN-voltagent.md (dark canvas, electric-green accent)**
**Stack:** FastAPI (Python) + React 18 (Vite) + Supabase PostgreSQL 17.6**
**Target Directory:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`**

---

## ⚠️ Claude Cowork Execution Rules

Read this document completely before writing any code.

1. All CSS values must use tokens from `index.css` (`var(--color-*)`, `var(--space-*)`, etc.) — no hardcoded hex
2. Design strictly follows `DESIGN-voltagent.md` — dark canvas `#101010`, electric-green `#00d992`, hairline borders, no box-shadow on cards
3. All existing Phase 11–14 files must remain intact — this phase adds new files only, unless explicitly told to modify an existing one
4. The SQL editor runs queries against the **live Supabase PostgreSQL 17.6** database via psycopg2
5. `SELECT` is permitted for all users; `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `CREATE` are blocked server-side
6. Execute sub-tasks sequentially. Confirm each one with Saikalyan before moving to the next
7. Do not install npm packages not listed in §6.1. Do not install new Python packages not listed in §6.2

---

## 0. Phase Overview

### Purpose

Phase 14.75 introduces a live, in-browser SQL editor that lets users write and execute PostgreSQL queries directly against the Customer Purchase Analytics database. This transforms the application from a read-only analytics dashboard into an interactive data exploration tool.

### How it fits

```
Phase 14  — Req #43 Mega Report (hardcoded window function query, frontend table)
     │
     ▼
Phase 14.75 — SQL Editor (ad-hoc query interface, live results, syntax-highlighted input)
     │
     ▼
Phase 15  — Final Integration Testing, Git Init, Project Wrap-up
```

The SQL Editor gives Saikalyan and stakeholders the ability to write arbitrary window function queries beyond the pre-built M1–M10 modules — directly validating the SQL skills learned throughout Phases 1–10 of the capstone.

### What gets built

| Deliverable | Location |
|-------------|---------|
| `POST /api/sql/execute` FastAPI endpoint | `backend/app/routers/sql_editor.py` |
| SQL validation middleware | `backend/app/utils/sql_guard.py` |
| `SqlEditor.jsx` page component | `frontend/src/pages/SqlEditor.jsx` |
| `ResultsTable.jsx` display component | `frontend/src/components/ResultsTable.jsx` |
| `SqlEditorToolbar.jsx` toolbar | `frontend/src/components/SqlEditorToolbar.jsx` |
| `useQueryHistory.js` custom hook | `frontend/src/hooks/useQueryHistory.js` |
| `useSqlEditor.js` custom hook | `frontend/src/hooks/useSqlEditor.js` |
| Query history (localStorage) | Client-side, persisted across sessions |
| Navbar route `/sql-editor` | Modify `Navbar.jsx` + `App.jsx` |

---

## 1. Functional Requirements

### 1.1 SQL Input Area

- Multi-line `<textarea>` that accepts arbitrary SQL text
- Minimum height: 200px; resizable vertically by the user (CSS `resize: vertical`)
- Font: `var(--font-mono)` (SF Mono / Menlo / monospace) at 13px — matching `DESIGN-voltagent.md §code` style
- Placeholder text shows a sample window function query using the project's own schema
- Tab key inserts 2 spaces instead of leaving the field (prevent focus trap — use `Shift+Tab` to exit)
- `Ctrl+Enter` / `Cmd+Enter` keyboard shortcut triggers execution (cross-platform)
- Line numbers displayed as a non-selectable left gutter
- Current line highlighted with a subtle background tint
- Character count and line count displayed in the toolbar below the editor

### 1.2 Execution Controls

- **Run Query** button: primary `button-primary` style from `DESIGN-voltagent.md` (green background, dark text)
- **Clear** button: `button-outline-on-dark` style (hairline border)
- **Copy SQL** button: ghost icon button — copies current editor content to clipboard
- **History** toggle button: opens/closes the query history panel
- During execution: Run button shows spinner + disabled state; label changes to "Running…"
- Keyboard shortcut `Ctrl+Enter` / `Cmd+Enter` triggers Run (must work from anywhere within the editor pane)
- Execution time displayed in milliseconds after each run (e.g., `Executed in 142ms`)

### 1.3 Output Display Area

Three mutually exclusive states displayed below the editor:

**State A — Results Table**
- Shown when query returns rows
- Horizontally scrollable table using `DESIGN-voltagent.md §ex-data-table-cell` spec
- Header: `{colors.canvas-soft}` background, `{typography.caption}` uppercase tracked labels
- Row border: `1px solid {colors.hairline}`
- Row count badge: `{rounded.pill}` green pill showing `N rows`
- Pagination: show 50 rows per page; Previous / Next controls if result > 50 rows
- Column names are auto-detected from query results
- Numeric columns right-aligned; text columns left-aligned
- NULL values display as `—` in `{colors.mute}` italic

**State B — Success Message (no rows)**
- Shown when query executes successfully but returns no rows (e.g., after a valid `SELECT` that returns empty)
- Green check icon + "Query executed successfully — 0 rows returned"

**State C — Error Panel**
- Shown when query fails (syntax error, permission error, runtime error)
- Left red border (`var(--color-danger)`) on a `{card-feature}` chrome card
- PostgreSQL error code displayed in `{font-mono}` (e.g., `42703 — column "foo" does not exist`)
- Human-readable hint below the error code
- "Fix suggestion" line where the backend can provide context-aware guidance

**State D — Empty (initial)**
- On first load, no results panel shown
- Placeholder text: "Run a query to see results here"
- Shown in `{colors.mute}` centered in the results area

### 1.4 Permitted SQL Operations

| Operation | Permitted | Notes |
|-----------|-----------|-------|
| `SELECT` | ✅ Yes | Full support including CTEs, window functions, JOINs |
| `EXPLAIN` | ✅ Yes | `EXPLAIN` and `EXPLAIN ANALYZE` for query planning |
| `WITH` (CTE) | ✅ Yes | All CTE patterns used in M1–M10 are supported |
| `INSERT` | ❌ Blocked | Returns 403 with explanation |
| `UPDATE` | ❌ Blocked | Returns 403 with explanation |
| `DELETE` | ❌ Blocked | Returns 403 with explanation |
| `DROP` | ❌ Blocked | Returns 403 with explanation |
| `TRUNCATE` | ❌ Blocked | Returns 403 with explanation |
| `CREATE` | ❌ Blocked | Returns 403 with explanation |
| `ALTER` | ❌ Blocked | Returns 403 with explanation |
| Multiple statements | ❌ Blocked | Only one statement per execution allowed |

### 1.5 Syntax Features (Client-Side, No Library)

Since no new npm packages are installed, syntax highlighting is implemented using a lightweight custom approach:

- **Keyword colouring**: SQL keywords (`SELECT`, `FROM`, `WHERE`, `WITH`, `OVER`, `PARTITION BY`, `ORDER BY`, `ROWS BETWEEN`, etc.) highlighted in `{colors.primary-soft}` (`#2fd6a1`)
- **String literals**: highlighted in `#f59e0b` (amber)
- **Comments** (`--` and `/* */`): highlighted in `{colors.mute}` (`#8b949e`)
- **Numbers**: highlighted in `{colors.primary}` (`#00d992`)
- **Implementation**: Overlay technique — a `<div>` with identical font metrics sits behind the `<textarea>`. The `<div>` receives highlighted HTML; the `<textarea>` is transparent on top. This is the CodeMirror-free approach used by tools like Prism.js overlays.

### 1.6 Query History

- Last 20 queries stored in `localStorage` under key `cpa_query_history`
- Each history entry stores: `{ id, sql, executedAt, durationMs, rowCount, status }`
- History panel slides in from the right side of the editor
- Click any history item to restore it into the editor
- "Clear History" button at the top of the history panel
- History persists across browser refresh sessions

### 1.7 Schema Reference Panel (Collapsible)

- Collapsible sidebar showing the database schema
- Lists all 3 tables: `customers`, `products`, `orders`
- Each table shows its columns and data types
- Click on a column name to insert it at the cursor position in the editor
- Collapsed by default on smaller screens

---

## 2. Technical Architecture

### 2.1 System Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React + Vite)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  SqlEditor.jsx                        │   │
│  │                                                      │   │
│  │  ┌──────────────────┐   ┌──────────────────────┐    │   │
│  │  │  SQL Input Area  │   │  Schema Panel        │    │   │
│  │  │  (textarea +     │   │  (tables/columns,    │    │   │
│  │  │   highlight div) │   │   click-to-insert)   │    │   │
│  │  └────────┬─────────┘   └──────────────────────┘    │   │
│  │           │                                          │   │
│  │  ┌────────▼─────────────────────────┐               │   │
│  │  │  SqlEditorToolbar.jsx            │               │   │
│  │  │  (Run | Clear | Copy | History)  │               │   │
│  │  └────────┬─────────────────────────┘               │   │
│  │           │  useSqlEditor.js hook                    │   │
│  │           │  → Axios POST /api/sql/execute           │   │
│  │           │                                          │   │
│  │  ┌────────▼─────────────────────────┐               │   │
│  │  │  ResultsTable.jsx                │               │   │
│  │  │  (table / error / empty states)  │               │   │
│  │  └──────────────────────────────────┘               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP POST (Axios)
                       │  Body: { sql: "SELECT ..." }
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  FastAPI Backend (:8000)                      │
│                                                              │
│  POST /api/sql/execute                                       │
│  ┌────────────────────────────────────────┐                  │
│  │  sql_editor.py router                  │                  │
│  │  1. Receive { sql } from request body  │                  │
│  │  2. Call sql_guard.validate(sql)       │                  │
│  │     - Strip comments                   │                  │
│  │     - Tokenise first keyword           │                  │
│  │     - Reject non-SELECT/EXPLAIN/WITH   │                  │
│  │     - Reject multiple statements       │                  │
│  │     - Reject dangerous keywords        │                  │
│  │  3. If valid: execute_raw_query(sql)   │                  │
│  │     via psycopg2 (existing util)       │                  │
│  │  4. Return JSON response               │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │  psycopg2 (Direct PostgreSQL)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Supabase PostgreSQL 17.6                                    │
│  Project: ahoqabjdshigaqduiyou | Region: ap-south-1         │
│  Tables: customers, products, orders                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Tree

```
SqlEditor (page)
├── SchemaPanel (collapsible sidebar)
│   └── SchemaTable (per table: name + columns list)
├── EditorPane (main editor area)
│   ├── LineNumbers (gutter)
│   ├── HighlightLayer (behind textarea)
│   ├── QueryTextarea (the actual input)
│   └── EditorFooter (char count, line count, shortcut hint)
├── SqlEditorToolbar
│   ├── RunButton (primary CTA)
│   ├── ClearButton (outline)
│   ├── CopyButton (ghost icon)
│   └── HistoryButton (ghost icon, toggles HistoryPanel)
├── HistoryPanel (slide-in from right)
│   ├── HistoryHeader (title + Clear All button)
│   └── HistoryItem[] (each: sql preview + metadata + restore button)
└── ResultsPane
    ├── ResultsTable (State A — has rows)
    │   ├── PaginationControls
    │   └── RowCountBadge
    ├── EmptySuccess (State B — 0 rows)
    ├── ErrorPanel (State C — query error)
    └── EmptyDefault (State D — no query yet)
```

### 2.3 API Contract

#### `POST /api/sql/execute`

**Request:**
```json
{
  "sql": "SELECT c.customer_name, SUM(o.quantity * o.unit_price * (1 - o.discount)) AS total FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id GROUP BY c.customer_name ORDER BY total DESC"
}
```

**Response — Success (200):**
```json
{
  "status": "success",
  "row_count": 7,
  "columns": ["customer_name", "total"],
  "rows": [
    { "customer_name": "Aanya Sharma", "total": 143200.50 },
    { "customer_name": "Rohan Mehta",  "total": 128450.00 }
  ],
  "duration_ms": 142,
  "query_type": "SELECT",
  "truncated": false
}
```

**Response — Blocked Operation (403):**
```json
{
  "status": "error",
  "error_code": "OPERATION_BLOCKED",
  "error_message": "DELETE queries are not permitted in this interface.",
  "hint": "Only SELECT, EXPLAIN, and WITH (CTE) queries are allowed. Use the Supabase Dashboard for write operations.",
  "duration_ms": 0
}
```

**Response — SQL Error (400):**
```json
{
  "status": "error",
  "error_code": "42703",
  "error_message": "column \"custmer_name\" does not exist",
  "hint": "Did you mean \"customer_name\"? Available columns on customers: customer_id, customer_name, city, signup_date.",
  "duration_ms": 38
}
```

**Response — Large Result Set (200, truncated):**
```json
{
  "status": "success",
  "row_count": 500,
  "columns": ["..."],
  "rows": ["first 500 rows..."],
  "duration_ms": 891,
  "query_type": "SELECT",
  "truncated": true,
  "truncated_at": 500,
  "total_row_estimate": "unknown"
}
```

### 2.4 Pydantic Schema

```python
# backend/app/models/schemas.py — ADD these classes (do not remove existing ones)

class SqlExecuteRequest(BaseModel):
    sql: str

    class Config:
        json_schema_extra = {
            "example": {
                "sql": "SELECT * FROM customers ORDER BY customer_id;"
            }
        }

class SqlExecuteResponse(BaseModel):
    status: str                           # "success" | "error"
    row_count: Optional[int] = None
    columns: Optional[list[str]] = None
    rows: Optional[list[dict]] = None
    duration_ms: int
    query_type: Optional[str] = None
    truncated: bool = False
    truncated_at: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    hint: Optional[str] = None
```

---

## 3. Implementation Steps

### Step 1 — Backend: SQL Guard Utility

**File to create:** `backend/app/utils/__init__.py` (empty)
**File to create:** `backend/app/utils/sql_guard.py`

```python
"""
sql_guard.py — SQL statement validation for the in-app SQL editor.

Rules (derived from Phase 14.75 functional requirements):
  - Only SELECT, EXPLAIN, and WITH (leading a CTE) are permitted.
  - Multiple statements (semicolons mid-query) are blocked.
  - Dangerous DDL/DML keywords are rejected regardless of position.
  - Comments are stripped before analysis to prevent bypass attempts.

This module never raises — it returns a (is_valid: bool, reason: str) tuple.
"""

import re

# ── Permitted leading keywords ────────────────────────────────────────────────
_PERMITTED_STARTERS = {"SELECT", "EXPLAIN", "WITH"}

# ── Dangerous keywords that must never appear anywhere in the query ───────────
# Even inside subqueries or comments — strip comments first, then check.
_DANGEROUS_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE",
    "CREATE", "ALTER", "GRANT", "REVOKE", "EXECUTE",
    "EXEC", "CALL", "COPY", "VACUUM", "CLUSTER",
    "REINDEX", "REFRESH", "NOTIFY", "LISTEN",
}

# ── Comment patterns ──────────────────────────────────────────────────────────
_SINGLE_LINE_COMMENT = re.compile(r"--[^\n]*")
_MULTI_LINE_COMMENT  = re.compile(r"/\*.*?\*/", re.DOTALL)

# ── String literal patterns (to avoid scanning inside them) ──────────────────
_STRING_LITERAL = re.compile(r"'(?:''|[^'])*'")


def _strip_comments(sql: str) -> str:
    """Remove -- and /* */ comments from the SQL string."""
    sql = _MULTI_LINE_COMMENT.sub(" ", sql)
    sql = _SINGLE_LINE_COMMENT.sub(" ", sql)
    return sql


def _strip_string_literals(sql: str) -> str:
    """Replace string literals with empty strings to avoid false keyword matches."""
    return _STRING_LITERAL.sub("''", sql)


def validate(sql: str) -> tuple[bool, str, str]:
    """
    Validate a SQL string for safety.

    Returns:
        (is_valid: bool, error_code: str, reason: str)
        If is_valid is True, error_code and reason are empty strings.

    Examples:
        validate("SELECT * FROM customers")
        → (True, "", "")

        validate("DELETE FROM orders")
        → (False, "OPERATION_BLOCKED",
           "DELETE queries are not permitted in this interface.")
    """
    if not sql or not sql.strip():
        return False, "EMPTY_QUERY", "Query cannot be empty."

    # Strip comments before analysis
    cleaned = _strip_comments(sql)
    cleaned_no_literals = _strip_string_literals(cleaned)

    # ── Check 1: No dangerous keywords anywhere in query ─────────────────────
    # Tokenise to whole-word match only (avoid matching 'SELECT' inside 'SELECTALL')
    tokens = set(re.findall(r"\b[A-Z_]+\b", cleaned_no_literals.upper()))
    blocked = tokens & _DANGEROUS_KEYWORDS
    if blocked:
        blocked_word = sorted(blocked)[0]
        return (
            False,
            "OPERATION_BLOCKED",
            f"{blocked_word} queries are not permitted in this interface. "
            f"Only SELECT, EXPLAIN, and WITH (CTE) queries are allowed. "
            f"Use the Supabase Dashboard for write operations.",
        )

    # ── Check 2: Multiple statements (naive semicolon check) ─────────────────
    # Remove the trailing semicolon (common in editor pastes), then check again.
    stripped_trailing = cleaned.rstrip().rstrip(";").strip()
    if ";" in stripped_trailing:
        return (
            False,
            "MULTIPLE_STATEMENTS",
            "Only one SQL statement is allowed per execution. "
            "Remove additional statements separated by semicolons.",
        )

    # ── Check 3: First meaningful keyword must be permitted ───────────────────
    first_keyword_match = re.search(r"\b([A-Z]+)\b", cleaned.upper())
    if not first_keyword_match:
        return False, "PARSE_ERROR", "Could not identify a SQL keyword in the query."

    first_keyword = first_keyword_match.group(1)
    if first_keyword not in _PERMITTED_STARTERS:
        return (
            False,
            "OPERATION_BLOCKED",
            f"Queries starting with {first_keyword} are not permitted. "
            f"Allowed starters: SELECT, EXPLAIN, WITH.",
        )

    return True, "", ""
```

---

### Step 2 — Backend: SQL Editor Router

**File to create:** `backend/app/routers/sql_editor.py`

```python
"""
sql_editor.py — FastAPI router for the in-app SQL editor.

Endpoint: POST /api/sql/execute
  - Accepts a raw SQL string from the React frontend
  - Validates it via sql_guard.validate()
  - Executes it via psycopg2 (existing execute_raw_query utility)
  - Returns structured JSON (rows, columns, duration, errors)

Security:
  - Only SELECT, EXPLAIN, WITH are permitted (enforced by sql_guard)
  - Result sets are truncated at 500 rows to prevent runaway queries
  - Query timeout: 10 seconds (set via psycopg2 statement_timeout)
  - No parameterisation needed (read-only queries have no injection risk
    for data integrity, but we still validate to prevent schema inspection)
"""

import time
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException
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
    return hints.get(pgcode, str(pg_error.pgerror or pg_error).strip())


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
        conn = psycopg2.connect(DATABASE_URL)

        # Set statement timeout to prevent runaway queries
        with conn.cursor() as setup_cur:
            setup_cur.execute(f"SET statement_timeout = {_STATEMENT_TIMEOUT_MS};")

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)

            duration_ms = int((time.perf_counter() - start_time) * 1000)

            # Handle EXPLAIN queries (returns rows with single "QUERY PLAN" column)
            if cur.description is None:
                # Query returned no description (e.g. some EXPLAIN variants)
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
```

---

### Step 3 — Register Router in main.py

Claude Cowork: Open `backend/app/main.py` and add the following **after the existing router imports** (after `from app.routers import analytics`):

```python
# Add to imports section:
from app.routers import sql_editor

# Add after the existing app.include_router() calls:
app.include_router(sql_editor.router)
```

The full updated router registration block in `main.py` should look like:

```python
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(analytics.router)
app.include_router(sql_editor.router)     # ← NEW (Phase 14.75)
```

---

### Step 4 — Frontend: useSqlEditor.js Hook

**File to create:** `frontend/src/hooks/useSqlEditor.js`

```javascript
/**
 * useSqlEditor — state management hook for the SQL editor.
 *
 * Manages: SQL text, execution state, results, errors, execution time.
 * Delegates history management to useQueryHistory.
 */
import { useState, useCallback, useRef } from "react";
import apiClient from "../api/client";
import { useQueryHistory } from "./useQueryHistory";

export const DEFAULT_QUERY = `-- Customer Purchase Analytics — SQL Editor
-- Database: Supabase PostgreSQL 17.6
-- Tables: customers, products, orders
-- Try one of the window function queries from M1–M10 below:

SELECT
    c.customer_name,
    c.city,
    o.order_date,
    ROUND(o.quantity * o.unit_price * (1 - o.discount), 2)    AS order_amount,
    ROW_NUMBER() OVER (
        PARTITION BY c.customer_id ORDER BY o.order_date
    )                                                           AS purchase_sequence,
    SUM(ROUND(o.quantity * o.unit_price * (1 - o.discount), 2))
        OVER (
            PARTITION BY c.customer_id ORDER BY o.order_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                       AS running_total
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN products  p ON o.product_id  = p.product_id
ORDER BY c.customer_id, o.order_date;`;

export function useSqlEditor() {
  const [sql, setSql]             = useState(DEFAULT_QUERY);
  const [status, setStatus]       = useState("idle"); // "idle" | "running" | "success" | "error"
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [durationMs, setDurationMs] = useState(null);
  const abortRef                  = useRef(null);

  const { addToHistory } = useQueryHistory();

  const executeQuery = useCallback(async (queryOverride) => {
    const queryToRun = (queryOverride ?? sql).trim();
    if (!queryToRun) return;

    setStatus("running");
    setResult(null);
    setError(null);
    setDurationMs(null);

    try {
      const response = await apiClient.post("/api/sql/execute", {
        sql: queryToRun,
      });

      const data = response.data;
      setDurationMs(data.duration_ms);

      if (data.status === "success") {
        setStatus("success");
        setResult(data);
        addToHistory({
          sql: queryToRun,
          durationMs: data.duration_ms,
          rowCount: data.row_count,
          status: "success",
        });
      } else {
        setStatus("error");
        setError(data);
        addToHistory({
          sql: queryToRun,
          durationMs: data.duration_ms,
          rowCount: 0,
          status: "error",
          errorCode: data.error_code,
        });
      }
    } catch (networkErr) {
      setStatus("error");
      const errData = {
        status: "error",
        error_code: "NETWORK_ERROR",
        error_message: networkErr.message || "Network request failed.",
        hint: "Ensure the FastAPI backend is running on port 8000.",
        duration_ms: 0,
      };
      setError(errData);
      addToHistory({
        sql: queryToRun,
        durationMs: 0,
        rowCount: 0,
        status: "error",
        errorCode: "NETWORK_ERROR",
      });
    } finally {
      setStatus((prev) => (prev === "running" ? "idle" : prev));
    }
  }, [sql, addToHistory]);

  const clearEditor = useCallback(() => {
    setSql("");
    setResult(null);
    setError(null);
    setStatus("idle");
    setDurationMs(null);
  }, []);

  const isRunning = status === "running";

  return {
    sql, setSql,
    status,
    result,
    error,
    durationMs,
    isRunning,
    executeQuery,
    clearEditor,
  };
}
```

---

### Step 5 — Frontend: useQueryHistory.js Hook

**File to create:** `frontend/src/hooks/useQueryHistory.js`

```javascript
/**
 * useQueryHistory — localStorage-backed query history management.
 * Key: "cpa_query_history"
 * Stores last 20 queries with metadata.
 */
import { useState, useCallback } from "react";

const STORAGE_KEY = "cpa_query_history";
const MAX_HISTORY  = 20;

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function useQueryHistory() {
  const [history, setHistory] = useState(loadHistory);

  const addToHistory = useCallback(({ sql, durationMs, rowCount, status, errorCode }) => {
    setHistory((prev) => {
      const entry = {
        id: Date.now().toString(),
        sql,
        executedAt: new Date().toISOString(),
        durationMs,
        rowCount,
        status,
        errorCode: errorCode || null,
        preview: sql.replace(/\s+/g, " ").slice(0, 80),
      };
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
```

---

### Step 6 — Frontend: Syntax Highlight Utility

**File to create:** `frontend/src/utils/sqlHighlight.js`

```javascript
/**
 * sqlHighlight — lightweight SQL syntax highlighting without any npm dependency.
 *
 * Technique: Regex-based token replacement → returns an HTML string.
 * The HTML string is injected into a <div> that sits visually behind the <textarea>.
 * The <textarea> is made transparent so the highlight layer shows through.
 *
 * Token colours use Voltagent design tokens via CSS custom properties:
 *   keywords    → var(--color-primary-soft)   #2fd6a1
 *   strings     → #f59e0b                     (amber — semantic warning colour)
 *   comments    → var(--color-mute)            #8b949e
 *   numbers     → var(--color-primary)         #00d992
 *   operators   → var(--color-hairline-soft)   #b8b3b0
 */

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "EXISTS",
  "INNER", "LEFT", "RIGHT", "OUTER", "FULL", "JOIN", "ON", "USING",
  "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "DISTINCT",
  "AS", "CASE", "WHEN", "THEN", "ELSE", "END", "WITH", "RECURSIVE",
  "UNION", "INTERSECT", "EXCEPT", "ALL",
  // Window functions
  "OVER", "PARTITION", "ROWS", "RANGE", "BETWEEN",
  "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT", "ROW",
  "ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE",
  "PERCENT_RANK", "CUME_DIST",
  "LAG", "LEAD", "FIRST_VALUE", "LAST_VALUE",
  "SUM", "AVG", "COUNT", "MAX", "MIN",
  // Data types and functions
  "ROUND", "NULLIF", "COALESCE", "CAST",
  "NUMERIC", "INTEGER", "VARCHAR", "TEXT", "DATE", "BOOLEAN",
  "NULL", "TRUE", "FALSE", "EXPLAIN", "ANALYZE",
  // Join types
  "NATURAL", "CROSS",
];

const KEYWORD_PATTERN = new RegExp(
  `\\b(${SQL_KEYWORDS.join("|")})\\b`,
  "gi"
);

/**
 * Escape HTML special characters before injecting into innerHTML.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Tokenise and highlight a SQL string.
 * Returns an HTML string safe for innerHTML.
 */
export function highlightSql(sql) {
  if (!sql) return "";

  // Process line-by-line to handle -- comments correctly
  const lines = sql.split("\n");

  const highlightedLines = lines.map((line) => {
    // Check for single-line comment
    const commentIdx = line.indexOf("--");
    if (commentIdx !== -1) {
      const codePart    = line.slice(0, commentIdx);
      const commentPart = line.slice(commentIdx);
      return (
        highlightCodePart(codePart) +
        `<span style="color:var(--color-mute);font-style:italic">${escapeHtml(commentPart)}</span>`
      );
    }
    return highlightCodePart(line);
  });

  return highlightedLines.join("\n");
}

function highlightCodePart(code) {
  // Replace string literals first to avoid highlighting keywords inside them
  const stringPlaceholders = [];
  const withPlaceholders = code.replace(/'(?:''|[^'])*'/g, (match) => {
    const idx = stringPlaceholders.length;
    stringPlaceholders.push(match);
    return `\x00STR${idx}\x00`;
  });

  // Escape HTML
  let escaped = escapeHtml(withPlaceholders);

  // Highlight keywords
  escaped = escaped.replace(KEYWORD_PATTERN, (match) => (
    `<span style="color:var(--color-primary-soft);font-weight:600">${match.toUpperCase()}</span>`
  ));

  // Highlight numbers
  escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => (
    `<span style="color:var(--color-primary)">${match}</span>`
  ));

  // Restore string placeholders with highlighting
  escaped = escaped.replace(/\x00STR(\d+)\x00/g, (_, idx) => {
    const original = escapeHtml(stringPlaceholders[parseInt(idx)]);
    return `<span style="color:#f59e0b">${original}</span>`;
  });

  return escaped;
}
```

---

### Step 7 — Frontend: ResultsTable.jsx Component

**File to create:** `frontend/src/components/ResultsTable.jsx`

```jsx
/**
 * ResultsTable — displays SQL query results in all 4 states.
 * Source: DESIGN-voltagent.md §ex-data-table-cell
 */
import { useState } from "react";
import { IconAlert } from "./Icons";

const PAGE_SIZE = 50;

function NullCell() {
  return (
    <span style={{
      color: "var(--color-mute)",
      fontStyle: "italic",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-caption-size)",
    }}>
      NULL
    </span>
  );
}

function PaginationBar({ page, totalPages, onPrev, onNext, rowCount, pageSize }) {
  const start = page * pageSize + 1;
  const end   = Math.min((page + 1) * pageSize, rowCount);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-md) var(--space-lg)",
      borderTop: "1px solid var(--color-hairline)",
      backgroundColor: "var(--color-canvas-soft)",
    }}>
      <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
        Showing {start}–{end} of {rowCount} rows
      </span>
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <button
          onClick={onPrev}
          disabled={page === 0}
          style={paginationBtnStyle(page === 0)}
        >
          ← Prev
        </button>
        <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)", alignSelf: "center" }}>
          Page {page + 1} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          style={paginationBtnStyle(page >= totalPages - 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function paginationBtnStyle(disabled) {
  return {
    padding: "var(--space-xs) var(--space-md)",
    backgroundColor: disabled ? "transparent" : "var(--color-canvas)",
    color: disabled ? "var(--color-mute)" : "var(--color-ink)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "var(--text-caption-size)",
    fontFamily: "var(--font-sans)",
    opacity: disabled ? 0.4 : 1,
    transition: "all var(--transition-fast)",
  };
}

function isNumericColumn(rows, col) {
  const sample = rows.find((r) => r[col] !== null && r[col] !== undefined);
  if (!sample) return false;
  return typeof sample[col] === "number";
}

export default function ResultsTable({ result, error, status, durationMs }) {
  const [page, setPage] = useState(0);

  // Reset page when result changes
  const rows        = result?.rows || [];
  const columns     = result?.columns || [];
  const totalPages  = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows    = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── State D: No query yet ──────────────────────────────────────────────
  if (status === "idle" && !result && !error) {
    return (
      <div style={emptyStateStyle}>
        <p style={{ color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)", margin: 0 }}>
          Run a query to see results here
        </p>
      </div>
    );
  }

  // ── State C: Error ─────────────────────────────────────────────────────
  if (status === "error" && error) {
    return (
      <div style={{
        margin: 0,
        backgroundColor: "var(--color-canvas-soft)",
        border: "1px solid var(--color-hairline)",
        borderLeft: "3px solid var(--color-danger)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <IconAlert size={16} style={{ color: "var(--color-danger)" }} />
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm-size)",
            fontWeight: "600",
            color: "var(--color-ink)",
          }}>
            Query Error
            {error.error_code && (
              <code style={{
                marginLeft: "var(--space-sm)",
                fontSize: "var(--text-caption-size)",
                color: "var(--color-danger)",
                backgroundColor: "rgba(248,113,113,0.08)",
                padding: "1px 6px",
                borderRadius: "var(--radius-xs)",
              }}>
                {error.error_code}
              </code>
            )}
          </span>
          {durationMs !== null && (
            <span style={{ marginLeft: "auto", fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
              {durationMs}ms
            </span>
          )}
        </div>

        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-code-size)",
          color: "var(--color-body)",
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {error.error_message}
        </p>

        {error.hint && (
          <div style={{
            borderTop: "1px solid var(--color-hairline)",
            paddingTop: "var(--space-md)",
            fontSize: "var(--text-body-sm-size)",
            color: "var(--color-mute)",
            lineHeight: "var(--text-body-md-lh)",
          }}>
            <span style={{ fontWeight: "600", color: "var(--color-primary-soft)" }}>Hint: </span>
            {error.hint}
          </div>
        )}
      </div>
    );
  }

  // ── State B: Success, 0 rows ───────────────────────────────────────────
  if (status === "success" && result && rows.length === 0) {
    return (
      <div style={{ ...emptyStateStyle, border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
        <span style={{ color: "var(--color-primary)", fontSize: "18px" }}>✓</span>
        <p style={{ color: "var(--color-body)", fontSize: "var(--text-body-sm-size)", margin: 0 }}>
          Query executed successfully — 0 rows returned
        </p>
        {durationMs !== null && (
          <p style={{ color: "var(--color-mute)", fontSize: "var(--text-caption-size)", margin: 0 }}>
            {durationMs}ms
          </p>
        )}
      </div>
    );
  }

  // ── State A: Has rows ──────────────────────────────────────────────────
  if (status === "success" && result && rows.length > 0) {
    return (
      <div style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}>
        {/* Results header bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-md) var(--space-lg)",
          backgroundColor: "var(--color-canvas-soft)",
          borderBottom: "1px solid var(--color-hairline)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            {/* Row count pill */}
            <span style={{
              backgroundColor: "rgba(0,217,146,0.10)",
              color: "var(--color-primary)",
              border: "1px solid rgba(0,217,146,0.25)",
              borderRadius: "var(--radius-pill)",
              padding: "var(--space-xxs) var(--space-md)",
              fontSize: "var(--text-caption-size)",
              fontWeight: "600",
            }}>
              {result.row_count} {result.row_count === 1 ? "row" : "rows"}
            </span>
            {result.truncated && (
              <span style={{
                backgroundColor: "rgba(245,158,11,0.10)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "var(--radius-pill)",
                padding: "var(--space-xxs) var(--space-md)",
                fontSize: "var(--text-caption-size)",
                fontWeight: "600",
              }}>
                Truncated at {result.truncated_at}
              </span>
            )}
          </div>
          {durationMs !== null && (
            <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
              Executed in {durationMs}ms
            </span>
          )}
        </div>

        {/* Scrollable table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-sans)",
            backgroundColor: "var(--color-canvas)",
          }}>
            <thead>
              <tr>
                {/* Row number gutter */}
                <th style={{ ...thStyle, width: "40px", color: "var(--color-mute)" }}>#</th>
                {columns.map((col) => (
                  <th key={col} style={{
                    ...thStyle,
                    textAlign: isNumericColumn(rows, col) ? "right" : "left",
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--color-hairline)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-canvas-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Row number */}
                  <td style={{ ...tdStyle, color: "var(--color-mute)", fontFamily: "var(--font-mono)", textAlign: "right", userSelect: "none" }}>
                    {page * PAGE_SIZE + i + 1}
                  </td>
                  {columns.map((col) => {
                    const value = row[col];
                    const isNum = isNumericColumn(rows, col);
                    return (
                      <td key={col} style={{
                        ...tdStyle,
                        textAlign: isNum ? "right" : "left",
                        fontFamily: isNum ? "var(--font-mono)" : "var(--font-sans)",
                        fontVariantNumeric: isNum ? "tabular-nums" : "normal",
                      }}>
                        {value === null || value === undefined ? <NullCell /> : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            rowCount={rows.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          />
        )}
      </div>
    );
  }

  return null;
}

const emptyStateStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-sm)",
  padding: "var(--space-5xl)",
};

const thStyle = {
  padding: "var(--space-md) var(--space-lg)",
  backgroundColor: "var(--color-canvas-soft)",
  color: "var(--color-mute)",
  fontSize: "var(--text-caption-size)",
  fontWeight: "600",
  letterSpacing: "var(--text-eyebrow-mono-ls)",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--color-hairline)",
  fontFamily: "var(--font-sans)",
};

const tdStyle = {
  padding: "var(--space-md) var(--space-lg)",
  fontSize: "var(--text-body-sm-size)",
  color: "var(--color-ink)",
  whiteSpace: "nowrap",
  maxWidth: "320px",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
```

---

### Step 8 — Frontend: SqlEditor.jsx Page

**File to create:** `frontend/src/pages/SqlEditor.jsx`

```jsx
/**
 * SqlEditor.jsx — the SQL editor page component.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Page Header (eyebrow + title + description)        │
 *   ├─────────────────┬───────────────────────────────────┤
 *   │  Schema Panel   │  Editor Pane                      │
 *   │  (collapsible)  │  ┌─────────────────────────────┐  │
 *   │  • customers    │  │  Highlight Layer (div)      │  │
 *   │  • products     │  │  Textarea (transparent)     │  │
 *   │  • orders       │  └─────────────────────────────┘  │
 *   │                 │  Editor Footer (char/line count)   │
 *   │                 │  ─────────────────────────────     │
 *   │                 │  SqlEditorToolbar                  │
 *   │                 │  (Run | Clear | Copy | History)    │
 *   ├─────────────────┴───────────────────────────────────┤
 *   │  ResultsTable (state A/B/C/D)                       │
 *   └─────────────────────────────────────────────────────┘
 */
import { useRef, useEffect, useCallback, useState } from "react";
import { useSqlEditor } from "../hooks/useSqlEditor";
import { useQueryHistory } from "../hooks/useQueryHistory";
import { highlightSql } from "../utils/sqlHighlight";
import ResultsTable from "../components/ResultsTable";
import { IconBarChart, IconUsers, IconBox, IconShoppingCart, IconRefresh } from "../components/Icons";
import LoadingSpinner from "../components/LoadingSpinner";

/* ── Schema definition (static — matches live Supabase DB) ──────────── */
const SCHEMA = [
  {
    table: "customers",
    icon: IconUsers,
    columns: [
      { name: "customer_id",   type: "SERIAL PK" },
      { name: "customer_name", type: "VARCHAR(100)" },
      { name: "city",          type: "VARCHAR(50)" },
      { name: "signup_date",   type: "DATE" },
    ],
  },
  {
    table: "products",
    icon: IconBox,
    columns: [
      { name: "product_id",   type: "SERIAL PK" },
      { name: "product_name", type: "VARCHAR(100)" },
      { name: "category",     type: "VARCHAR(50)" },
      { name: "brand",        type: "VARCHAR(50)" },
    ],
  },
  {
    table: "orders",
    icon: IconShoppingCart,
    columns: [
      { name: "order_id",    type: "SERIAL PK" },
      { name: "customer_id", type: "INT FK" },
      { name: "product_id",  type: "INT FK" },
      { name: "order_date",  type: "DATE" },
      { name: "quantity",    type: "INT" },
      { name: "unit_price",  type: "NUMERIC(10,2)" },
      { name: "discount",    type: "NUMERIC(5,2)" },
    ],
  },
];

/* ── SNIPPET LIBRARY ─────────────────────────────────────────────────── */
const SNIPPETS = [
  {
    label: "All customers",
    sql: "SELECT * FROM customers ORDER BY customer_id;",
  },
  {
    label: "Total revenue",
    sql: "SELECT ROUND(SUM(quantity * unit_price * (1 - discount)), 2) AS total_revenue FROM orders;",
  },
  {
    label: "Revenue per customer",
    sql: `SELECT c.customer_name, c.city,
    ROUND(SUM(o.quantity * o.unit_price * (1 - o.discount)), 2) AS total_revenue,
    COUNT(o.order_id) AS order_count
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.customer_name, c.city
ORDER BY total_revenue DESC;`,
  },
  {
    label: "Running total (M2)",
    sql: `SELECT c.customer_name, o.order_date,
    ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount,
    SUM(ROUND(o.quantity * o.unit_price * (1 - o.discount), 2))
        OVER (PARTITION BY o.customer_id ORDER BY o.order_date
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
ORDER BY c.customer_id, o.order_date;`,
  },
  {
    label: "Customer segments (M6)",
    sql: `WITH base AS (
    SELECT o.customer_id, c.customer_name, c.city,
           ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
    FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id
),
totals AS (
    SELECT customer_id, customer_name, city,
           ROUND(SUM(order_amount), 2) AS total_spending
    FROM base GROUP BY customer_id, customer_name, city
)
SELECT customer_name, city, total_spending,
    NTILE(4) OVER (ORDER BY total_spending DESC) AS quartile,
    CASE NTILE(4) OVER (ORDER BY total_spending DESC)
        WHEN 1 THEN 'Platinum' WHEN 2 THEN 'Gold'
        WHEN 3 THEN 'Silver'   WHEN 4 THEN 'Bronze'
    END AS segment
FROM totals ORDER BY total_spending DESC;`,
  },
];

/* ── Schema Panel ────────────────────────────────────────────────────── */
function SchemaPanel({ onInsertColumn, collapsed, onToggle }) {
  return (
    <div style={{
      width: collapsed ? "0" : "220px",
      minWidth: collapsed ? "0" : "220px",
      overflow: "hidden",
      transition: "width var(--transition-slow), min-width var(--transition-slow)",
      borderRight: collapsed ? "none" : "1px solid var(--color-hairline)",
      backgroundColor: "var(--color-canvas-soft)",
    }}>
      {!collapsed && (
        <div style={{ padding: "var(--space-lg)" }}>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-caption-size)",
            fontWeight: "600",
            letterSpacing: "var(--text-eyebrow-mono-ls)",
            textTransform: "uppercase",
            color: "var(--color-mute)",
            margin: "0 0 var(--space-lg) 0",
          }}>
            Schema
          </p>
          {SCHEMA.map(({ table, icon: TableIcon, columns }) => (
            <div key={table} style={{ marginBottom: "var(--space-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                <TableIcon size={14} />
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: "600",
                  color: "var(--color-ink)",
                }}>
                  {table}
                </span>
              </div>
              {columns.map(({ name, type }) => (
                <div
                  key={name}
                  onClick={() => onInsertColumn(name)}
                  title={`Click to insert: ${name}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-xs) var(--space-sm)",
                    borderRadius: "var(--radius-xs)",
                    cursor: "pointer",
                    transition: "background-color var(--transition-fast)",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,217,146,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-primary-soft)" }}>
                    {name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-mute)" }}>
                    {type}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── History Panel ───────────────────────────────────────────────────── */
function HistoryPanel({ history, clearHistory, onRestore, onClose }) {
  return (
    <div style={{
      position: "absolute",
      top: 0, right: 0,
      width: "340px",
      height: "100%",
      backgroundColor: "var(--color-canvas-soft)",
      borderLeft: "1px solid var(--color-hairline)",
      display: "flex",
      flexDirection: "column",
      zIndex: "var(--z-raised)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-lg)",
        borderBottom: "1px solid var(--color-hairline)",
      }}>
        <span style={{ fontSize: "var(--text-body-sm-size)", fontWeight: "600", color: "var(--color-ink)" }}>
          Query History
        </span>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button onClick={clearHistory} style={ghostBtnStyle}>Clear all</button>
          <button onClick={onClose} style={ghostBtnStyle}>✕</button>
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {history.length === 0 ? (
          <p style={{ padding: "var(--space-xl)", color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)" }}>
            No queries yet
          </p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => { onRestore(item.sql); onClose(); }}
              style={{
                padding: "var(--space-md) var(--space-lg)",
                borderBottom: "1px solid var(--color-hairline)",
                cursor: "pointer",
                transition: "background-color var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,217,146,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
                <span style={{
                  fontSize: "var(--text-caption-size)",
                  color: item.status === "error" ? "var(--color-danger)" : "var(--color-primary)",
                  fontWeight: "600",
                }}>
                  {item.status === "error" ? `✗ Error` : `✓ ${item.rowCount} rows`}
                </span>
                <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
                  {item.durationMs}ms
                </span>
              </div>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--color-body)",
                margin: "0 0 var(--space-xs) 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {item.preview}
              </p>
              <span style={{ fontSize: "10px", color: "var(--color-mute)" }}>
                {new Date(item.executedAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ghostBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--color-mute)",
  fontSize: "var(--text-caption-size)",
  cursor: "pointer",
  padding: "var(--space-xs) var(--space-sm)",
  borderRadius: "var(--radius-xs)",
  fontFamily: "var(--font-sans)",
};

/* ── Main SqlEditor Page ─────────────────────────────────────────────── */
export default function SqlEditor() {
  const {
    sql, setSql,
    status, result, error, durationMs, isRunning,
    executeQuery, clearEditor,
  } = useSqlEditor();

  const { history, clearHistory } = useQueryHistory();
  const textareaRef   = useRef(null);
  const highlightRef  = useRef(null);
  const [schemaCollapsed, setSchemaCollapsed] = useState(false);
  const [historyOpen,     setHistoryOpen]     = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [activeSnippet,   setActiveSnippet]   = useState(null);

  /* Sync highlight layer with textarea scroll */
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop  = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  /* Update highlight layer content */
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.innerHTML = highlightSql(sql) + "\n"; // trailing newline prevents flicker
    }
  }, [sql]);

  /* Ctrl+Enter / Cmd+Enter keyboard shortcut */
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning) executeQuery();
      return;
    }
    // Tab → insert 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const ta    = textareaRef.current;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const next  = sql.slice(0, start) + "  " + sql.slice(end);
      setSql(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [isRunning, executeQuery, sql, setSql]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sql]);

  const insertColumn = useCallback((colName) => {
    const ta    = textareaRef.current;
    const start = ta?.selectionStart ?? sql.length;
    const next  = sql.slice(0, start) + colName + sql.slice(start);
    setSql(next);
    requestAnimationFrame(() => {
      if (ta) { ta.selectionStart = ta.selectionEnd = start + colName.length; ta.focus(); }
    });
  }, [sql, setSql]);

  const charCount = sql.length;
  const lineCount = sql.split("\n").length;

  const sharedEditorFont = {
    fontFamily: "var(--font-mono)",
    fontSize:   "var(--text-code-size)",
    lineHeight: "var(--text-code-lh)",
    tabSize:    2,
    padding:    "var(--space-xl)",
  };

  return (
    <div style={{
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "var(--space-5xl) var(--page-gutter)",
    }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <p className="text-eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
        SQL Editor
      </p>
      <h1 style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-display-lg-size)",
        fontWeight: "var(--text-display-lg-weight)",
        lineHeight: "var(--text-display-lg-lh)",
        letterSpacing: "var(--text-display-lg-ls)",
        color: "var(--color-ink-strong)",
        margin: "0 0 var(--space-sm) 0",
      }}>
        Query Explorer
      </h1>
      <p style={{ color: "var(--color-body)", fontSize: "var(--text-body-lg-size)", marginBottom: "var(--space-3xl)" }}>
        Write and execute PostgreSQL queries against the live Customer Purchase Analytics database.
        Only <code>SELECT</code>, <code>EXPLAIN</code>, and <code>WITH</code> (CTEs) are permitted.
      </p>

      {/* ── Snippet Bar ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginBottom: "var(--space-xl)" }}>
        {SNIPPETS.map((s, i) => (
          <button
            key={i}
            onClick={() => { setSql(s.sql); setActiveSnippet(i); }}
            style={{
              padding: "var(--space-xs) var(--space-md)",
              backgroundColor: activeSnippet === i ? "rgba(0,217,146,0.10)" : "var(--color-canvas)",
              color: activeSnippet === i ? "var(--color-primary)" : "var(--color-body)",
              border: `1px solid ${activeSnippet === i ? "rgba(0,217,146,0.3)" : "var(--color-hairline)"}`,
              borderRadius: "var(--radius-pill)",
              fontSize: "var(--text-body-sm-size)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Main Editor Card ─────────────────────────────────────────── */}
      <div style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        marginBottom: "var(--space-xl)",
        position: "relative",
      }}>
        <div style={{ display: "flex" }}>
          {/* Schema sidebar */}
          <SchemaPanel
            collapsed={schemaCollapsed}
            onToggle={() => setSchemaCollapsed((v) => !v)}
            onInsertColumn={insertColumn}
          />

          {/* Editor area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Editor inner — highlight layer + textarea stacked */}
            <div style={{ position: "relative", minHeight: "240px" }}>
              {/* Highlight layer (behind) */}
              <div
                ref={highlightRef}
                aria-hidden="true"
                style={{
                  ...sharedEditorFont,
                  position:   "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak:  "break-word",
                  color:      "var(--color-ink)",
                  overflow:   "hidden",
                  pointerEvents: "none",
                  borderBottom: "1px solid var(--color-hairline)",
                  backgroundColor: "var(--color-canvas)",
                }}
              />
              {/* Actual textarea (transparent — floats on top) */}
              <textarea
                ref={textareaRef}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={syncScroll}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                aria-label="SQL query editor"
                aria-describedby="editor-hint"
                style={{
                  ...sharedEditorFont,
                  position:        "relative",
                  width:           "100%",
                  minHeight:       "240px",
                  resize:          "vertical",
                  border:          "none",
                  outline:         "none",
                  backgroundColor: "transparent",
                  color:           "transparent",
                  caretColor:      "var(--color-primary)",
                  zIndex:          1,
                  display:         "block",
                  borderBottom:    "1px solid var(--color-hairline)",
                }}
              />
            </div>

            {/* Editor footer */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-sm) var(--space-lg)",
              backgroundColor: "var(--color-canvas-soft)",
              borderBottom: "1px solid var(--color-hairline)",
            }}>
              <span id="editor-hint" style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
                {lineCount} {lineCount === 1 ? "line" : "lines"} · {charCount} chars ·{" "}
                <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>Ctrl+Enter</kbd> to run
              </span>
              <button
                onClick={() => setSchemaCollapsed((v) => !v)}
                style={{
                  ...ghostBtnStyle,
                  color: "var(--color-primary-soft)",
                  fontSize: "11px",
                }}
              >
                {schemaCollapsed ? "Show schema →" : "← Hide schema"}
              </button>
            </div>

            {/* Toolbar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-md) var(--space-lg)",
              backgroundColor: "var(--color-canvas-soft)",
            }}>
              {/* Run button — button-primary per DESIGN-voltagent.md */}
              <button
                onClick={() => executeQuery()}
                disabled={isRunning || !sql.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-md) var(--space-lg)",
                  backgroundColor: isRunning ? "var(--color-canvas-soft)" : "var(--color-primary)",
                  color: isRunning ? "var(--color-mute)" : "var(--color-on-primary)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-button-md-size)",
                  fontWeight: "var(--text-button-md-weight)",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  transition: "all var(--transition-fast)",
                  opacity: (!sql.trim()) ? 0.5 : 1,
                }}
              >
                {isRunning ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                      style={{ animation: "spin 0.75s linear infinite" }}>
                      <circle cx="12" cy="12" r="9" stroke="var(--color-mute)" strokeWidth="2" />
                      <path d="M12 3 A9 9 0 0 1 21 12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Running…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Run Query
                  </>
                )}
              </button>

              {/* Clear button — button-outline-on-dark */}
              <button
                onClick={() => { clearEditor(); setActiveSnippet(null); }}
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  backgroundColor: "var(--color-canvas)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-button-md-size)",
                  fontWeight: "var(--text-button-md-weight)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Clear
              </button>

              {/* Copy button — ghost icon */}
              <button
                onClick={handleCopy}
                title="Copy SQL to clipboard"
                aria-label="Copy SQL to clipboard"
                style={{
                  padding: "var(--space-md)",
                  backgroundColor: "transparent",
                  color: copied ? "var(--color-primary)" : "var(--color-mute)",
                  border: "1px solid transparent",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--text-body-sm-size)",
                  fontFamily: "var(--font-sans)",
                  transition: "all var(--transition-fast)",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>

              {/* History toggle */}
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={historyOpen}
                style={{
                  marginLeft: "auto",
                  padding: "var(--space-sm) var(--space-md)",
                  backgroundColor: historyOpen ? "rgba(0,217,146,0.08)" : "transparent",
                  color: historyOpen ? "var(--color-primary)" : "var(--color-mute)",
                  border: `1px solid ${historyOpen ? "rgba(0,217,146,0.25)" : "transparent"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--text-body-sm-size)",
                  fontFamily: "var(--font-sans)",
                  transition: "all var(--transition-fast)",
                }}
              >
                History {history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* History panel overlay */}
        {historyOpen && (
          <HistoryPanel
            history={history}
            clearHistory={clearHistory}
            onRestore={(restoredSql) => setSql(restoredSql)}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>

      {/* ── Results Area ────────────────────────────────────────────── */}
      {isRunning ? (
        <LoadingSpinner message="Executing query…" />
      ) : (
        <ResultsTable result={result} error={error} status={status} durationMs={durationMs} />
      )}

      {/* Spin keyframe for run button */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
```

---

### Step 9 — Register Route in App.jsx and Navbar

Claude Cowork: Make these two targeted changes:

**In `App.jsx`** — add the import and route:

```jsx
// Add import:
import SqlEditor from "./pages/SqlEditor";

// Add route inside <Routes>:
<Route path="/sql-editor" element={<SqlEditor />} />
```

**In `Navbar.jsx`** — add the nav item to the `navItems` array:

```jsx
// Add to navItems array (add a new import at the top too):
import { ..., IconBarChart } from "./Icons"; // IconBarChart may already be imported

// In navItems array, add:
{ path: "/sql-editor", label: "SQL Editor", Icon: IconBarChart },
```

---

## 4. User Interface Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚡ Analytics  [Live]  Dashboard  Customers  Products  Orders       │
│                       Analytics  [SQL Editor ←active]              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  SQL EDITOR                           ← eyebrow-mono uppercase     │
│  Query Explorer                       ← display-lg 36px/400        │
│  Write and execute PostgreSQL…        ← body-lg body copy          │
│                                                                    │
│  [All customers] [Total revenue] [Revenue per customer]  ← pills   │
│  [Running total] [Customer segments]                               │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │  SCHEMA          │  -- Comment text (muted)                  │   │
│ │  ──────────      │  SELECT                                   │   │
│ │  customers       │      c.customer_name,                     │   │
│ │   customer_id PK │      ROUND(...) AS order_amount,         │   │
│ │   customer_name  │      ROW_NUMBER() OVER (              │   │
│ │   city           │          PARTITION BY c.customer_id   │   │
│ │   signup_date    │          ORDER BY o.order_date         │   │
│ │  products        │      ) AS purchase_sequence            │   │
│ │   product_id PK  │  FROM orders o                            │   │
│ │   product_name   │  INNER JOIN customers c ...               │   │
│ │   category       ├───────────────────────────────────────────│   │
│ │   brand          │  6 lines · 284 chars · Ctrl+Enter to run  │   │
│ │  orders          │                          [← Hide schema]  │   │
│ │   order_id PK    ├───────────────────────────────────────────│   │
│ │   customer_id FK │  [▶ Run Query] [Clear] [Copy]  [History▾] │   │
│ └──────────────────┴───────────────────────────────────────────┘   │
│                                                                    │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │  7 rows          Executed in 142ms                          │   │
│ │ ─────────────────────────────────────────────────────────── │   │
│ │  # │ CUSTOMER NAME  │ CITY    │ ORDER DATE │ ORDER AMOUNT    │   │
│ │ ───┼────────────────┼─────────┼────────────┼──────────────── │   │
│ │  1 │ Aanya Sharma   │ Mumbai  │ 2024-01-05 │       14200.00  │   │
│ │  2 │ Aanya Sharma   │ Mumbai  │ 2024-01-18 │       28900.00  │   │
│ │  … │ …              │ …       │ …          │             …   │   │
│ └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. Testing and Validation

### 5.1 Backend Unit Tests (manual — run in terminal)

Claude Cowork: After implementing the backend, run these verification commands from the backend directory with the venv activated:

```python
# Test 1: Valid SELECT passes guard
from app.utils.sql_guard import validate
assert validate("SELECT * FROM customers")[0] == True

# Test 2: DELETE is blocked
assert validate("DELETE FROM orders")[0] == False
assert validate("DELETE FROM orders")[1] == "OPERATION_BLOCKED"

# Test 3: INSERT blocked
assert validate("INSERT INTO customers VALUES (1)")[0] == False

# Test 4: Multiple statements blocked
assert validate("SELECT 1; SELECT 2")[0] == False

# Test 5: CTE (WITH) passes
assert validate("WITH c AS (SELECT 1) SELECT * FROM c")[0] == True

# Test 6: EXPLAIN passes
assert validate("EXPLAIN SELECT * FROM orders")[0] == False  # "EXPLAIN" IS permitted
# Correction: EXPLAIN is in PERMITTED_STARTERS
assert validate("EXPLAIN SELECT * FROM customers")[0] == True

# Test 7: Empty query blocked
assert validate("")[0] == False
assert validate("   ")[0] == False

# Test 8: Comment bypass attempt blocked
assert validate("-- comment\nDELETE FROM orders")[0] == False

print("All sql_guard tests passed")
```

### 5.2 API Endpoint Tests (curl)

```powershell
# Test A: Valid SELECT
curl.exe -s -X POST http://localhost:8000/api/sql/execute `
  -H "Content-Type: application/json" `
  -d "{\"sql\": \"SELECT * FROM customers ORDER BY customer_id\"}" | python -c "import sys,json; d=json.load(sys.stdin); print('rows:', d['row_count'], 'status:', d['status'])"
# Expected: rows: 7 status: success

# Test B: Blocked DELETE
curl.exe -s -X POST http://localhost:8000/api/sql/execute `
  -H "Content-Type: application/json" `
  -d "{\"sql\": \"DELETE FROM orders\"}" | python -c "import sys,json; d=json.load(sys.stdin); print('status:', d['status'], 'code:', d['error_code'])"
# Expected: status: error code: OPERATION_BLOCKED

# Test C: Syntax error returns 200 with error payload (NOT a 500)
curl.exe -s -X POST http://localhost:8000/api/sql/execute `
  -H "Content-Type: application/json" `
  -d "{\"sql\": \"SELECT foo FROM bar\"}" | python -c "import sys,json; d=json.load(sys.stdin); print('status:', d['status'], 'pgcode:', d.get('error_code'))"
# Expected: status: error pgcode: 42P01

# Test D: Window function query
curl.exe -s -X POST http://localhost:8000/api/sql/execute `
  -H "Content-Type: application/json" `
  -d "{\"sql\": \"SELECT customer_id, SUM(quantity * unit_price) OVER (PARTITION BY customer_id) AS total FROM orders\"}" | python -c "import sys,json; d=json.load(sys.stdin); print('rows:', d['row_count'])"
# Expected: rows: 35

# Test E: Revenue total matches audit (555627.50)
curl.exe -s -X POST http://localhost:8000/api/sql/execute `
  -H "Content-Type: application/json" `
  -d "{\"sql\": \"SELECT ROUND(SUM(quantity * unit_price * (1 - discount)), 2) AS total FROM orders\"}" | python -c "import sys,json; d=json.load(sys.stdin); print('total:', d['rows'][0]['total'])"
# Expected: total: 555627.5
```

### 5.3 Frontend Validation Checklist

| # | Test | Expected |
|---|------|---------|
| 1 | Page loads at `/sql-editor` | No errors, editor visible with default query |
| 2 | Schema panel shows 3 tables | customers, products, orders with columns |
| 3 | Click column name in schema | Column name inserted at cursor |
| 4 | Click snippet button | SQL loads into editor, button highlights active state |
| 5 | Ctrl+Enter runs query | Same as clicking Run Query |
| 6 | Tab key in editor | Inserts 2 spaces, does not jump to next element |
| 7 | Run Query with valid SELECT | Results table appears, row count correct |
| 8 | Run Query with invalid SQL | Error panel appears with error_code and hint |
| 9 | Run Query with DELETE | Error panel: "OPERATION_BLOCKED" |
| 10 | History button | History panel opens, last query listed |
| 11 | Click history item | SQL restored into editor, panel closes |
| 12 | Clear All history | History empties, localStorage cleared |
| 13 | Copy button | Clipboard contains current SQL |
| 14 | Clear button | Editor cleared, results cleared |
| 15 | Pagination (>50 rows) | Previous/Next controls appear |
| 16 | NULL values render as `NULL` | Muted italic label |
| 17 | Numeric columns right-aligned | Monospace tabular numbers |
| 18 | Execution time displayed | "Executed in Xms" in results header |
| 19 | Syntax highlighting | Keywords in green, strings in amber, comments muted |
| 20 | Mobile viewport 375px | Editor scrolls horizontally, no overflow |

### 5.4 Edge Case Matrix

| Edge Case | Behaviour |
|-----------|-----------|
| Empty textarea + Run | Run button disabled (opacity 0.5); nothing happens |
| Query timeout (>10s) | PostgreSQL cancels; error panel shows pgcode `57014` with LIMIT hint |
| Result > 500 rows | Truncated at 500; amber "Truncated at 500" pill shown |
| `EXPLAIN ANALYZE` query | Results as text rows in table |
| CTE with NTILE in GROUP BY | PostgreSQL error `42P20`; hint shows CTE pattern fix |
| `ROUND(PERCENT_RANK()::...)` — missing cast | Error `42883`; hint explains `::NUMERIC` cast |
| Network down (backend not running) | Error panel: "NETWORK_ERROR" + "Ensure FastAPI is running on port 8000" |
| Very long query (>10000 chars) | Editor scrolls; highlight layer syncs; no performance issue |
| Special characters in results (₹, Unicode) | Displayed as-is (psycopg2 returns UTF-8) |
| SQL injection attempt via SELECT | Allowed — read-only SQL is safe by design |

---

## 6. Dependencies

### 6.1 New npm Packages Required

**None.** This phase deliberately avoids adding npm dependencies:
- Syntax highlighting: custom `sqlHighlight.js` utility (built in Step 6)
- Code editor: native `<textarea>` with highlight overlay technique
- All UI uses existing CSS variables and inline styles from previous phases

### 6.2 New Python Packages Required

**None.** All Python dependencies are already installed from Phase 12:
- `psycopg2-binary` — direct PostgreSQL connection (used in `sql_editor.py`)
- `fastapi` — router registration
- `pydantic` — `SqlExecuteRequest`, `SqlExecuteResponse` schemas

---

## 7. Handoff Checklist

### New Files Created in Phase 14.75

| File | Status |
|------|--------|
| `backend/app/utils/__init__.py` | ☐ Create (empty) |
| `backend/app/utils/sql_guard.py` | ☐ Create (Step 1) |
| `backend/app/routers/sql_editor.py` | ☐ Create (Step 2) |
| `frontend/src/hooks/useSqlEditor.js` | ☐ Create (Step 4) |
| `frontend/src/hooks/useQueryHistory.js` | ☐ Create (Step 5) |
| `frontend/src/utils/sqlHighlight.js` | ☐ Create (Step 6) |
| `frontend/src/components/ResultsTable.jsx` | ☐ Create (Step 7) |
| `frontend/src/pages/SqlEditor.jsx` | ☐ Create (Step 8) |

### Existing Files Modified in Phase 14.75

| File | Change |
|------|--------|
| `backend/app/main.py` | ☐ Add `sql_editor` router import + `include_router` (Step 3) |
| `backend/app/models/schemas.py` | ☐ Add `SqlExecuteRequest`, `SqlExecuteResponse` (Step 2 — Pydantic schema section) |
| `frontend/src/App.jsx` | ☐ Add `SqlEditor` import + `/sql-editor` route (Step 9) |
| `frontend/src/components/Navbar.jsx` | ☐ Add SQL Editor nav item with `IconBarChart` (Step 9) |

### Verification Outputs

| Verification | Expected |
|-------------|---------|
| `GET /docs` shows `/api/sql/execute` | ☐ POST endpoint visible in Swagger UI |
| `validate("DELETE FROM orders")` returns `False` | ☐ sql_guard unit test passes |
| Valid SELECT returns 7 rows for `SELECT * FROM customers` | ☐ API test passes |
| Revenue total via API = 555627.50 | ☐ Matches Phase 10 Audit 3 |
| `/sql-editor` page loads in browser | ☐ No console errors |
| All 20 frontend checks pass | ☐ Manual test matrix complete |

---

## 8. Phase 14.75 Final Sign-off

Claude Cowork must output this message when all checklist items pass:

```
╔══════════════════════════════════════════════════════════════════╗
║         PHASE 14.75 — IN-APP SQL EDITOR — COMPLETE               ║
╚══════════════════════════════════════════════════════════════════╝

✅ backend/app/utils/sql_guard.py      — SQL validation (SELECT/EXPLAIN/WITH only)
✅ backend/app/routers/sql_editor.py   — POST /api/sql/execute (psycopg2, 500-row cap, 10s timeout)
✅ backend/app/main.py                 — sql_editor router registered
✅ backend/app/models/schemas.py       — SqlExecuteRequest, SqlExecuteResponse added
✅ frontend/src/hooks/useSqlEditor.js  — query execution state management
✅ frontend/src/hooks/useQueryHistory.js — localStorage-backed 20-item history
✅ frontend/src/utils/sqlHighlight.js  — keyword/string/comment highlighting (no new npm)
✅ frontend/src/components/ResultsTable.jsx — 4-state results display
✅ frontend/src/pages/SqlEditor.jsx    — full editor page (schema panel, snippets, toolbar)
✅ frontend/src/App.jsx                — /sql-editor route added
✅ frontend/src/components/Navbar.jsx  — SQL Editor nav item added

API TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SELECT * FROM customers     → 7 rows    ✓
  DELETE blocked              → 403 body  ✓
  Revenue = 555627.50         → matches   ✓

SECURITY MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Permitted:  SELECT, EXPLAIN, WITH (CTE)
  Blocked:    INSERT, UPDATE, DELETE, DROP, TRUNCATE, CREATE, ALTER
  Timeout:    10 seconds via PostgreSQL statement_timeout
  Row cap:    500 rows (truncation flagged in response)
  History:    localStorage — no server-side persistence

Ready to proceed to Phase 15 (Final Integration Testing, Git Init).
```

---

*Phase 14.75 of 15 — In-App SQL Editor*
*Inserted between Phase 14 (Req #43 Mega Report) and Phase 15 (Final Integration Testing)*
*Customer Purchase Analytics Full-Stack Integration · Saikalyan G · Incedo Inc.*
