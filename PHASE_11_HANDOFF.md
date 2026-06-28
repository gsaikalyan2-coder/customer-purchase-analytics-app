# Customer Purchase Analytics — Full-Stack Integration
## Phase 11 Handoff / Memory Document

> **Purpose:** This document captures the complete state of the project after Phase 11 so that work can resume in a fresh Claude Cowork chat for Phase 12. Read this first before starting Phase 12.

---

## 1. Project Context

- **Project:** Customer Purchase Analytics — Full-Stack Integration (Incedo Inc. Internship, Task 2 Extension)
- **Author:** Saikalyan G (AI/Data Intern)
- **Build target folder:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`
- **OS / IDE:** Windows 11 (username `saika`), VS Code, PowerShell terminal
- **Prior work:** SQL analytics capstone Phases 1–10 are complete. Phases 11–15 build a FastAPI + React app on top of the existing Supabase database.

### Stack
- **Backend:** FastAPI + uvicorn + supabase-py (CRUD) + psycopg2-binary (raw SQL for window functions)
- **Frontend:** React + Vite + Axios + React Router
- **Database:** Supabase PostgreSQL 17.6

### Database / Dataset
- **Project name:** customer-purchase-analytics
- **Project ID / ref:** `ahoqabjdshigaqduiyou`
- **Region:** ap-south-1 (Mumbai)
- **Data:** 7 customers, 8 products, 35 orders | Total revenue ₹5,55,627.50 | Date range Jan–Jun 2024
- **Tables:** `customers` (7 rows), `products` (8 rows), `orders` (35 rows)

---

## 2. Phase Plan (15 phases total; 11 complete)

| Phase | Scope | Status |
|---|---|---|
| 11 | Project setup, dependencies, folder structure | ✅ COMPLETE |
| 12 | FastAPI backend (config, database, schemas, 4 routers, main.py) | ⏭ NEXT |
| 13 | React frontend (hooks, components, 5 pages, routing) | Pending |
| 14 | Req #43 Mega Report (SQL module, endpoint, MegaReportTable component) | Pending |
| 15 | Final integration testing, Git init, VS Code workspace, wrap-up | Pending |

**Execution rules carried forward:**
1. Build all files inside `C:\Users\saika\Downloads\customer-purchase-analytics-app\`.
2. Provide complete, copy-paste-ready code — no placeholders/ellipsis in code.
3. After each phase, output that phase's exact sign-off message.
4. Do not advance to the next phase until Saikalyan says "Phase X complete, proceed to Phase Y".
5. On any failure: diagnose root cause, give exact fix, state a rule to prevent recurrence.
6. `.env` files never contain real credentials in committed/template form; placeholders are `ENTER_YOUR_VALUE_HERE`.
7. `.env` files must never be committed to git.

---

## 3. Actual Installed Versions (IMPORTANT — differ from Phase 11 doc)

The Phase 11 document assumed React 18 / older tooling. The current scaffolding tools installed newer versions. **Phase 12–15 code must target these actual versions:**

### Backend (Python — wheels are cp311, so Python 3.11)
From `backend/requirements.txt` (UTF-8, pinned):
```
fastapi==0.138.1
uvicorn==0.49.0
supabase==2.31.0
postgrest==2.31.0
realtime==2.31.0
storage3==2.31.0
supabase-auth==2.31.0
supabase-functions==2.31.0
python-dotenv==1.2.2
psycopg2-binary==2.9.12
pydantic==2.13.4
pydantic_core==2.46.4
httpx==0.28.1
starlette==1.3.1
PyJWT==2.13.0
cryptography==49.0.0
```
(Full transitive list is in `backend/requirements.txt`.)

### Frontend (from `frontend/package.json`)
```json
"dependencies": {
  "axios": "^1.18.1",
  "react": "^19.2.7",
  "react-dom": "^19.2.7",
  "react-router-dom": "^7.18.0"
},
"devDependencies": {
  "@vitejs/plugin-react": "^6.0.2",
  "oxlint": "^1.69.0",
  "vite": "^8.1.0",
  "@types/react": "^19.2.17",
  "@types/react-dom": "^19.2.3"
}
```

**Key implications for later phases:**
- **React 19** (not 18). Fine for this project; write components for React 19.
- **react-router-dom v7** (not v6). Core API unchanged (`BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`), but use v7 conventions.
- **Vite 8** with **Oxlint** (not ESLint). `npm run dev` serves on port **5173**.
- Backend run command: `uvicorn app.main:app --reload --port 8000`.

---

## 4. Folder Structure Created (Phase 11)

```
customer-purchase-analytics-app\
├── .gitignore                     ← root, protects .env / node_modules / .venv
├── README.md
├── PHASE_11_HANDOFF.md            ← this file
├── backend\
│   ├── .env                       ← FILLED with real credentials (gitignored, NOT in this doc)
│   ├── .env.example               ← template with dummy values
│   ├── .gitignore                 ← .venv/ __pycache__/ *.pyc .env
│   ├── requirements.txt           ← UTF-8, all deps pinned
│   ├── .venv\                      ← Python 3.11 virtual env (created, deps installed)
│   └── app\
│       ├── __init__.py            ← created (empty package marker)
│       ├── routers\__init__.py    ← created (empty)
│       ├── models\__init__.py     ← created (empty)
│       └── queries\__init__.py    ← created (empty)
└── frontend\
    ├── .env                       ← VITE_API_BASE_URL=http://localhost:8000
    ├── .env.example
    ├── .gitignore                 ← Vite defaults + .env protection (see §6)
    ├── package.json               ← React 19, axios, react-router-dom v7
    ├── index.html
    ├── vite.config.js
    ├── node_modules\              ← installed
    └── src\
        ├── main.jsx               ← Vite default (to be replaced in Phase 13)
        ├── App.jsx                ← Vite default (to be replaced in Phase 13)
        ├── api\                   ← empty (Phase 13: client.js)
        ├── components\            ← empty (Phase 13: Navbar/LoadingSpinner/ErrorBanner)
        ├── pages\                 ← empty (Phase 13: 5 pages)
        └── hooks\                 ← empty (Phase 13: 4 hooks)
```

**Files NOT yet created (these are Phase 12+ work):** `backend/app/main.py`, `config.py`, `database.py`, `models/schemas.py`, the 4 routers (`customers.py`, `products.py`, `orders.py`, `analytics.py`), and the `queries/` SQL modules (`base_cte.py`, `m1`–`m10`, `req43_mega_report.py`). Frontend `api/client.js`, hooks, components, and pages are also Phase 12/13/14.

---

## 5. Environment Variables — Current State

`backend/.env` has been **filled in by Saikalyan** with real values (NOT reproduced here for security). Variable names present:
- `SUPABASE_URL` = `https://ahoqabjdshigaqduiyou.supabase.co` (base URL only — no `/rest/v1/` suffix; supabase-py adds the path itself)
- `SUPABASE_ANON_KEY` = legacy anon JWT (filled)
- `SUPABASE_SERVICE_ROLE_KEY` = legacy service_role JWT (filled, sensitive — server-side only)
- `DATABASE_URL` = Supabase **Session pooler** URI (IPv4-safe), host `aws-1-ap-south-1.pooler.supabase.com:5432`, user `postgres.ahoqabjdshigaqduiyou`, db `postgres`
- `APP_ENV=development`, `BACKEND_PORT=8000`, `ALLOWED_ORIGINS=http://localhost:5173`

`frontend/.env`:
- `VITE_API_BASE_URL=http://localhost:8000`

### ⚠️ DATABASE_URL notes for Phase 12
- **Session pooler used deliberately**, not Direct connection. Supabase Direct connection is IPv6-only without the paid IPv4 add-on, and would fail on a typical home Windows network. Session pooler is IPv4-compatible and works with psycopg2.
- **Password contains a `$`.** `python-dotenv` may interpret `$...` as variable interpolation. If the DB connection fails in Phase 12, wrap the value in single quotes in `.env`: `DATABASE_URL='postgresql://...'`. Alternatively, in `config.py`, call `load_dotenv()` and read with `os.environ` and consider `python-dotenv`'s `interpolate=False`-style handling if needed.
- **Bracket gotcha:** the copied template had `[YOUR-PASSWORD]`; the literal `[ ]` brackets must NOT remain around the password.

---

## 6. Issues Encountered & Fixes (Rules to Carry Forward)

1. **requirements.txt written as UTF-16 by PowerShell.**
   `pip freeze > requirements.txt` in PowerShell defaults to UTF-16-LE, which corrupts the file for pip/git. **Fix applied:** rewrote as clean UTF-8.
   **RULE:** Never use `>` redirection for text files in PowerShell. Use `pip freeze | Out-File -Encoding utf8 requirements.txt` (or `Set-Content -Encoding utf8`).

2. **Vite overwrote `frontend/.gitignore` and it ended up truncated** (lost `node_modules`, `dist`, and `.env` protection). **Fix applied:** rewrote it with full Vite defaults + `.env`/`*.env` lines.
   **RULE:** After any scaffolding tool runs, re-verify `.gitignore` still ignores `.env` and `node_modules`.

3. **`npm create vite` auto-install failed with `EALLOWSCRIPTS`** (newer npm blocks the internal `--allow-scripts` during project-scoped install). This was **harmless** — the manual `npm install` afterward succeeded and installed everything (axios, react-router-dom, react 19, etc.).
   **RULE:** If create-vite's "install and start now" step errors with EALLOWSCRIPTS, ignore it and run `npm install` manually.

4. **`SUPABASE_URL` initially had `/rest/v1/` appended.** Corrected to base URL only.
   **RULE:** `SUPABASE_URL` must be `https://<ref>.supabase.co` with no path.

5. **`npm create vite` warns "directory not empty"** because `.env` files were pre-created. Chose **"Ignore files and continue"** to preserve them.

---

## 7. Phase 11 Verification — All Checks Passed

| # | Check | Result |
|---|-------|--------|
| 1 | Backend `.venv` exists | ✅ |
| 2 | `requirements.txt` has fastapi/supabase/psycopg2-binary | ✅ |
| 3 | Frontend `node_modules` exists | ✅ |
| 4 | `package.json` has axios | ✅ |
| 5 | Both `.env` files exist | ✅ |
| 6 | Backend `.env` filled (placeholders replaced) | ✅ |
| 7 | `.env` ignored in all 3 `.gitignore` files | ✅ |

---

## 8. How to Resume in the New Chat (Phase 12)

**Paste this context at the start of the new Cowork chat:**

> I am continuing the Customer Purchase Analytics full-stack project (Incedo internship). Phase 11 (setup) is complete. The project lives at `C:\Users\saika\Downloads\customer-purchase-analytics-app\`. Please read `PHASE_11_HANDOFF.md` in that folder for full context, then I will upload the Phase 12 document. Connect/grant access to my `C:\Users\saika\Downloads` folder first.

**Checklist for the new chat before Phase 12 work:**
1. Grant the new chat access to `C:\Users\saika\Downloads` (folder connection).
2. Have it read this `PHASE_11_HANDOFF.md`.
3. Confirm `backend/.env` is filled (it is) — the new chat should NOT need to recreate it.
4. Activate the venv before running backend commands: `cd backend` then `.venv\Scripts\Activate.ps1`.
5. Upload the **Phase 12** document and say "proceed with Phase 12".
6. Remember: the new chat cannot run PowerShell on your machine — it will give you commands to run, and create files directly in the connected folder.

**Environment reminder:** Backend = `uvicorn app.main:app --reload --port 8000`; Frontend = `npm run dev` (port 5173). CORS allowed origin is already set to `http://localhost:5173`.

---

*End of Phase 11 Handoff. Next: Phase 12 — FastAPI Backend (config, database connection, schemas, 4 routers, main.py).*
