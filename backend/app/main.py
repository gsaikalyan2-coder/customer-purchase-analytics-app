from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS, validate_config
from app.routers import customers, products, orders, analytics, sql_editor, ai_suggest

# Validate environment variables on startup
validate_config()

app = FastAPI(
    title="Customer Purchase Analytics API",
    description=(
        "REST API for the Customer Purchase Analytics project. "
        "Exposes SQL window function results (M1-M10, Req #43 Mega Report) "
        "from a Supabase PostgreSQL database via FastAPI."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - allow React frontend (localhost:5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # POST added for SQL Editor (/api/sql/execute) - Phase 14.75
    allow_headers=["*"],
)

# Register routers
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(analytics.router)
app.include_router(sql_editor.router)     # NEW (Phase 14.75)
app.include_router(ai_suggest.router)      # NEW (Phase 14.8)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint. Confirms the API is running."""
    return {
        "status": "ok",
        "message": "Customer Purchase Analytics API is running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def detailed_health():
    """Detailed health check with API metadata."""
    return {
        "status": "healthy",
        "project": "Customer Purchase Analytics",
        "database": "Supabase PostgreSQL 17.6",
        "project_id": "ahoqabjdshigaqduiyou",
        "region": "ap-south-1 (Mumbai)",
        "dataset": {
            "customers": 7,
            "products": 8,
            "orders": 35,
            "total_revenue_inr": 555627.50,
        },
    }
