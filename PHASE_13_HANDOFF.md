# Customer Purchase Analytics — Full-Stack Integration
## Phase 13 Handoff / Memory Document

> **Purpose:** Captures the complete state of the project after Phase 13 (React frontend) so work can resume in a fresh Claude Cowork chat for Phase 14. Read this first (alongside `PHASE_11_HANDOFF.md` and `PHASE_12_HANDOFF.md`) before starting Phase 14.

---

## 1. Project Context

- **Project:** Customer Purchase Analytics — Full-Stack Integration (Incedo Inc. Internship, Task 2 Extension)
- **Author:** Saikalyan G (AI/Data Intern)
- **Build target folder:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`
- **OS / IDE:** Windows 11 (username `saika`), VS Code, PowerShell terminal
- **Status:** Phases 1–13 complete. Phase 14 (Req #43 Mega Report) is next.

### Stack (actual installed versions)
- **Backend:** FastAPI 0.138.1 + uvicorn 0.49.0 + supabase-py 2.31.0 + psycopg2-binary 2.9.12 + pydantic 2.13.4 (Python 3.11), port 8000
- **Frontend:** React 19.2 + Vite 8 (uses the rolldown bundler) + Oxlint 1.69 + Axios 1.18 + react-router-dom **v7.18** (dev server port 5173)
- **Database:** Supabase PostgreSQL 17.6

### Database / Dataset
- **Project ref / ID:** `ahoqabjdshigaqduiyou` | Region: ap-south-1 (Mumbai)
- **Data:** 7 customers, 8 products, 35 orders | Total revenue ₹5,55,627.50 | Jan–Jun 2024
- **Tables:** `customers` (7), `products` (8), `orders` (35)
- **⚠ RLS:** Row Level Security is enabled on all 3 tables with ZERO policies. The backend reads them with the **service-role key** (see Phase 12 handoff §4). This is unchanged in Phase 13 — the frontend never touches Supabase directly; it only calls the FastAPI backend.

---

## 2. Phase Plan (15 phases total; 13 complete)

| Phase | Scope | Status |
|---|---|---|
| 11 | Project setup, dependencies, folder structure | ✅ COMPLETE |
| 12 | FastAPI backend (config, database, schemas, 4 routers, main.py) | ✅ COMPLETE |
| 13 | React frontend (api client, hooks, components, 5 pages, routing) | ✅ COMPLETE |
| 14 | Req #43 Mega Report (SQL module, endpoint, MegaReportTable component) | ⏭ NEXT |
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

## 3. Files Created / Modified in Phase 13

All under `frontend\src\`. The folders `api\`, `components\`, `hooks\`, `pages\` existed (empty) from Phase 11; Phase 13 populated them.

| File | Status | Purpose |
|---|---|---|
| `src\api\client.js` | **NEW** | Axios instance. `baseURL` from `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:8000`), 15s timeout, JSON headers. Request interceptor logs calls in DEV; response interceptor flattens errors to `error.response.data.detail \|\| error.message`. Default export `apiClient`. |
| `src\hooks\useCustomers.js` | **NEW** | `useCustomers()` → `{ customers, loading, error }`. GETs `/api/customers`. Cancel-flag cleanup to avoid setting state after unmount. |
| `src\hooks\useProducts.js` | **NEW** | `useProducts()` → `{ products, loading, error }`. GETs `/api/products`. |
| `src\hooks\useOrders.js` | **NEW** | `useOrders(customerId = null)` → `{ orders, loading, error }`. GETs `/api/orders` or `/api/orders/customer/{id}` when an id is passed. Re-runs on `customerId` change. |
| `src\hooks\useAnalytics.js` | **NEW** | Exports **two** hooks: `useAnalytics(module)` → `{ data, loading, error, refetch }` (GETs `/api/analytics/{module}`, used by the Analytics page with a `refetch` callback), and `useDashboard()` → `{ summary, loading, error }` (GETs `/api/analytics/dashboard`). |
| `src\components\LoadingSpinner.jsx` | **NEW** | Presentational spinner. Prop `message` (default `"Loading..."`). Inline `<style>` keyframes for `spin`. |
| `src\components\ErrorBanner.jsx` | **NEW** | Red error banner. Props `message`, optional `onRetry` (renders a Retry button when provided). |
| `src\components\Navbar.jsx` | **NEW** | Sticky top nav using `NavLink` from react-router-dom. 5 links (Dashboard `/`, Customers, Products, Orders, Analytics). Active link highlighted. `end` prop on `/` so it isn't always active. |
| `src\pages\Dashboard.jsx` | **NEW** | KPI cards from `useDashboard()`. Reads `summary.total_revenue / total_orders / total_customers / total_products / avg_order_value / top_city / top_category`. Currency formatted via `Intl.NumberFormat("en-IN", { currency: "INR" })`. |
| `src\pages\Customers.jsx` | **NEW** | Table from `useCustomers()`. Columns: `customer_id`, `customer_name`, `city`, `signup_date`. |
| `src\pages\Products.jsx` | **NEW** | Card grid from `useProducts()`. Category color map for Electronics / Apparel / Appliances. Reads `product_id`, `category`, `product_name`, `brand`. |
| `src\pages\Orders.jsx` | **NEW** | Table from `useOrders()`. Columns incl. computed `order_amount`. Reads `order_id`, `order_date`, `customer_name`, `product_name`, `category`, `quantity`, `unit_price`, `discount`, `order_amount`. |
| `src\pages\Analytics.jsx` | **NEW** | Module selector (Segmentation M6 / Ranking M3 / Product Insights M9) → `useAnalytics(selectedModule)`. Generic `AnalyticsTable` renders `data.data[]` with columns derived from `Object.keys(data.data[0])`; header shows `data.description` and `data.row_count`. |
| `src\App.jsx` | **REPLACED** | Was the Vite starter. Now `BrowserRouter` + `Navbar` + `Routes` with 5 `Route`s. |
| `src\index.css` | **REPLACED** | Was the Vite starter theme. Now a minimal global reset (box-sizing, body font/colors, `button`/`code` styling). |

**Not modified:** `src\main.jsx` (already mounts `<App />` and imports `./index.css` — left as-is). `frontend\.env` already contained `VITE_API_BASE_URL=http://localhost:8000` from Phase 11 — no change needed.

### Final `frontend\src\` tree after Phase 13
```
frontend\src\
├── api\
│   └── client.js            ← NEW
├── hooks\
│   ├── useCustomers.js      ← NEW
│   ├── useProducts.js       ← NEW
│   ├── useOrders.js         ← NEW
│   └── useAnalytics.js      ← NEW (useAnalytics + useDashboard)
├── components\
│   ├── Navbar.jsx           ← NEW
│   ├── LoadingSpinner.jsx   ← NEW
│   └── ErrorBanner.jsx      ← NEW
├── pages\
│   ├── Dashboard.jsx        ← NEW
│   ├── Customers.jsx        ← NEW
│   ├── Products.jsx         ← NEW
│   ├── Orders.jsx           ← NEW
│   └── Analytics.jsx        ← NEW
├── App.jsx                  ← REPLACED (React Router)
├── index.css               ← REPLACED (global reset)
├── main.jsx                 ← unchanged
├── App.css                  ← ORPHANED (no longer imported; safe to delete)
└── assets\                  ← ORPHANED (hero.png, react.svg, vite.svg; safe to delete)
```

---

## 4. Backend endpoints the frontend depends on (from Phase 12)

The frontend is a pure consumer of these 12 endpoints on `http://localhost:8000` (CORS already allows `http://localhost:5173`, GET-only):

```
GET /                                   (health)
GET /health                             (detailed health)
GET /api/customers/                     (7 rows)        → Customers page
GET /api/customers/{customer_id}
GET /api/products/                      (8 rows)        → Products page
GET /api/products/category/{category}
GET /api/orders/                        (35 rows, order_amount computed) → Orders page
GET /api/orders/customer/{customer_id}
GET /api/analytics/dashboard            (DashboardSummaryOut) → Dashboard page
GET /api/analytics/segmentation         (M6, AnalyticsModuleOut) → Analytics page
GET /api/analytics/ranking              (M3, AnalyticsModuleOut) → Analytics page
GET /api/analytics/product-insights     (M9, AnalyticsModuleOut) → Analytics page
```

**Response shapes the frontend assumes:**
- Analytics modules (`AnalyticsModuleOut`): `{ module, description, row_count, data: [...] }`. The Analytics page renders `data` and shows `description` + `row_count`.
- Dashboard (`DashboardSummaryOut`): flat object with `total_revenue`, `total_orders`, `total_customers`, `total_products`, `avg_order_value`, `top_city`, `top_category`.
- Customers/Products/Orders endpoints return plain arrays of row objects.

> **Phase 14 note:** Phase 14 adds the Req #43 Mega Report. Expect a new backend endpoint (e.g. `GET /api/analytics/mega-report`) returning the `AnalyticsModuleOut` shape, plus a new `MegaReportTable` frontend component / Analytics module entry. The existing `useAnalytics(module)` hook already supports any module string, so `useAnalytics("mega-report")` will work once the endpoint exists — the Phase 14 frontend work is mostly adding the module to the `MODULES` array in `Analytics.jsx` (or a dedicated page/tab) and a wider table component.

---

## 5. Issue Found & Fixed During Phase 13 — trailing NUL bytes on overwrite

When `src\App.jsx` was overwritten (the original Vite starter file was longer than the new router version), the write left **~2,746 trailing NUL (`\x00`) bytes** padding the file out to the old length instead of truncating. A JS parser choked on it (`Unexpected character` at the first NUL). `src\index.css` was overwritten too but did not exhibit the issue.

**Fix applied:** rewrote `App.jsx` cleanly so the file ends right after the final `}` with no padding. Verified 0 NUL bytes afterward and confirmed the file parses.

**RULE:** When replacing an existing file with shorter content, verify the new file truncated correctly (no trailing `\x00` padding). A quick check: the file's last visible character should be the real end of content. If a build throws `Unexpected character` / `Invalid character` at a line past the visible end, suspect NUL padding and rewrite the file from scratch.

---

## 6. Phase 13 Verification

Code was statically validated in this session: all 15 `src` JS/JSX files parse with **0 syntax errors** and **0 unresolved local imports** (every `./...` import resolves to a real file). The user confirmed the frontend **runs and is stable** in the browser.

> **Important environment note:** `npm run build`, `npm run dev`, and `oxlint` cannot be executed inside Claude's Linux sandbox because this project's `node_modules` were installed on **Windows** — Vite 8's `rolldown` bundler and `oxlint` ship platform-specific native binaries (`*.win32-x64-*.node`), and the Linux equivalents (`rolldown-binding.linux-x64-gnu.node`) are absent. This is purely a cross-OS binary mismatch, **not** a code problem; the commands run normally on Saikalyan's Windows machine. Any future Cowork chat should validate frontend code by parsing/inspection (or ask the user to run `npm run dev` / `npm run build` locally), not by trying to build in the sandbox.

### §13.7 checklist (to confirm in the browser — user reports working)
| # | Page | Check |
|---|------|-------|
| 1 | Dashboard | KPI cards visible, total_revenue = ₹5,55,627.50 |
| 2 | Dashboard | Top City and Top Category displayed |
| 3 | Customers | Table shows 7 customers with city and date |
| 4 | Products | 8 product cards with colored category badges |
| 5 | Orders | 35 rows; order_amount = ROUND(quantity × unit_price × (1 − discount), 2) |
| 6 | Analytics → Segmentation | 7 rows, 4 segments (Platinum×2, Gold×2, Silver×2, Bronze×1) |
| 7 | Analytics → Ranking | 7 rows with row_num, rank_in_city, dense_rank_in_city |
| 8 | Analytics → Product Insights | 8 rows with performance_tier (Top 3 / Bottom 3 / Mid) |
| 9 | Navbar | All 5 links navigate; active state highlights current page |
| 10 | Console | No red errors in DevTools |

---

## 7. How to Run the Full Stack

Two terminals, backend first (frontend has nothing to read until the API is up):

```powershell
# Terminal 1 — backend (keep running)
cd C:\Users\saika\Downloads\customer-purchase-analytics-app\backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd C:\Users\saika\Downloads\customer-purchase-analytics-app\frontend
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend Swagger: `http://localhost:8000/docs`
- Re-verify backend anytime (server running, 2nd terminal): `python verify_phase12.py` → expect 11/11.

---

## 8. How to Resume in the New Chat (Phase 14)

**Paste this at the start of the new Cowork chat:**

> I am continuing the Customer Purchase Analytics full-stack project (Incedo internship). Phases 11–13 are complete. The project lives at `C:\Users\saika\Downloads\customer-purchase-analytics-app\`. Please read `PHASE_11_HANDOFF.md`, `PHASE_12_HANDOFF.md`, and `PHASE_13_HANDOFF.md` in that folder for full context, then I will upload the Phase 14 document. Connect/grant access to my `C:\Users\saika\Downloads` folder first.

**Checklist before Phase 14 work:**
1. Grant the new chat access to `C:\Users\saika\Downloads`.
2. Have it read all three handoff docs.
3. Confirm the backend runs (`uvicorn app.main:app --reload --port 8000`, `python verify_phase12.py` = 11/11) and the frontend runs (`npm run dev`) before adding the mega report.
4. Upload the **Phase 14** document.
5. Target React 19 + react-router-dom v7. The backend uses **psycopg2 + the service-role key** for raw SQL window-function endpoints — Phase 14's Req #43 SQL module will follow the same pattern (new file under `backend\app\queries\`, e.g. `req43_mega_report.py`, wired into `analytics.py`).
6. The new chat cannot run PowerShell on the machine — it creates files in the connected folder and gives commands to run.

**Key facts the Phase 14 frontend needs:** the analytics response shape `{ module, description, row_count, data[] }`; the reusable `useAnalytics(module)` hook already handles any module string; `apiClient` base URL is `VITE_API_BASE_URL`; CORS already allows `http://localhost:5173`.

---

## 9. Phase 13 Sign-off (issued)

```
✅ Phase 13 COMPLETE
- api/client.js: Axios instance with base URL, request/response interceptors
- hooks/useCustomers.js, useProducts.js, useOrders.js, useAnalytics.js: data-fetching hooks
- components/Navbar.jsx, LoadingSpinner.jsx, ErrorBanner.jsx: shared UI components
- pages/Dashboard.jsx: KPI cards from /api/analytics/dashboard
- pages/Customers.jsx: table from /api/customers
- pages/Products.jsx: cards from /api/products
- pages/Orders.jsx: table with calculated order_amount from /api/orders
- pages/Analytics.jsx: module selector with live window function results
- App.jsx: React Router with all 5 routes
- Frontend running at http://localhost:5173
- All pages display live Supabase data

Ready to proceed to Phase 14 (Req #43 Mega Report endpoint + frontend tab).
```

---

*End of Phase 13 Handoff. Next: Phase 14 — Req #43 Mega Report API Endpoint + Full Frontend Table View.*
