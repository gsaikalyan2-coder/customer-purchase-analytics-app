"""
claude_client.py — Anthropic Claude API wrapper for AI query suggestions.

Model: claude-haiku-4-5
  - Fast, cost-efficient for short SQL generation prompts
  - Max 1000 output tokens (sufficient for ~50 lines of SQL with comments)

The system prompt is built server-side so it never reaches the frontend.
It injects the full schema, window function rules, and output constraints.
"""

import anthropic
from app.config import ANTHROPIC_API_KEY, APP_ENV

# ── Static system prompt components ───────────────────────────────────────────

_IDENTITY = """You are a PostgreSQL query assistant for a Customer Purchase Analytics application.
Your job is to generate a single, complete, well-commented SQL query that answers the user's intent.
Return ONLY the SQL query — no prose, no explanation outside the query, no markdown code fences."""

_SCHEMA = """
DATABASE SCHEMA (Supabase PostgreSQL 17.6):

TABLE: customers
  customer_id   SERIAL PRIMARY KEY
  customer_name VARCHAR(100)
  city          VARCHAR(50)   -- Values: Mumbai, Delhi, Bangalore, Chennai
  signup_date   DATE
  Total rows: 7 customers

TABLE: products
  product_id   SERIAL PRIMARY KEY
  product_name VARCHAR(100)
  category     VARCHAR(50)   -- Values: Electronics, Apparel, Appliances
  brand        VARCHAR(50)
  Total rows: 8 products

TABLE: orders
  order_id    SERIAL PRIMARY KEY
  customer_id INT REFERENCES customers(customer_id)
  product_id  INT REFERENCES products(product_id)
  order_date  DATE           -- Range: Jan 2024 – Jun 2024
  quantity    INT
  unit_price  NUMERIC(10,2)
  discount    NUMERIC(5,2)   -- Decimal between 0 and 1 (e.g. 0.10 = 10% off)
  Total rows: 35 orders

CRITICAL RULE — order_amount is NEVER a stored column. Always calculate it as:
  ROUND(quantity * unit_price * (1 - discount), 2)"""

_WINDOW_RULES = """
WINDOW FUNCTION RULES (must be followed exactly):
1. LAST_VALUE and FIRST_VALUE always need: ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
2. Use DENSE_RANK (not RANK) when you need to filter by rank — avoids gaps at ties
3. NEVER place window functions in WHERE, HAVING, or GROUP BY — wrap in a CTE first
4. PERCENT_RANK() and CUME_DIST() need ::NUMERIC cast before ROUND(): ROUND(PERCENT_RANK() OVER (...)::NUMERIC, 4)
5. Always use NULLIF(denominator, 0) for any division to prevent divide-by-zero errors
6. For NTILE(4) customer segmentation: always pre-aggregate to customer_totals CTE first
   (7 customer rows, not 35 order rows) before applying NTILE
7. LAG/LEAD on first/last rows per partition correctly return NULL — this is expected"""

_OUTPUT_FORMAT = """
OUTPUT FORMAT RULES:
- Begin with a 2–3 line SQL comment block (--) summarising what the query does
- Add brief -- inline comments on complex window function clauses
- Use 4-space indentation consistently
- Always include ORDER BY for deterministic output
- Maximum ~50 lines total
- If the intent is ambiguous, add a "-- Note: [assumption]" at the very top
- Do NOT wrap the SQL in markdown fences or backticks
- Do NOT write any prose after the final SQL line"""

SYSTEM_PROMPT = "\n\n".join([_IDENTITY, _SCHEMA, _WINDOW_RULES, _OUTPUT_FORMAT])


# ── Main suggestion function ───────────────────────────────────────────────────

def suggest_query(intent: str) -> dict:
    """
    Call the Claude API to generate a SQL query from a natural-language intent.

    Args:
        intent: Natural-language description, e.g. "show running totals per customer"

    Returns:
        dict with keys: sql, model, input_tokens, output_tokens, debug (if dev mode)

    Raises:
        ValueError: if ANTHROPIC_API_KEY is not configured
        anthropic.APIError: if the Claude API returns an error
    """
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "ENTER_YOUR_VALUE_HERE":
        raise ValueError("ANTHROPIC_API_KEY is not configured.")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": intent.strip()}
        ],
    )

    sql_text = message.content[0].text.strip()

    result = {
        "sql": sql_text,
        "model": message.model,
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
    }

    # Include prompt in debug mode only
    if APP_ENV == "development":
        result["debug"] = {"prompt": SYSTEM_PROMPT}

    return result
