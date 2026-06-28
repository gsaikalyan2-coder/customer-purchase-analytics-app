# Customer Purchase Analytics — Full-Stack Application

**Internship:** Incedo Inc. — Task 2 Extension
**Author:** Saikalyan G
**Stack:** FastAPI + React (Vite) + Supabase PostgreSQL

## Project Summary

Full-stack web application exposing the Customer Purchase Analytics SQL window function
project (Phases 1–10) via a REST API and interactive React frontend.

- **Backend:** FastAPI with supabase-py (CRUD) + psycopg2-binary (window function queries)
- **Frontend:** React 18 + Vite + Axios + React Router
- **Database:** Supabase PostgreSQL 17.6 (Project: customer-purchase-analytics)

## Dataset
- 7 customers, 8 products, 35 orders
- Date range: Jan–Jun 2024
- Total revenue: ₹5,55,627.50

## Setup

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your Supabase credentials
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API Documentation
Once backend is running, visit: http://localhost:8000/docs
