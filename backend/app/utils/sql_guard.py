"""
sql_guard.py — SQL statement validation for the in-app SQL editor.

Rules (derived from Phase 14.75 functional requirements):
  - Only SELECT, EXPLAIN, and WITH (leading a CTE) are permitted.
  - Multiple statements (semicolons mid-query) are blocked.
  - Dangerous DDL/DML keywords are rejected regardless of position.
  - Comments are stripped before analysis to prevent bypass attempts.

This module never raises — it returns a (is_valid: bool, error_code: str, reason: str) tuple.
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
