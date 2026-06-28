# Phase 14.8 — AI Query Suggestions — Handoff

**Status:** ✅ Implemented (as-built documentation)
**Project:** Customer Purchase Analytics — Full-Stack Integration
**Author:** Saikalyan G · Incedo Inc. Internship Task 2
**Design system:** DESIGN-voltagent.md (dark canvas `#101010`, electric-green `#00d992`)
**Stack:** FastAPI (Python) + React 18 (Vite) + Supabase PostgreSQL 17.6 + Anthropic Claude API
**Sits between:** Phase 14.75 (SQL Editor) → **Phase 14.8 (AI Query Suggestions)** → Phase 14.9 (Charts)

---

## 0. Summary

Phase 14.8 adds a natural-language → SQL assistant to the SQL Editor page. The user types an
intent (e.g. "show running totals per customer") and Claude (`claude-haiku-4-5`) returns a
ready-to-run, commented PostgreSQL query that respects the project's exact schema and window-
function rules. The suggestion is previewed with syntax highlighting; "Use this query" drops it
into the editor, where it still passes through the Phase 14.75 SQL guard before execution.

The feature is **optional** — the server runs fine without an API key; the panel shows an
"AI Disabled" state until `ANTHROPIC_API_KEY` is set.

---

## 1. File Inventory

### New files

| File | Purpose |
|------|---------|
| `backend/app/routers/ai_suggest.py` | `POST /api/ai/suggest`, `GET /api/ai/status` |
| `backend/app/utils/claude_client.py` | `suggest_query()` — Claude wrapper + server-side system prompt (schema, window rules, output format) |
| `frontend/src/hooks/useAiSuggestion.js` | Suggestion lifecycle (idle/loading/success/error), `aiEnabled` probe |
| `frontend/src/components/AiSuggestionPanel.jsx` | Intent input, quick chips, suggestion preview card |

### Modified files

| File | Change |
|------|--------|
| `backend/app/models/schemas.py` | Added `AiSuggestRequest`, `AiSuggestDebug`, `AiSuggestResponse` |
| `backend/app/config.py` | Added `ANTHROPIC_API_KEY` (optional — not enforced by `validate_config()`) |
| `backend/app/main.py` | `include_router(ai_suggest.router)` |
| `backend/requirements.txt` | `anthropic==0.112.0` |
| `frontend/src/pages/SqlEditor.jsx` | Mounts `AiSuggestionPanel` + `useAiSuggestion`; "Use this query" sets editor SQL |

---

## 2. API Contract

### `POST /api/ai/suggest`

Request:
```json
{ "intent": "show running totals per customer by order date" }
```

Success:
```json
{
  "status": "success",
  "sql": "-- Running total of spend per customer ...\nSELECT ...",
  "model": "claude-haiku-4-5",
  "input_tokens": 612,
  "output_tokens": 184,
  "debug": { "prompt": "<system prompt, dev mode only>" }
}
```

Error (uniform shape):
```json
{ "status": "error", "error_code": "AI_DISABLED",
  "error_message": "ANTHROPIC_API_KEY is not configured.",
  "hint": "Set ANTHROPIC_API_KEY in backend/.env and restart the server." }
```

Error codes: `EMPTY_INTENT`, `INTENT_TOO_LONG` (>500 chars), `AI_DISABLED`,
`RATE_LIMIT`, `UPSTREAM_ERROR`, `INTERNAL_ERROR`.

### `GET /api/ai/status`
```json
{ "ai_enabled": true, "model": "claude-haiku-4-5", "hint": null }
```
The frontend calls this on mount to decide whether to enable the panel.

---

## 3. How it works

1. `claude_client.suggest_query(intent)` builds a server-side `SYSTEM_PROMPT` from four blocks:
   identity, full schema (3 tables, the "order_amount is never stored" rule), seven window-
   function rules (LAST_VALUE framing, DENSE_RANK for rank filters, no window funcs in
   WHERE/GROUP BY, `::NUMERIC` cast before ROUND, `NULLIF` on division, NTILE pre-aggregation,
   LAG/LEAD NULL behaviour), and output-format rules (comment header, ≤50 lines, no markdown
   fences).
2. Model `claude-haiku-4-5`, `max_tokens=1000`. The prompt is only returned in `debug` when
   `APP_ENV=development`.
3. `useAiSuggestion` posts the intent, stores `suggestedSql`; the panel previews it via
   `highlightSql()` and offers **Use this query** / **Discard**.
4. Quick chips pre-fill six common intents (running totals, ranking, category breakdown,
   NTILE segments, moving averages, top products). Enter submits; Esc dismisses.

---

## 4. Security notes

- The Anthropic API key lives only in `backend/.env`; it never reaches the browser. The frontend
  only learns a boolean via `/api/ai/status`.
- Intent is capped at 500 characters server-side.
- The suggestion preview uses `dangerouslySetInnerHTML` with `highlightSql()` output. That helper
  HTML-escapes all plain text and string literals and only emits spans for an alphanumeric keyword
  allowlist, so rendering AI-generated SQL is XSS-safe.
- Generated SQL is **not** auto-executed. When the user runs it, it still passes the Phase 14.75
  guard (SELECT/EXPLAIN/WITH only), so the AI cannot introduce write/DDL operations.

---

## 5. Known gotcha (resolved)

`anthropic` must be installed **inside `backend\.venv`**, not global Python. `requirements.txt`
already pins it; if `uvicorn` fails with `ModuleNotFoundError: No module named 'anthropic'`,
activate the venv and run `python -m pip install -r requirements.txt` (using `python -m pip`
guarantees the venv interpreter is targeted).

---

## 6. Verification

- `GET /docs` lists `POST /api/ai/suggest` and `GET /api/ai/status`.
- Without a key: `/api/ai/status` → `ai_enabled:false`; the panel shows "AI Disabled".
- With a key: type an intent or click a chip → a commented SQL suggestion appears → "Use this
  query" loads it into the editor → Run executes it through the guard.

---

*Phase 14.8 — AI Query Suggestions · Customer Purchase Analytics · Saikalyan G · Incedo Inc.*
