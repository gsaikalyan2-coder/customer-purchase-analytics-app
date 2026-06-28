# Phase 16 — Deployment Runbook (Execution Copy)
**Customer Purchase Analytics — Vercel (frontend) + Render (backend)**
Author: Saikalyan G · Incedo Inc. · Prepared by Claude Cowork

This is the shortest path to a **working public URL**. Local prep (config files,
build verification, commit) is already DONE — see `PHASE_16_VERIFICATION_REPORT.md`.
What remains needs your accounts and secrets, which cannot be automated from the
Cowork sandbox. Follow A → B → C → D in order.

---

## A. Push the repo to GitHub  (~3 min — prerequisite for both platforms)

Run in **PowerShell** on your machine (the Cowork sandbox cannot push — the mount
blocks git's lock files, and it has no GitHub credentials):

```powershell
cd C:\Users\saika\Downloads\customer-purchase-analytics-app
git remote add origin https://github.com/gsaikalyan2-coder/customer-purchase-analytics-app.git
git push -u origin main
```

If the repo does not exist yet: create it on https://github.com/new named
`customer-purchase-analytics-app` (Private is fine), then run the two commands above.

Confirm: `git remote -v` shows the origin, and the repo is visible on GitHub.

---

## B. Deploy the backend to Render  (~20 min — must be first; frontend needs its URL)

1. https://render.com → sign in with GitHub → **New +** → **Web Service**.
2. Connect repo `gsaikalyan2-coder/customer-purchase-analytics-app`
   (Render auto-detects `backend/render.yaml`, already committed).
3. Confirm/set the service settings:

   | Field | Value |
   |-------|-------|
   | Name | `customer-purchase-analytics-api` |
   | Region | Singapore |
   | Branch | `main` |
   | Root Directory | `backend` |
   | Runtime | Python 3 |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | Instance Type | Free |

4. **Environment Variables** — enter the real values yourself (gather from the
   Supabase dashboard → Project Settings → API / Database, and the Anthropic console):

   | Key | Value |
   |-----|-------|
   | `APP_ENV` | `production` |
   | `SUPABASE_URL` | *(Supabase → API → Project URL)* |
   | `SUPABASE_ANON_KEY` | *(Supabase → API → anon public)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(Supabase → API → service_role)* |
   | `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.ahoqabjdshigaqduiyou.supabase.co:5432/postgres` |
   | `ANTHROPIC_API_KEY` | *(console.anthropic.com/settings/keys — optional; AI panel off if blank)* |
   | `ALLOWED_ORIGINS` | `http://localhost:5173`  *(temporary; updated in step D)* |
   | `BACKEND_PORT` | `8000` |

5. **Create Web Service** and watch Logs until `Application startup complete.`
   If you see `EnvironmentError: Missing or placeholder environment variables`,
   a required var (SUPABASE_URL / SUPABASE_ANON_KEY / DATABASE_URL) is empty.
6. Copy the live URL, e.g. `https://customer-purchase-analytics-api.onrender.com`.
7. Verify (PowerShell):
   ```powershell
   curl.exe -s https://customer-purchase-analytics-api.onrender.com/health
   # → {"status":"healthy", ... "total_revenue_inr":555627.5}
   curl.exe -s https://customer-purchase-analytics-api.onrender.com/api/analytics/dashboard | python -c "import sys,json;print('Revenue:',json.load(sys.stdin)['total_revenue'])"
   # → Revenue: 555627.5
   ```
   (First hit after idle is a 30–60s free-tier cold start — expected.)

---

## C. Deploy the frontend to Vercel  (~10 min)

Easiest path = GitHub integration (no CLI login needed):

1. https://vercel.com/dashboard → **Add New… → Project** → import
   `gsaikalyan2-coder/customer-purchase-analytics-app`.
2. **Root Directory** → `frontend`. Framework auto-detects **Vite**
   (Build `npm run build`, Output `dist`).
3. **Environment Variables** — add before the first build:

   | Key | Value | Environments |
   |-----|-------|--------------|
   | `VITE_API_BASE_URL` | *(your Render URL from B.6)* | Production, Preview, Development |

4. **Deploy.** Copy the production URL, e.g.
   `https://customer-purchase-analytics.vercel.app`.

CLI alternative (if you prefer): `cd frontend; vercel login; vercel --prod`,
then set `VITE_API_BASE_URL` in the dashboard and redeploy.

---

## D. Wire CORS + final end-to-end check  (~5 min)

1. Render → your service → **Environment** → edit `ALLOWED_ORIGINS` to your exact
   Vercel URL (no trailing slash): `https://customer-purchase-analytics.vercel.app`
   → Save (Render auto-redeploys, ~2 min).
2. Open the Vercel URL and verify:
   - Dashboard `/` → Total Revenue **₹5,55,627.50**, 7 customers / 8 products / 35 orders
   - `/customers` 7 rows · `/products` 8 · `/orders` 35
   - `/analytics` → Mega Report 35×45+, Charts render
   - `/sql-editor` runs a query; `DELETE FROM orders` → `OPERATION_BLOCKED`
   - DevTools (F12) → Network: API calls hit your Render URL, status 200, no CORS errors
3. Revenue integrity in the live SQL Editor:
   ```sql
   SELECT ROUND(SUM(quantity * unit_price * (1 - discount)), 2) AS total FROM orders;
   ```
   → `555627.50`

---

## Common fixes
- **CORS blocked** → `ALLOWED_ORIGINS` must equal the Vercel URL exactly (step D.1).
- **API calls go to `undefined/api/...`** → `VITE_API_BASE_URL` not set for Production; set it and redeploy.
- **`/analytics` 404 on refresh** → `frontend/vercel.json` SPA rewrite is committed; ensure Root Directory = `frontend`.
- **`ModuleNotFoundError: app`** → Render Root Directory must be `backend`.
- **500 on `/api/orders`** → `DATABASE_URL` wrong; copy the URI exactly from Supabase → Database.

**Working URL = the Vercel URL from step C.4 once D is complete.**
