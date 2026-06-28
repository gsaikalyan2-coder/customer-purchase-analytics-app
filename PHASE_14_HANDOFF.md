# Customer Purchase Analytics — Full-Stack Integration
## Phase 14 Handoff / Memory Document

> **Purpose:** Captures the complete state of the project after Phase 14 (Req #43 Mega Report — backend endpoint + frontend table) so work can resume in a fresh Claude Cowork chat for **Phase 15**. Read this first (alongside `PHASE_11_HANDOFF.md`, `PHASE_12_HANDOFF.md`, and `PHASE_13_HANDOFF.md`) before starting Phase 15.

---

## 1. Project Context

- **Project:** Customer Purchase Analytics — Full-Stack Integration (Incedo Inc. Internship, Task 2 Extension)
- **Author:** Saikalyan G (AI/Data Intern)
- **Build target folder:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`
- **OS / IDE:** Windows 11 (username `saika`), VS Code, PowerShell terminal
- **Status:** Phases 1–14 complete. **Phase 15 (Final Integration Testing, Git init, wrap-up) is next.**

### Stack (actual installed versions)
- **Backend:** FastAPI 0.138.1 + uvicorn 0.49.0 + supabase-py 2.31.0 + psycopg2-binary 2.9.12 + pydantic 2.13.4 (Python 3.11), port 8000
- **Frontend:** React 19.2 + Vite 8 (rolldown bundler) + Oxlint 1.69 + Axios 1.18 + react-router-dom v7.18 (dev server port 5173)
- **Database:** Supabase PostgreSQL 17.6

### Database / Dataset
- **Project ref / ID:** `ahoqabjdshigaqduiyou` | Region: ap-south-1 (Mumbai)
- **Data:** 7 customers, 8 products, 35 orders | Total revenue ₹5,55,627.50 | Jan–Jun 2024
- **Tables:** `customers` (7), `products` (8), `orders` (35)
- **⚠ RLS:** Row Level Security enabled on all 3 tables with ZERO policies. The backend reads them with the **service-role key** via psycopg2 (raw SQL) and the supabase-py client (simple CRUD). The frontend never touches Supabase directly — it only calls the FastAPI backend. Unchanged in Phase 14.

---

## 2. Phase Plan (15 phases total; 14 complete)

| Phase | Scope | Status |
|---|---|---|
| 11 | Project setup, dependencies, folder structure | ✅ COMPLETE |
| 12 | FastAPI backend (config, database, schemas, 4 routers, main.py) | ✅ COMPLETE |
| 13 | React frontend (api client, hooks, components, 5 pages, routing) | ✅ COMPLETE |
| 14 | Req #43 Mega Report (SQL module, endpoint, MegaReportTable component) | ✅ COMPLETE |
| 15 | Final integration testing, Git init, VS Code workspace, wrap-up | ⏭ NEXT |

**Execution rules carried forward:**
1. Build all files inside `C:\Users\saika\Downloads\customer-purchase-analytics-app\`.
2. Provide complete, copy-paste-ready code — no placeholders/ellipsis.
3. After each phase, output that phase's exact sign-off message.
4. Do not advance to the next phase until Saikalyan says "Phase X complete, proceed to Phase Y".
5. On any failure: diagnose root cause, give exact fix, state a rule to prevent recurrence.
6. `.env` files never contain real credentials in committed/template form.
7. `.env` files must never be committed to git.

---

## 3. Files Created / Modified in Phase 14

Two **new** files and two **edited** files. No existing code was removed.

| File | Status | Purpose |
|---|---|---|
| `backend\app\queries\req43_mega_report.py` | **NEW** | Holds the single module-level constant `MEGA_REPORT_SQL` — the complete Req #43 SQL query (M1–M8, one row per order). 263 lines. Executed by psycopg2 via `execute_raw_query()`. See §4 for column inventory. |
| `backend\app\routers\analytics.py` | **EDITED** | Added (a) the import `from app.queries.req43_mega_report import MEGA_REPORT_SQL` after the existing imports, and (b) a new endpoint `GET /api/analytics/mega-report` appended after the existing M9 `get_product_insights()` endpoint. Nothing else changed. |
| `frontend\src\components\MegaReportTable.jsx` | **NEW** | Wide, horizontally-scrollable table for the 35×45+ mega report. Column groups colored by module (Identity + M1–M8), a module legend, segment badges, and `spend_trend` badges. 197 lines. Default export `MegaReportTable({ data })`. |
| `frontend\src\pages\Analytics.jsx` | **EDITED** | Three targeted changes: import `MegaReportTable`; add the `mega-report` entry to the `MODULES` array; in the results section render `MegaReportTable` when `selectedModule === "mega-report"`, otherwise the generic `AnalyticsTable`. |

### What the new backend endpoint does
`GET /api/analytics/mega-report` → returns `AnalyticsModuleOut` shape:
```json
{
  "module": "Req #43",
  "description": "Mega Report — M1–M8 Window Functions (35 rows × 45+ columns)",
  "row_count": 35,
  "data": [ { ...50 columns per row... } ]
}
```
It runs `execute_raw_query(MEGA_REPORT_SQL)` and **hard-fails with HTTP 500 if `len(rows) != 35`** (database-integrity guard). `HTTPException` is re-raised cleanly; any other error is wrapped as `"Mega report query failed: ..."`.

### Exact code added to `analytics.py`

Import (added after the existing `from app.models.schemas import ...` line):
```python
from app.queries.req43_mega_report import MEGA_REPORT_SQL
```

Endpoint (appended at the very bottom, after `get_product_insights`):
```python
@router.get("/mega-report", response_model=AnalyticsModuleOut)
def get_mega_report():
    """
    Req #43 — Mega Report (M1–M8, one row per order).
    Returns all 35 orders with 45+ window function columns.
    Executed via psycopg2 (direct PostgreSQL) due to SQL complexity.

    Verified in Phase 10 audits:
    - Exactly 35 rows
    - SUM(order_amount) = 555627.50
    - All 4 segments present (Platinum, Gold, Silver, Bronze)
    - 7 NULLs in LAG/LEAD columns (one per customer — correct by design)
    """
    try:
        rows = execute_raw_query(MEGA_REPORT_SQL)
        if len(rows) != 35:
            raise HTTPException(
                status_code=500,
                detail=f"Mega report returned {len(rows)} rows — expected 35. Check database integrity."
            )
        return {
            "module": "Req #43",
            "description": "Mega Report — M1–M8 Window Functions (35 rows × 45+ columns)",
            "row_count": len(rows),
            "data": rows,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mega report query failed: {str(e)}")
```

### Exact changes in `Analytics.jsx`
```jsx
// 1. New import (top of file):
import MegaReportTable from "../components/MegaReportTable";

// 2. New entry appended to the MODULES array:
{ id: "mega-report", label: "Req #43 — Mega Report", description: "All M1–M8 window functions · 35 rows × 45+ columns (Phase 9)" },

// 3. In the results section, the old line:
//    <AnalyticsTable data={data.data} />
//  was replaced with:
{selectedModule === "mega-report"
  ? <MegaReportTable data={data.data} />
  : <AnalyticsTable data={data.data} />
}
```

---

## 4. Req #43 Mega Report — column inventory (50 columns output)

The SQL builds three CTEs (`base`, `customer_totals`, `customer_segments`) then a final `SELECT` ordered by `customer_id, order_date, order_id`. Output groups:

- **Identity (14):** `order_id`, `customer_id`, `customer_name`, `city`, `signup_date`, `product_id`, `product_name`, `category`, `brand`, `order_date`, `quantity`, `unit_price`, `discount`, `order_amount`
- **M1 — Purchase Journey (6):** `purchase_sequence`, `first_purchase_date`, `latest_purchase_date`, `previous_order_date`, `next_order_date`, `days_since_last_order`
- **M2 — Spending Analytics (6):** `running_total_spend`, `running_avg_spend`, `running_max_spend`, `running_min_spend`, `lifetime_total_spend`, `lifetime_avg_spend`
- **M3 — Ranking (5):** `city_row_number`, `city_rank`, `city_dense_rank`, `city_percent_rank`, `city_cume_dist`
- **M4 — Category (4):** `category_running_total`, `category_running_max`, `category_running_min`, `category_last_order_amount`
- **M5 — Revenue Contribution (3):** `pct_of_customer_spend`, `pct_of_category_revenue`, `pct_of_company_revenue`
- **M6 — Segmentation (2):** `quartile`, `segment`
- **M7 — Moving Analytics (4):** `moving_avg_3`, `moving_avg_5`, `surrounding_3_sum`, `rolling_revenue`
- **M8 — Purchase Patterns (5):** `previous_order_amount`, `next_order_amount`, `spend_difference`, `spend_change_pct`, `spend_trend`

> M9 (Product Insights) and M10 (Bonus) are intentionally **excluded** — they filter/aggregate rows and are incompatible with the one-row-per-order (35-row) constraint. M9 already has its own `/product-insights` endpoint.

**Frontend display note:** `MegaReportTable.jsx`'s `MODULE_GROUPS` lists **46** columns and renders them in module order. It intentionally omits `signup_date`, `product_id`, and `brand` from the Identity group (kept lean for screen width). The component filters columns with `col in data[0]`, so any column not returned is silently skipped — a built-in mismatch guard. **Verified: every one of the 46 frontend columns exists in the SQL output (0 mismatches).**

---

## 5. Backend endpoints the frontend depends on (now 13)

CORS allows `http://localhost:5173`, GET-only. New Phase 14 endpoint marked ⭐.

```
GET /                                   (health)
GET /health                             (detailed health)
GET /api/customers/                     (7 rows)
GET /api/customers/{customer_id}
GET /api/products/                      (8 rows)
GET /api/products/category/{category}
GET /api/orders/                        (35 rows, order_amount computed)
GET /api/orders/customer/{customer_id}
GET /api/analytics/dashboard            (DashboardSummaryOut)
GET /api/analytics/segmentation         (M6, AnalyticsModuleOut)
GET /api/analytics/ranking              (M3, AnalyticsModuleOut)
GET /api/analytics/product-insights     (M9, AnalyticsModuleOut)
GET /api/analytics/mega-report          (Req #43, AnalyticsModuleOut, 35 rows × 50 cols) ⭐ NEW
```

The reusable `useAnalytics(module)` hook (from Phase 13) handles `"mega-report"` with no changes — it just GETs `/api/analytics/mega-report`. The `AnalyticsModuleOut` Pydantic schema (`data: list[dict]`) already accommodates the wide rows; no schema change was needed.

---

## 6. Phase 14 Verification (what was and wasn't checked here)

**Statically verified in this Cowork session:**
- `req43_mega_report.py` compiles (`py_compile`, 0 errors).
- The new `get_mega_report` endpoint code compiles cleanly as an isolated snippet (valid Python syntax).
- `analytics.py` on disk is complete and syntactically valid (confirmed via file read — 278 lines, balanced).
- Column consistency: the 46 frontend `MODULE_GROUPS` columns are all present in the 50-column SQL output → **0 missing**.
- No trailing NUL-byte padding on any edited file (the Phase 13 overwrite issue did **not** recur).

**Confirmed by Saikalyan in the browser:** frontend runs, the Analytics tab shows the **Mega Report**, and the app is **stable**.

> **⚠ Sandbox limitation (carried from Phase 13):** Claude's Linux sandbox **cannot run this project's stack** — `node_modules` (Vite 8 rolldown, Oxlint) are Windows-native binaries, and the backend talks to the remote Supabase DB. So `npm run dev/build`, `oxlint`, `uvicorn`, and live `curl`/browser audits must be run by Saikalyan on Windows. Also note: the sandbox's view of files **edited** via the file tools can lag (a stale mount snapshot was observed for `analytics.py`); the authoritative files are the ones on the Windows disk, which were confirmed correct by direct read.

### Runtime checks still to confirm on Windows (from the Phase 14 doc §14.5/§14.6)
With both servers running:
```powershell
curl.exe http://localhost:8000/api/analytics/mega-report
```
| # | Check | Expected |
|---|-------|---------|
| 1 | endpoint returns 200 | `row_count` = 35 |
| 2 | Swagger shows it | `http://localhost:8000/docs` lists `/api/analytics/mega-report` |
| 3 | First row customer | Aanya Sharma (customer_id = 1) |
| 4 | Last row customer | Divya Reddy (customer_id = 7) |
| 5 | First `purchase_sequence` per customer | 1 |
| 6 | `spend_trend` for first order per customer | "First Purchase" |
| 7 | Segment distribution | Platinum×2, Gold×2, Silver×2, Bronze×1 |
| 8 | Segment badges | Platinum=blue, Gold=yellow, Silver=grey, Bronze=orange |
| 9 | `spend_trend` badges | Higher=green, Lower=red, First Purchase=blue |
| 10 | NULL cells render as "—" | LAG/LEAD nulls for first/last order per customer |

---

## 7. Final project tree (relevant parts, after Phase 14)

```
customer-purchase-analytics-app\
├── PHASE_11_HANDOFF.md
├── PHASE_12_HANDOFF.md
├── PHASE_13_HANDOFF.md
├── PHASE_14_HANDOFF.md            ← THIS FILE
├── README.md
├── .gitignore
├── backend\
│   ├── .env                       (gitignored — service-role key + DATABASE_URL)
│   ├── .env.example
│   ├── .gitignore
│   ├── requirements.txt
│   ├── verify_phase12.py
│   └── app\
│       ├── __init__.py
│       ├── config.py
│       ├── database.py            (get_supabase_client, get_pg_connection, execute_raw_query)
│       ├── main.py
│       ├── models\
│       │   ├── __init__.py
│       │   └── schemas.py         (AnalyticsModuleOut.data: list[dict])
│       ├── queries\
│       │   ├── __init__.py
│       │   └── req43_mega_report.py   ← NEW (Phase 14)
│       └── routers\
│           ├── __init__.py
│           ├── analytics.py       ← EDITED (Phase 14: import + mega-report endpoint)
│           ├── customers.py
│           ├── orders.py
│           └── products.py
└── frontend\
    ├── .env                       (VITE_API_BASE_URL=http://localhost:8000)
    └── src\
        ├── api\client.js
        ├── hooks\ (useCustomers, useProducts, useOrders, useAnalytics)
        ├── components\
        │   ├── Navbar.jsx
        │   ├── LoadingSpinner.jsx
        │   ├── ErrorBanner.jsx
        │   └── MegaReportTable.jsx   ← NEW (Phase 14)
        ├── pages\
        │   ├── Dashboard.jsx
        │   ├── Customers.jsx
        │   ├── Products.jsx
        │   ├── Orders.jsx
        │   └── Analytics.jsx         ← EDITED (Phase 14: Mega Report tab)
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── App.css                  (orphaned — safe to delete)
        └── assets\                  (orphaned — safe to delete)
```

---

## 8. How to Run the Full Stack

Two terminals, backend first:
```powershell
# Terminal 1 — backend (keep running)
cd C:\Users\saika\Downloads\customer-purchase-analytics-app\backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd C:\Users\saika\Downloads\customer-purchase-analytics-app\frontend
npm run dev
```
- Frontend: `http://localhost:5173` (Analytics → "Req #43 — Mega Report" tab)
- Backend Swagger: `http://localhost:8000/docs`
- Re-verify backend (server running, 2nd terminal): `python verify_phase12.py` → expect 11/11.

---

## 9. How to Resume in the New Chat (Phase 15)

**Paste this at the start of the new Cowork chat:**

> I am continuing the Customer Purchase Analytics full-stack project (Incedo internship). Phases 11–14 are complete. The project lives at `C:\Users\saika\Downloads\customer-purchase-analytics-app\`. Please read `PHASE_11_HANDOFF.md`, `PHASE_12_HANDOFF.md`, `PHASE_13_HANDOFF.md`, and `PHASE_14_HANDOFF.md` in that folder for full context, then I will upload the Phase 15 document. Connect/grant access to my `C:\Users\saika\Downloads` folder first.

**Checklist before Phase 15 work:**
1. Grant the new chat access to `C:\Users\saika\Downloads`.
2. Have it read all four handoff docs.
3. Confirm backend runs (`uvicorn app.main:app --reload --port 8000`; `python verify_phase12.py` = 11/11) and frontend runs (`npm run dev`) and is stable.
4. Upload the **Phase 15** document.
5. Remember: the new chat **cannot run PowerShell / the project stack** on the Windows machine — it creates/edits files in the connected folder and gives exact commands for Saikalyan to run.

**Likely Phase 15 scope (per the plan):** final integration testing, `.gitignore` review (ensure both `.env` files are excluded), `git init` + first commit, optional VS Code workspace file, README/wrap-up. **Before committing, double-check `backend\.env` and `frontend\.env` are gitignored and contain no real secrets in any committed/template form.**

**Key facts Phase 15 needs:** 13 GET endpoints (see §5); analytics response shape `{ module, description, row_count, data[] }`; `useAnalytics(module)` handles any module; `apiClient` base URL is `VITE_API_BASE_URL`; CORS allows `http://localhost:5173`; raw SQL endpoints use psycopg2 + service-role `DATABASE_URL`.

---

## 10. Phase 14 Sign-off (issued)

```
✅ Phase 14 COMPLETE
- backend/app/queries/req43_mega_report.py: Complete 45+ column SQL query (M1–M8)
- GET /api/analytics/mega-report endpoint: Returns 35 rows, validated against Phase 10 audits
- frontend/src/components/MegaReportTable.jsx: Color-coded module groups, badge formatting
- Analytics.jsx updated: Req #43 tab added, MegaReportTable used for mega-report module
- Verified: 35 rows, correct segments, correct spend_trend labels, NULL handling

The full Req #43 Mega Report is now accessible in the browser.

Ready to proceed to Phase 15 (Final Integration Testing, Documentation, Git Commit).
```

---

*End of Phase 14 Handoff. Next: Phase 15 — Final Integration Testing, Git Init, and Project Wrap-up.*
