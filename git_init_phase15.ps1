<#
  Phase 15.5 — Git Repository Initialization + First Commit
  Customer Purchase Analytics — Full-Stack Integration

  Run this ONCE from the project root on your Windows machine:

      cd C:\Users\saika\Downloads\customer-purchase-analytics-app
      powershell -ExecutionPolicy Bypass -File .\git_init_phase15.ps1

  Why a script (and not done for you): the cloud sandbox mounts this folder over a
  filesystem that does not support git's lock/rename writes, so `git init` corrupts
  .git/config there. Git must run on your native Windows filesystem. This script
  reproduces Phase 15.5 exactly, with a hard stop if any real .env would be staged.
#>

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root
Write-Host "Project root: $root`n" -ForegroundColor Cyan

# --- Step 0: guard against re-init -----------------------------------------
if (Test-Path ".git") {
    Write-Host "A .git directory already exists here. Aborting so existing history is not touched." -ForegroundColor Yellow
    Write-Host "If you want a fresh repo, delete .git first:  Remove-Item -Recurse -Force .git"
    exit 1
}

# --- Step 1: init -----------------------------------------------------------
git init | Out-Null
git branch -M main 2>$null
git config user.name  "Saikalyan G"
git config user.email "gsaikalyan2@gmail.com"
git config core.autocrlf true
Write-Host "[1/6] git init complete (branch: main)" -ForegroundColor Green

# --- Step 2: verify .env is ignored BEFORE staging --------------------------
Write-Host "`n[2/6] Verifying secrets are ignored..."
$envLeaks = git status --porcelain --untracked-files=all |
    ForEach-Object { ($_ -replace '^...','') } |
    Where-Object { $_ -match '(^|/)\.env$' }   # real .env, not .env.example
if ($envLeaks) {
    Write-Host "STOP: these .env files are NOT ignored:" -ForegroundColor Red
    $envLeaks | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host "Fix .gitignore before committing. Nothing was committed." -ForegroundColor Red
    exit 1
}
Write-Host "      OK - no real .env files are visible to git." -ForegroundColor Green

# --- Step 3: stage ----------------------------------------------------------
git add .
Write-Host "`n[3/6] Staged all files." -ForegroundColor Green

# --- Step 4: double-check the staged list for secrets / heavy dirs ----------
Write-Host "`n[4/6] Staged-file safety check..."
$staged = git diff --cached --name-only
$bad = $staged | Where-Object {
    $_ -match '(^|/)\.env$' -or
    $_ -match '(^|/)\.venv/' -or
    $_ -match '(^|/)node_modules/'
}
if ($bad) {
    Write-Host "STOP: disallowed paths are staged:" -ForegroundColor Red
    $bad | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host "Unstage them (git rm --cached <path>) and fix .gitignore. Nothing was committed." -ForegroundColor Red
    exit 1
}
Write-Host "      OK - no .env / .venv / node_modules staged." -ForegroundColor Green
Write-Host ("      $($staged.Count) files staged.") -ForegroundColor Green

# --- Step 5: commit ---------------------------------------------------------
$msgFile = Join-Path $env:TEMP "cpa_phase15_commit_msg.txt"
@'
feat: Phase 11-15 full-stack integration — FastAPI + React + Supabase

- Phase 11: Project scaffold, venv, Vite frontend, placeholder .env
- Phase 12: FastAPI backend — config, supabase-py CRUD, psycopg2 raw SQL,
            customers/products/orders/analytics routers, Pydantic schemas
- Phase 13: React frontend — Axios client, custom hooks, 5 page components,
            Navbar, LoadingSpinner, ErrorBanner, React Router
- Phase 14: Req #43 Mega Report — 35 rows x 45+ columns M1-M8 SQL,
            /api/analytics/mega-report endpoint, MegaReportTable component
- Phase 14.75: In-app SQL editor (SELECT/EXPLAIN/WITH guard), schema panel, history
- Phase 14.8: AI query suggestions (Claude Haiku) — NL -> SQL into the editor
- Phase 14.9: Time-series charts (Recharts) — moving averages, revenue timeline
- Phase 15: Integration tests, audit cross-reference, git init, VS Code workspace

Database: Supabase PostgreSQL 17.6 (ahoqabjdshigaqduiyou, ap-south-1)
Dataset: 7 customers, 8 products, 35 orders, total revenue INR 555627.50
Stack: FastAPI + uvicorn + supabase-py + psycopg2-binary + React 18 + Vite + Axios
'@ | Set-Content -Path $msgFile -Encoding UTF8

git commit -F $msgFile | Out-Null
Remove-Item $msgFile -Force
Write-Host "`n[5/6] Commit created." -ForegroundColor Green

# --- Step 6: confirm --------------------------------------------------------
Write-Host "`n[6/6] git log --oneline:" -ForegroundColor Green
git log --oneline
Write-Host "`nDone. Phase 15.5 git initialization complete." -ForegroundColor Cyan
