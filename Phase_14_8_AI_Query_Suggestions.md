# Phase 14.8 — AI Query Suggestions
## Claude-Powered In-Editor SQL Assistant
**Inserted between:** Phase 14.75 (SQL Editor) → Phase 14.8 (AI Suggestions) → Phase 14.9 (Time Series)**
**Project:** Customer Purchase Analytics — Full-Stack Integration**
**Author:** Saikalyan G | Incedo Inc. Internship Task 2**
**Design System:** DESIGN-voltagent.md (dark canvas `#101010`, electric-green `#00d992`)**
**Stack:** FastAPI + React 18 + Anthropic Claude API (`claude-haiku-4-5`)**
**Target Directory:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`**

---

## ⚠️ Claude Cowork Execution Rules

1. Read this document fully before writing any code
2. This phase adds new files only — Phase 14.75 SQL Editor files must remain intact
3. All CSS uses `var(--token-name)` from `index.css` — no hardcoded hex values
4. The Anthropic API key goes in `backend/.env` under `ANTHROPIC_API_KEY` — Saikalyan will fill it in manually; leave the placeholder
5. Model used: `claude-haiku-4-5` — fast and cost-efficient for short suggestion prompts
6. The AI suggestion feature is purely additive — it never modifies the SQL Editor's execution logic
7. Execute sub-tasks sequentially; confirm each with Saikalyan before moving to the next

---

## 0. Phase Overview

### Purpose

Phase 14.8 adds an **AI-powered query suggestion assistant** directly inside the SQL Editor built in Phase 14.75. A user clicks "Suggest a Query" in the toolbar — or types a natural-language intent like "show me running totals per customer" — and the Claude API (`claude-haiku-4-5`) returns a ready-to-run PostgreSQL window function query, complete with comments, tailored to the live schema.

This transforms the SQL Editor from a blank-slate tool into an interactive learning companion for the window function patterns built in Phases 1–10 of the capstone.

### Position in the phase sequence

```
Phase 14.75  — SQL Editor (textarea, execution, results, history)
     │
     ▼
Phase 14.8   — AI Query Suggestions (Claude API, intent → SQL, insert into editor)
     │
     ▼
Phase 14.9   — Time Series Chart Layer (Recharts, M7 moving averages)
     │
     ▼
Phase 15     — Final Integration Testing, Git Init, Wrap-up
```

### What gets built

| Deliverable | Location |
|-------------|---------|
| `POST /api/ai/suggest` FastAPI endpoint | `backend/app/routers/ai_suggest.py` |
| Claude API helper utility | `backend/app/utils/claude_client.py` |
| `ANTHROPIC_API_KEY` placeholder in `.env` | `backend/.env` (Saikalyan fills in) |
| `useAiSuggestion.js` React hook | `frontend/src/hooks/useAiSuggestion.js` |
| `AiSuggestionPanel.jsx` component | `frontend/src/components/AiSuggestionPanel.jsx` |
| Intent input integrated into `SqlEditor.jsx` | Modify existing page |
| "Suggest a Query" button in `SqlEditorToolbar` | Modify existing toolbar area |

---

## 1. Functional Requirements

### 1.1 Entry Points — Two Ways to Get a Suggestion

**Entry Point A — Intent Input Bar**
- A single-line text input sits above the SQL editor, labelled "Describe what you want to query…"
- Placeholder: `e.g. "show running totals per customer" or "rank customers by city spend"`
- User types a natural-language description and presses `Enter` or clicks the "✦ Suggest" button
- On suggestion return, the generated SQL is inserted into the editor (replacing existing content, with a one-click undo)

**Entry Point B — Quick Prompt Chips**
- Six pre-written intent chips displayed as pill-tag buttons below the intent input
- Clicking a chip immediately fires a suggestion request with that fixed intent
- Chip labels (short, action-oriented):
  1. `Running totals`
  2. `Customer ranking`
  3. `Category breakdown`
  4. `Segment by spend`
  5. `Moving averages`
  6. `Top products`

### 1.2 AI Suggestion Response

The returned suggestion must include:
- A complete, executable PostgreSQL query (SELECT / WITH CTE)
- Inline `--` comments explaining each section (CTEs, window function clauses, JOIN logic)
- Uses only the three live tables: `customers`, `products`, `orders`
- `order_amount` always calculated as `ROUND(quantity * unit_price * (1 - discount), 2)` — never as a stored column
- Maximum ~50 lines — concise but complete
- If the intent is ambiguous, the suggestion includes a `-- Note:` comment at the top explaining assumptions made

### 1.3 Insert Behaviour

- When a suggestion arrives, a **preview panel** slides in below the intent bar showing the suggested SQL with syntax highlighting
- Two action buttons in the preview panel:
  - **"Use this query"** (primary green button) — replaces the editor content and closes the panel
  - **"Discard"** (outline button) — closes the panel, editor unchanged
- If the editor already has content when "Use this query" is clicked, the previous content is saved to query history before being replaced (uses the existing `useQueryHistory` hook)

### 1.4 Loading and Error States

- While the API call is in-flight: intent input and chip buttons are disabled; a subtle pulsing "Generating…" label replaces the "Suggest" button text
- If the Anthropic API key is not set: the Suggest button is replaced by a grey disabled button labelled "AI disabled" with a tooltip "Set ANTHROPIC_API_KEY in backend/.env"
- If the Claude API call fails: an inline error message appears below the intent bar in `var(--color-danger)` red
- Rate-limit errors from Anthropic: display "Too many requests — try again in a moment"

### 1.5 Prompt Transparency (Developer Mode)

- In development (`APP_ENV=development`), the API response includes a `debug.prompt` field showing the exact system prompt sent to Claude
- This is stripped from production responses

---

## 2. Technical Architecture

### 2.1 Data Flow

```
Browser (React)
    │
    │  User types intent or clicks chip
    │
    ▼
useAiSuggestion.js hook
    │  POST /api/ai/suggest
    │  { "intent": "show running totals per customer" }
    │
    ▼
FastAPI — ai_suggest.py router
    │
    ├── 1. Validate: intent not empty, not > 500 chars
    ├── 2. Build system prompt (schema + rules injected)
    ├── 3. Call claude_client.suggest(intent, system_prompt)
    │         └── anthropic.messages.create(
    │               model="claude-haiku-4-5",
    │               max_tokens=1000,
    │               messages=[{role:"user", content: intent}],
    │               system=system_prompt
    │             )
    ├── 4. Extract .content[0].text → the SQL string
    └── 5. Return JSON response

Browser renders AiSuggestionPanel.jsx with the SQL
User clicks "Use this query" → SQL inserted into editor textarea
```

### 2.2 System Prompt Architecture

The system prompt is the key to quality. It is constructed server-side in `claude_client.py` so it never travels to the frontend and cannot be inspected or spoofed.

The system prompt covers four sections:

**Section 1 — Identity and task**
```
You are a PostgreSQL query assistant for a Customer Purchase Analytics application.
Your job is to generate a single, complete, well-commented SQL query that answers
the user's intent. Return ONLY the SQL query — no prose, no explanation outside
the query, no markdown code fences.
```

**Section 2 — Schema specification (injected verbatim)**
```
DATABASE SCHEMA (Supabase PostgreSQL 17.6):

customers (customer_id SERIAL PK, customer_name VARCHAR(100), city VARCHAR(50), signup_date DATE)
  Rows: 7 | Cities: Mumbai, Delhi, Bangalore, Chennai

products (product_id SERIAL PK, product_name VARCHAR(100), category VARCHAR(50), brand VARCHAR(50))
  Rows: 8 | Categories: Electronics, Apparel, Appliances

orders (order_id SERIAL PK, customer_id INT FK→customers, product_id INT FK→products,
        order_date DATE, quantity INT, unit_price NUMERIC(10,2), discount NUMERIC(5,2))
  Rows: 35 | Date range: Jan–Jun 2024
  CRITICAL: order_amount is NEVER stored. Always calculate as:
    ROUND(quantity * unit_price * (1 - discount), 2)
```

**Section 3 — Window function rules (domain knowledge)**
```
WINDOW FUNCTION RULES:
- Always use ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING for FIRST_VALUE/LAST_VALUE
- Use DENSE_RANK (not RANK) when filtering on rank to avoid gaps
- Wrap window functions in a CTE before filtering — never in WHERE/HAVING
- Use ::NUMERIC cast before ROUND() on PERCENT_RANK() and CUME_DIST()
- Use NULLIF(denominator, 0) for all division to prevent divide-by-zero
- For NTILE(4) segmentation: always aggregate to customer level first (customer_totals CTE)
  then apply NTILE, to avoid applying quartiles to 35 order rows instead of 7 customers
```

**Section 4 — Output format rules**
```
OUTPUT RULES:
- Start with a brief -- Comment block explaining what the query does (2–3 lines max)
- Add inline -- comments on complex window function clauses
- Use consistent 4-space indentation
- Always include ORDER BY to produce deterministic results
- Limit output to ~50 lines
- If the intent is ambiguous, add a -- Note: assumption comment at the top
- Do NOT wrap the SQL in markdown code fences or backticks
- Do NOT add prose after the SQL
```

### 2.3 API Contract

#### `POST /api/ai/suggest`

**Request:**
```json
{
  "intent": "show me running totals per customer by date"
}
```

**Response — Success (200):**
```json
{
  "status": "success",
  "sql": "-- Running totals per customer (M2 module)\n-- Shows cumulative spend as each order is placed\nSELECT\n    c.customer_name,\n    ...",
  "model": "claude-haiku-4-5",
  "input_tokens": 412,
  "output_tokens": 298,
  "debug": {
    "prompt": "..." // only present if APP_ENV=development
  }
}
```

**Response — API Key Missing (503):**
```json
{
  "status": "error",
  "error_code": "AI_DISABLED",
  "error_message": "ANTHROPIC_API_KEY is not configured.",
  "hint": "Set ANTHROPIC_API_KEY in backend/.env and restart the server."
}
```

**Response — Anthropic API Error (502):**
```json
{
  "status": "error",
  "error_code": "UPSTREAM_ERROR",
  "error_message": "Claude API returned an error.",
  "hint": "Check the backend logs for details."
}
```

### 2.4 Pydantic Schemas (add to `backend/app/models/schemas.py`)

```python
# Add these classes to the existing schemas.py — do not remove any existing classes

class AiSuggestRequest(BaseModel):
    intent: str

    class Config:
        json_schema_extra = {
            "example": {"intent": "show running totals per customer by order date"}
        }

class AiSuggestDebug(BaseModel):
    prompt: Optional[str] = None

class AiSuggestResponse(BaseModel):
    status: str                          # "success" | "error"
    sql: Optional[str] = None
    model: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    debug: Optional[AiSuggestDebug] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    hint: Optional[str] = None
```

---

## 3. Implementation Steps

### Step 1 — Add `ANTHROPIC_API_KEY` to `.env`

Claude Cowork: Open `backend/.env` and add this line at the bottom. Leave the placeholder — Saikalyan fills it in manually.

```env
# Anthropic Claude API — for Phase 14.8 AI Query Suggestions
# Get your key at: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=ENTER_YOUR_VALUE_HERE
```

Also add to `backend/.env.example`:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Also add to `backend/app/config.py` (after the existing variables):
```python
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
APP_ENV: str = os.getenv("APP_ENV", "development")
```

### Step 2 — Install `anthropic` Python SDK

```powershell
# From backend/ with .venv activated
pip install anthropic
pip freeze > requirements.txt
```

Confirm `requirements.txt` now contains `anthropic==x.x.x`.

### Step 3 — Claude Client Utility

**File to create:** `backend/app/utils/claude_client.py`

```python
"""
claude_client.py — Anthropic Claude API wrapper for AI query suggestions.

Model: claude-haiku-4-5
  - Fast, cost-efficient for short SQL generation prompts
  - Max 1000 output tokens (sufficient for ~50 lines of SQL with comments)
  - Confirmed available model ID as of June 2026

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
        dict with keys: sql, model, input_tokens, output_tokens, prompt (if dev mode)

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
```

### Step 4 — AI Suggest Router

**File to create:** `backend/app/routers/ai_suggest.py`

```python
"""
ai_suggest.py — FastAPI router for AI-powered SQL query suggestions.

Endpoint: POST /api/ai/suggest
  - Accepts a natural-language intent string
  - Calls Claude API (claude-haiku-4-5) via claude_client.suggest_query()
  - Returns a ready-to-run SQL query with inline comments
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import AiSuggestRequest, AiSuggestResponse, AiSuggestDebug
from app.utils.claude_client import suggest_query
import anthropic

router = APIRouter(prefix="/api/ai", tags=["AI Suggestions"])

_MAX_INTENT_LENGTH = 500


@router.post("/suggest", response_model=AiSuggestResponse)
def suggest_sql(request: AiSuggestRequest) -> AiSuggestResponse:
    """
    Generate a SQL query from a natural-language intent using Claude.

    The system prompt injects the full schema, window function rules, and
    output constraints so Claude generates correct, project-specific SQL.
    """
    intent = request.intent.strip()

    # ── Validate intent ───────────────────────────────────────────────────
    if not intent:
        return AiSuggestResponse(
            status="error",
            error_code="EMPTY_INTENT",
            error_message="Intent cannot be empty.",
            hint="Describe what you want to query, e.g. 'show running totals per customer'.",
        )

    if len(intent) > _MAX_INTENT_LENGTH:
        return AiSuggestResponse(
            status="error",
            error_code="INTENT_TOO_LONG",
            error_message=f"Intent must be under {_MAX_INTENT_LENGTH} characters.",
            hint="Keep the description concise — the AI will fill in the details.",
        )

    # ── Call Claude API ───────────────────────────────────────────────────
    try:
        result = suggest_query(intent)
        debug = AiSuggestDebug(prompt=result.get("debug", {}).get("prompt"))
        return AiSuggestResponse(
            status="success",
            sql=result["sql"],
            model=result["model"],
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            debug=debug if debug.prompt else None,
        )

    except ValueError as e:
        # ANTHROPIC_API_KEY not set
        return AiSuggestResponse(
            status="error",
            error_code="AI_DISABLED",
            error_message=str(e),
            hint="Set ANTHROPIC_API_KEY in backend/.env and restart the server.",
        )

    except anthropic.RateLimitError:
        return AiSuggestResponse(
            status="error",
            error_code="RATE_LIMIT",
            error_message="Anthropic API rate limit reached.",
            hint="Too many requests — wait a few seconds and try again.",
        )

    except anthropic.APIError as e:
        return AiSuggestResponse(
            status="error",
            error_code="UPSTREAM_ERROR",
            error_message=f"Claude API error: {str(e)}",
            hint="Check the backend logs for the full error. Ensure your API key is valid.",
        )

    except Exception as e:
        return AiSuggestResponse(
            status="error",
            error_code="INTERNAL_ERROR",
            error_message=str(e),
            hint="An unexpected server error occurred.",
        )


@router.get("/status", tags=["AI Suggestions"])
def ai_status():
    """Returns whether the AI suggestion feature is enabled (API key is set)."""
    from app.config import ANTHROPIC_API_KEY
    enabled = bool(ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "ENTER_YOUR_VALUE_HERE")
    return {
        "ai_enabled": enabled,
        "model": "claude-haiku-4-5" if enabled else None,
        "hint": None if enabled else "Set ANTHROPIC_API_KEY in backend/.env",
    }
```

### Step 5 — Register Router in main.py

Claude Cowork: Open `backend/app/main.py` and add:

```python
# Add to imports (after sql_editor):
from app.routers import ai_suggest

# Add after app.include_router(sql_editor.router):
app.include_router(ai_suggest.router)
```

### Step 6 — Frontend Hook: useAiSuggestion.js

**File to create:** `frontend/src/hooks/useAiSuggestion.js`

```javascript
/**
 * useAiSuggestion — manages the AI query suggestion lifecycle.
 *
 * States: idle | loading | success | error
 * Exposes: suggest(intent), dismiss, suggestedSql, isLoading, error, aiEnabled
 */
import { useState, useCallback, useEffect } from "react";
import apiClient from "../api/client";

export function useAiSuggestion() {
  const [status,       setStatus]       = useState("idle");  // "idle"|"loading"|"success"|"error"
  const [suggestedSql, setSuggestedSql] = useState(null);
  const [error,        setError]        = useState(null);
  const [aiEnabled,    setAiEnabled]    = useState(true);    // optimistic default

  // Check if AI is configured on mount
  useEffect(() => {
    apiClient.get("/api/ai/status")
      .then((res) => setAiEnabled(res.data.ai_enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  const suggest = useCallback(async (intent) => {
    if (!intent?.trim()) return;
    setStatus("loading");
    setSuggestedSql(null);
    setError(null);

    try {
      const res  = await apiClient.post("/api/ai/suggest", { intent });
      const data = res.data;

      if (data.status === "success") {
        setStatus("success");
        setSuggestedSql(data.sql);
      } else {
        setStatus("error");
        setError(data.error_message || "AI suggestion failed.");
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Network error reaching AI endpoint.");
    }
  }, []);

  const dismiss = useCallback(() => {
    setStatus("idle");
    setSuggestedSql(null);
    setError(null);
  }, []);

  return {
    status,
    suggestedSql,
    error,
    aiEnabled,
    isLoading: status === "loading",
    suggest,
    dismiss,
  };
}
```

### Step 7 — Frontend Component: AiSuggestionPanel.jsx

**File to create:** `frontend/src/components/AiSuggestionPanel.jsx`

```jsx
/**
 * AiSuggestionPanel — intent input, quick chips, and suggestion preview.
 *
 * Design: DESIGN-voltagent.md
 *  - Intent input: {text-input} component spec (canvas-soft bg, hairline border, sm radius)
 *  - Suggest button: {button-primary} (green bg, dark text)
 *  - Chips: {button-pill-tag} (hairline border, pill radius)
 *  - Preview card: {card-feature} chrome (canvas bg, hairline border, md radius, 2xl padding)
 *  - Use this query: {button-primary}
 *  - Discard: {button-outline-on-dark}
 */
import { useState, useRef } from "react";
import { highlightSql } from "../utils/sqlHighlight";

const QUICK_CHIPS = [
  { label: "Running totals",    intent: "Show the running total spend per customer ordered by date" },
  { label: "Customer ranking",  intent: "Rank customers within each city by their total lifetime spend using ROW_NUMBER, RANK, and DENSE_RANK" },
  { label: "Category breakdown",intent: "Show running totals and maximums per customer per product category" },
  { label: "Segment by spend",  intent: "Segment customers into Platinum, Gold, Silver, Bronze tiers using NTILE(4) on lifetime spend" },
  { label: "Moving averages",   intent: "Show 3-order and 5-order moving averages of order amounts per customer" },
  { label: "Top products",      intent: "Rank products within each category by total revenue using DENSE_RANK, showing top 3 and bottom 3" },
];

export default function AiSuggestionPanel({
  aiEnabled,
  isLoading,
  suggestedSql,
  error,
  status,
  onSuggest,
  onUseSql,
  onDismiss,
}) {
  const [intent, setIntent] = useState("");
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (intent.trim()) onSuggest(intent);
  };

  const handleChip = (chipIntent) => {
    setIntent(chipIntent);
    onSuggest(chipIntent);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") { onDismiss(); setIntent(""); }
  };

  return (
    <div style={{
      borderBottom: "1px solid var(--color-hairline)",
      backgroundColor: "var(--color-canvas-soft)",
      padding: "var(--space-lg) var(--space-2xl)",
    }}>
      {/* ── Section label ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        {/* Sparkle icon — AI indicator */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
            fill="var(--color-primary)" stroke="none" />
        </svg>
        <span style={{
          fontSize: "var(--text-caption-size)",
          fontWeight: "600",
          letterSpacing: "var(--text-eyebrow-mono-ls)",
          textTransform: "uppercase",
          color: aiEnabled ? "var(--color-primary)" : "var(--color-mute)",
        }}>
          {aiEnabled ? "AI Query Suggestions" : "AI Disabled — set ANTHROPIC_API_KEY"}
        </span>
      </div>

      {/* ── Intent input row ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        {/* text-input spec from DESIGN-voltagent.md */}
        <input
          ref={inputRef}
          type="text"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "show running totals per customer"'
          disabled={!aiEnabled || isLoading}
          aria-label="Describe the SQL query you want"
          style={{
            flex: 1,
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-md) var(--space-lg)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm-size)",
            lineHeight: "var(--text-body-sm-lh)",
            outline: "none",
            opacity: (!aiEnabled || isLoading) ? 0.5 : 1,
            transition: "border-color var(--transition-fast)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--color-hairline)"; }}
        />

        {/* Suggest button — button-primary */}
        <button
          onClick={handleSubmit}
          disabled={!aiEnabled || isLoading || !intent.trim()}
          aria-label="Generate AI query suggestion"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            padding: "var(--space-md) var(--space-lg)",
            backgroundColor: (!aiEnabled || !intent.trim()) ? "var(--color-canvas)" : "var(--color-primary)",
            color: (!aiEnabled || !intent.trim()) ? "var(--color-mute)" : "var(--color-on-primary)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-button-md-size)",
            fontWeight: "var(--text-button-md-weight)",
            cursor: (!aiEnabled || isLoading || !intent.trim()) ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
            opacity: (!aiEnabled || !intent.trim()) ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                style={{ animation: "spin 0.75s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 3A9 9 0 0 1 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Generating…
            </>
          ) : (
            <>✦ Suggest</>
          )}
        </button>
      </div>

      {/* ── Quick chips — button-pill-tag from DESIGN-voltagent.md ──────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleChip(chip.intent)}
            disabled={!aiEnabled || isLoading}
            style={{
              padding: "var(--space-xs) var(--space-md)",
              backgroundColor: "var(--color-canvas)",
              color: aiEnabled ? "var(--color-body)" : "var(--color-mute)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-body-sm-size)",
              cursor: (!aiEnabled || isLoading) ? "not-allowed" : "pointer",
              transition: "all var(--transition-fast)",
              opacity: (!aiEnabled || isLoading) ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (aiEnabled && !isLoading) {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.color = "var(--color-primary)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-hairline)";
              e.currentTarget.style.color = "var(--color-body)";
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Error message ─────────────────────────────────────────────── */}
      {status === "error" && error && (
        <p style={{
          marginTop: "var(--space-md)",
          fontSize: "var(--text-body-sm-size)",
          color: "var(--color-danger)",
        }}>
          ✗ {error}
        </p>
      )}

      {/* ── Suggestion Preview Card — card-feature chrome ───────────────── */}
      {status === "success" && suggestedSql && (
        <div style={{
          marginTop: "var(--space-lg)",
          backgroundColor: "var(--color-canvas)",
          border: "2px solid var(--color-primary)",  /* featured card — 2px primary */
          borderRadius: "var(--radius-md)",
          padding: "var(--space-2xl)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <span style={{
              fontSize: "var(--text-caption-size)",
              fontWeight: "600",
              letterSpacing: "var(--text-eyebrow-mono-ls)",
              textTransform: "uppercase",
              color: "var(--color-primary)",
            }}>
              ✦ AI Suggestion
            </span>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              {/* Use this query — button-primary */}
              <button
                onClick={() => { onUseSql(suggestedSql); setIntent(""); }}
                style={{
                  padding: "var(--space-sm) var(--space-lg)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Use this query
              </button>
              {/* Discard — button-outline-on-dark */}
              <button
                onClick={() => { onDismiss(); setIntent(""); }}
                style={{
                  padding: "var(--space-sm) var(--space-lg)",
                  backgroundColor: "var(--color-canvas)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Discard
              </button>
            </div>
          </div>

          {/* Highlighted SQL preview — code-mockup chrome */}
          <div
            aria-label="AI-suggested SQL query preview"
            dangerouslySetInnerHTML={{ __html: highlightSql(suggestedSql) }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-code-size)",
              lineHeight: "var(--text-code-lh)",
              color: "var(--color-ink)",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              maxHeight: "320px",
              backgroundColor: "var(--color-canvas-soft)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-lg)",
            }}
          />
        </div>
      )}

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

### Step 8 — Integrate into SqlEditor.jsx

Claude Cowork: Open `frontend/src/pages/SqlEditor.jsx` and make these targeted changes:

**Add imports at the top:**
```jsx
import { useAiSuggestion } from "../hooks/useAiSuggestion";
import AiSuggestionPanel from "../components/AiSuggestionPanel";
```

**Add hook call inside the component (after existing hooks):**
```jsx
const {
  status: aiStatus,
  suggestedSql,
  error: aiError,
  aiEnabled,
  isLoading: aiLoading,
  suggest,
  dismiss: dismissAi,
} = useAiSuggestion();
```

**Handle "Use this query" — saves current SQL to history before replacing:**
```jsx
const handleUseSuggestion = useCallback((sql) => {
  // Save current editor content to history before replacing
  if (currentSql.trim()) {
    addToHistory({
      sql: currentSql,
      durationMs: 0,
      rowCount: 0,
      status: "replaced_by_ai",
    });
  }
  setSql(sql);
  dismissAi();
}, [currentSql, addToHistory, setSql, dismissAi]);
```

**Add the panel inside the editor card, before the schema panel:**

Place `<AiSuggestionPanel ... />` as the first child inside the outermost editor card `<div>`, before the `<div style={{ display: "flex" }}>` that holds schema + editor:

```jsx
<div style={{ border: "1px solid ...", borderRadius: "...", ... }}>

  {/* AI Suggestion Panel — Phase 14.8 */}
  <AiSuggestionPanel
    aiEnabled={aiEnabled}
    isLoading={aiLoading}
    suggestedSql={suggestedSql}
    error={aiError}
    status={aiStatus}
    onSuggest={suggest}
    onUseSql={handleUseSuggestion}
    onDismiss={dismissAi}
  />

  {/* existing schema + editor row */}
  <div style={{ display: "flex" }}>
    ...
  </div>
</div>
```

---

## 4. Testing and Validation

### 4.1 Backend Tests (run manually in terminal)

```powershell
# Test 1: AI status endpoint (key not yet set)
curl.exe -s http://localhost:8000/api/ai/status
# Expected: {"ai_enabled": false, "model": null, "hint": "Set ANTHROPIC_API_KEY..."}

# After Saikalyan sets ANTHROPIC_API_KEY:

# Test 2: Valid suggestion
curl.exe -s -X POST http://localhost:8000/api/ai/suggest `
  -H "Content-Type: application/json" `
  -d "{\"intent\": \"show total revenue per customer\"}" | python -c "import sys,json; d=json.load(sys.stdin); print(d['status'], '\n', d['sql'][:200])"
# Expected: status=success, SQL starts with SELECT or WITH

# Test 3: Empty intent
curl.exe -s -X POST http://localhost:8000/api/ai/suggest `
  -H "Content-Type: application/json" `
  -d "{\"intent\": \"\"}"
# Expected: {"status": "error", "error_code": "EMPTY_INTENT", ...}

# Test 4: Swagger UI — confirm /api/ai/suggest appears
# Open http://localhost:8000/docs and verify the endpoint is listed
```

### 4.2 Frontend Validation Checklist

| # | Test | Expected |
|---|------|---------|
| 1 | Page loads — AI disabled (no key) | "AI Disabled" label visible, chips greyed out |
| 2 | Page loads — AI enabled (key set) | Green "AI Query Suggestions" label, chips active |
| 3 | Type intent + Enter | Suggestion request fires, "Generating…" spinner visible |
| 4 | Click a chip | Intent auto-fills, request fires immediately |
| 5 | Suggestion arrives | Preview card appears with green 2px border |
| 6 | "Use this query" clicked | Editor content replaced, preview dismissed |
| 7 | Previous content saved to history | History panel shows the replaced query |
| 8 | "Discard" clicked | Preview dismissed, editor unchanged |
| 9 | Escape key in input | Panel dismissed, editor unchanged |
| 10 | AI error response | Red error message below input |

### 4.3 SQL Quality Spot Checks (after key is set)

| Intent | Check in returned SQL |
|--------|-----------------------|
| "Running totals per customer" | `SUM(...) OVER (PARTITION BY customer_id ORDER BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` |
| "Segment customers by spend" | `customer_totals` CTE present; `NTILE(4)` applied to CTE not raw orders |
| "Rank by city" | `DENSE_RANK() OVER (PARTITION BY city ...)` with `::NUMERIC` if PERCENT_RANK used |
| "Top products per category" | `DENSE_RANK()` used (not RANK); filter applied in outer SELECT via CTE |
| "Revenue percentage" | `NULLIF(denominator, 0)` present in all division expressions |

---

## 5. Handoff Checklist

### New Files Created in Phase 14.8

| File | ☐ |
|------|---|
| `backend/app/utils/claude_client.py` | ☐ |
| `backend/app/routers/ai_suggest.py` | ☐ |
| `frontend/src/hooks/useAiSuggestion.js` | ☐ |
| `frontend/src/components/AiSuggestionPanel.jsx` | ☐ |

### Existing Files Modified in Phase 14.8

| File | Change | ☐ |
|------|--------|---|
| `backend/.env` | Add `ANTHROPIC_API_KEY=ENTER_YOUR_VALUE_HERE` | ☐ |
| `backend/.env.example` | Add documented placeholder | ☐ |
| `backend/app/config.py` | Add `ANTHROPIC_API_KEY`, `APP_ENV` variables | ☐ |
| `backend/app/models/schemas.py` | Add `AiSuggestRequest`, `AiSuggestResponse`, `AiSuggestDebug` | ☐ |
| `backend/app/main.py` | Import + register `ai_suggest` router | ☐ |
| `frontend/src/pages/SqlEditor.jsx` | Add `useAiSuggestion` hook + `AiSuggestionPanel` component | ☐ |
| `backend/requirements.txt` | Regenerated after `pip install anthropic` | ☐ |

---

## 6. Phase 14.8 Final Sign-off

Claude Cowork must output this message when all checklist items pass:

```
╔══════════════════════════════════════════════════════════════════╗
║       PHASE 14.8 — AI QUERY SUGGESTIONS — COMPLETE              ║
╚══════════════════════════════════════════════════════════════════╝

✅ backend/app/utils/claude_client.py   — Claude API wrapper (claude-haiku-4-5)
✅ backend/app/routers/ai_suggest.py    — POST /api/ai/suggest + GET /api/ai/status
✅ backend/app/main.py                  — ai_suggest router registered
✅ backend/app/models/schemas.py        — AiSuggestRequest / Response / Debug added
✅ backend/.env                         — ANTHROPIC_API_KEY placeholder added
✅ backend/requirements.txt             — anthropic SDK included
✅ frontend/src/hooks/useAiSuggestion.js
✅ frontend/src/components/AiSuggestionPanel.jsx
✅ frontend/src/pages/SqlEditor.jsx     — AI panel integrated above editor

⚠️  ACTION REQUIRED:
Saikalyan — please open backend/.env and fill in:
  ANTHROPIC_API_KEY=your-key-from-console.anthropic.com
Then restart the backend (Ctrl+C → uvicorn app.main:app --reload --port 8000)
The /api/ai/status endpoint will return ai_enabled: true once set.

Ready to proceed to Phase 14.9 (Time Series Chart Layer).
```

---

*Phase 14.8 of 15 — AI Query Suggestions*
*Customer Purchase Analytics · Saikalyan G · Incedo Inc.*
