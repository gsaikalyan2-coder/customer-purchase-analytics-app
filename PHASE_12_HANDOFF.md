# Customer Purchase Analytics — Full-Stack Integration
## Phase 12 Handoff / Memory Document

> **Purpose:** Captures the complete state of the project after Phase 12 so work can resume in a fresh Claude Cowork chat for Phase 13. Read this first (alongside `PHASE_11_HANDOFF.md`) before starting Phase 13.

---

## 1. Project Context

- **Project:** Customer Purchase Analytics — Full-Stack Integration (Incedo Inc. Internship, Task 2 Extension)
- **Author:** Saikalyan G (AI/Data Intern)
- **Build target folder:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`
- **OS / IDE:** Windows 11 (username `saika`), VS Code, PowerShell terminal
- **Status:** Phases 1–12 complete. Phase 13 (React frontend) is next.

### Stack (actual installed versions — target these)
- **Backend:** FastAPI 0.138.1 + uvicorn 0.49.0 + supabase-py 2.31.0 + psycopg2-binary 2.9.12 + pydantic 2.13.4 (Python 3.11)
- **Frontend:** React 19.2 + Vite 8 + Oxlint + Axios 1.18 + react-router-dom v7 (dev server port 5173)
- **Database:** Supabase PostgreSQL 17.6

### Database / Dataset
- **Project ref / ID:** `ahoqabjdshigaqduiyou` | Region: ap-south-1 (Mumbai)
- **Data:** 7 customers, 8 products, 35 orders | Total revenue ₹5,55,627.50 | Jan–Jun 2024
- **Tables:** `customers` (7), `products` (8), `orders` (35)
- **⚠ RLS:** Row Level Security is **enabled on all 3 tables with ZERO policies** (verified directly). The anon key therefore reads **nothing**. See §4 and §6.

---

## 2. Phase Plan (15 phases total; 12 complete)

| Phase | Scope | Status |
|---|---|---|
| 11 | Project setup, dependencies, folder structure | ✅ COMPLETE |
| 12 | FastAPI backend (config, database, schemas, 4 routers, main.py) | ✅ COMPLETE |
| 13 | React frontend (api client, hooks, components, 5 pages, routing) | ⏭ NEXT |
| 14 | Req #43 Mega Report (SQL module, endpoint, MegaReportTable component) | Pending |
| 15 | Final integration testing, Git init, VS Code workspace, wrap-up | Pending |

**Execution rules carried forward:**
1. Build all files inside `C:\Users\saika\Downloads\customer-purchase-analytics-app\`.
2. Provide complete, copy-paste-ready code — no placeholders/ellipsis.
3. After each phase, output that phase's exact sign-off message.
4. Do not advance to the next phase until Saikalyan says "Phase X complete, proceed to Phase Y".
5. On any failure: diagnose root cause, give exact fix, state a rule to prevent recurrence.
6. `.env` files never contain real credentials in committed/template form.
7. `.env` files must never be committed to git.

---

## 3. Files Created / Modified in Phase 12

All under `backend\app\` unless noted. The `__init__.py` package markers already existed from Phase 11.

| File | Purpose |
|---|---|
| `app\config.py` | Loads env vars via python-dotenv; `validate_config()` requires SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL on startup. |
| `app\database.py` | `get_supabase_client()` (Supabase-py, CRUD) + `get_pg_connection()` / `execute_raw_query()` (psycopg2, raw SQL for window functions). **See deviation in §4.** |
| `app\models\schemas.py` | Pydantic response models: `CustomerOut`, `ProductOut`, `OrderOut`, `AnalyticsModuleOut`, `DashboardSummaryOut`. |
| `app\routers\customers.py` | `GET /api/customers/`, `GET /api/customers/{customer_id}` (Supabase-py). |
| `app\routers\products.py` | `GET /api/products/`, `GET /api/products/category/{category}` (Supabase-py). |
| `app\routers\orders.py` | `GET /api/orders/`, `GET /api/orders/customer/{customer_id}` (psycopg2; `order_amount` calculated at query time, never stored). |
| `app\routers\analytics.py` | `GET /api/analytics/dashboard`, `/segmentation` (M6 NTILE), `/ranking` (M3), `/product-insights` (M9). All psycopg2. |
| `app\main.py` | FastAPI app, CORS (GET-only from localhost:5173), registers all 4 routers, `/` and `/health` health checks. |
| `backend\verify_phase12.py` | Standalone stdlib script that hits all endpoints and prints PASS/FAIL for the 11-item checklist. Re-run anytime. |
| `backend\.env` | **Modified** — fixed a malformed `DATABASE_URL` line (see §5). |

### The 12 live endpoints
```
GET /                                   (health)
GET /health                             (detailed health)
GET /api/customers/                     (7 rows)
GET /api/customers/{customer_id}
GET /api/products/                      (8 rows)
GET /api/products/category/{category}   (e.g. Electronics → 3)
GET /api/orders/                        (35 rows, with order_amount)
GET /api/orders/customer/{customer_id}
GET /api/analytics/dashboard            (total_revenue 555627.50)
GET /api/analytics/segmentation         (M6, 7 rows, Platinum/Gold/Silver/Bronze)
GET /api/analytics/ranking              (M3, 7 rows, city ranks)
GET /api/analytics/product-insights     (M9, 8 rows, performance tiers)
```

---

## 4. IMPORTANT Deviation from the Phase 12 Doc — Service-Role Key

The Phase 12 spec had `get_supabase_client()` use the **anon key**, described as "safe for read on public tables." In reality the tables have **RLS enabled with no read policy**, so the anon key returned **empty arrays** (HTTP 200 with `count=0`, and the single-customer endpoint 500'd on no row).

**Fix applied (chosen by Saikalyan):** `backend\app\database.py` → `get_supabase_client()` now uses `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY`.

- The service-role key **bypasses RLS**, so the trusted backend can read the tables.
- Tables stay **private** (RLS still on) — they are NOT publicly readable.
- The key is **server-side only**: never returned to the frontend, CORS is GET-only, and `.env` is gitignored.
- The import line in `database.py` was changed accordingly: `from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL`.

**Alternative not taken:** keep the anon key and add anon `SELECT` RLS policies on `customers`/`products`/`orders` in the Supabase SQL editor (would make those tables publicly readable). If a future phase needs anon access, that is the path.

**RULE:** When a Supabase REST/anon query returns 200 with empty data but the table has rows, suspect RLS. Check `pg_class.relrowsecurity` and `pg_policies`. For a server-side backend, use the service-role key; never ship the service-role key to a browser/frontend.

---

## 5. Environment Variables — Current State (`backend\.env`)

Real values are filled in and are NOT reproduced here. Keys present and correct:
- `SUPABASE_URL` = `https://ahoqabjdshigaqduiyou.supabase.co` (base URL, no path)
- `SUPABASE_ANON_KEY` = anon JWT (present; currently unused by the backend after the §4 change)
- `SUPABASE_SERVICE_ROLE_KEY` = service_role JWT (**used by the backend**, sensitive, server-side only)
- `DATABASE_URL` = Supabase **Session pooler** URI, single-quoted, host `aws-1-ap-south-1.pooler.supabase.com:5432`, user `postgres.ahoqabjdshigaqduiyou`, db `postgres`
- `APP_ENV=development`, `BACKEND_PORT=8000`, `ALLOWED_ORIGINS=http://localhost:5173`

### Bug fixed in `.env` during Phase 12
The `DATABASE_URL` line had been appended with a **duplicated key prefix**:
```
DATABASE_URL=DATABASE_URL='postgresql://...'        ← BROKEN (value was the whole right-hand side)
```
This produced an invalid URI, so `psycopg2.connect()` failed and every raw-SQL endpoint returned 500. Corrected to a single, single-quoted line:
```
DATABASE_URL='postgresql://postgres.ahoqabjdshigaqduiyou:****@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
```
A duplicate "App Settings" block (repeated APP_ENV/BACKEND_PORT/ALLOWED_ORIGINS) was also removed.

**RULE:** When appending to `.env`, paste only the `KEY=value` once. Single-quote any value containing `$` (the DB password contains `$`) so python-dotenv does not attempt variable interpolation. Never leave `[ ]` brackets around the password.

**RULE:** A change to `.env` requires a full uvicorn **restart** (Ctrl+C then start again). `--reload` only watches `.py` files, and config is read once at import time.

---

## 6. Phase 12 Verification — 11/11 PASSED

Verified live via `python verify_phase12.py` with the server running, and cross-checked directly against the database:

| # | Check | Result |
|---|-------|--------|
| 1 | `/health` reachable | ✅ status=healthy |
| 2 | `/api/customers` returns 7 | ✅ count=7 |
| 3 | `/api/customers/1` = Aanya Sharma, Mumbai | ✅ |
| 4 | `/api/products` returns 8 | ✅ count=8 |
| 5 | `/api/products/category/Electronics` returns 3 | ✅ |
| 6 | `/api/orders` returns 35 with `order_amount` | ✅ no nulls |
| 7 | `/api/orders/customer/1` returns rows | ✅ count=6 |
| 8 | `/api/analytics/dashboard` total_revenue | ✅ 555627.50 |
| 9 | `/api/analytics/segmentation` 7 rows + tiers | ✅ Platinum, Platinum, Gold, Gold, Silver, Silver, Bronze |
| 10 | `/api/analytics/ranking` returns 7 | ✅ |
| 11 | `/api/analytics/product-insights` returns 8 | ✅ |

---

## 7. How to Run the Backend

```powershell
cd C:\Users\saika\Downloads\customer-purchase-analytics-app\backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
- Swagger UI: `http://localhost:8000/docs`
- Re-verify anytime (server running, second terminal): `python verify_phase12.py`
- Frontend (Phase 13) will run with `npm run dev` on port **5173**; CORS already allows it.

---

## 8. Current Folder State (backend)

```
backend\
├── .env                      ← filled, DATABASE_URL fixed, service-role key in use
├── .env.example
├── .gitignore
├── requirements.txt          ← UTF-8, pinned
├── verify_phase12.py         ← NEW: API verification script
├── .venv\                    ← Python 3.11
└── app\
    ├── __init__.py
    ├── config.py             ← NEW
    ├── database.py           ← NEW (service-role key, §4)
    ├── main.py               ← NEW
    ├── models\
    │   ├── __init__.py
    │   └── schemas.py        ← NEW
    ├── routers\
    │   ├── __init__.py
    │   ├── customers.py      ← NEW
    │   ├── products.py       ← NEW
    │   ├── orders.py         ← NEW
    │   └── analytics.py      ← NEW
    └── queries\
        └── __init__.py       ← still empty (Phase 14: req43_mega_report.py etc.)
```

Frontend `src\` is still the Vite default (`main.jsx`, `App.jsx`) with empty `api\`, `components\`, `pages\`, `hooks\` folders — **this is Phase 13's job**.

---

## 9. How to Resume in the New Chat (Phase 13)

**Paste this at the start of the new Cowork chat:**

> I am continuing the Customer Purchase Analytics full-stack project (Incedo internship). Phases 11 and 12 are complete. The project lives at `C:\Users\saika\Downloads\customer-purchase-analytics-app\`. Please read `PHASE_11_HANDOFF.md` and `PHASE_12_HANDOFF.md` in that folder for full context, then I will upload the Phase 13 document. Connect/grant access to my `C:\Users\saika\Downloads` folder first.

**Checklist before Phase 13 work:**
1. Grant the new chat access to `C:\Users\saika\Downloads`.
2. Have it read both handoff docs.
3. Confirm the backend runs (`uvicorn app.main:app --reload --port 8000`) and `python verify_phase12.py` is 11/11 before building the frontend against it.
4. Upload the **Phase 13** document (api `client.js`, 4 hooks, Navbar/LoadingSpinner/ErrorBanner components, 5 pages, React Router v7 routing).
5. Target **React 19** and **react-router-dom v7**. Axios base URL comes from `VITE_API_BASE_URL` in `frontend\.env` (= `http://localhost:8000`).
6. The new chat cannot run PowerShell on your machine — it creates files in the connected folder and gives you commands to run.

**Key facts the frontend needs:** the 12 endpoints in §3; backend on `http://localhost:8000`; CORS already allows `http://localhost:5173`; analytics responses use the `{module, description, row_count, data[]}` shape (`AnalyticsModuleOut`); dashboard uses `DashboardSummaryOut`.

---

*End of Phase 12 Handoff. Next: Phase 13 — React Frontend (api client, hooks, components, 5 pages, routing).*
