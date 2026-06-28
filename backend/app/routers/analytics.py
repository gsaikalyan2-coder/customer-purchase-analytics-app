from fastapi import APIRouter, HTTPException, Query as QueryParam
from app.database import execute_raw_query, get_supabase_client
from app.models.schemas import AnalyticsModuleOut, DashboardSummaryOut
from app.queries.req43_mega_report import MEGA_REPORT_SQL
from decimal import Decimal
from typing import Optional

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardSummaryOut)
def get_dashboard_summary():
    """
    Returns high-level KPI summary for the dashboard page.
    Total revenue: ₹5,55,627.50 (verified in Phase 10 audit).
    """
    sql = """
        SELECT
            ROUND(SUM(o.quantity * o.unit_price * (1 - o.discount)), 2) AS total_revenue,
            COUNT(DISTINCT o.customer_id)                                AS total_customers,
            COUNT(DISTINCT o.product_id)                                 AS total_products,
            COUNT(o.order_id)                                            AS total_orders,
            ROUND(AVG(o.quantity * o.unit_price * (1 - o.discount)), 2) AS avg_order_value,
            (
                SELECT c2.city
                FROM orders o2
                INNER JOIN customers c2 ON o2.customer_id = c2.customer_id
                GROUP BY c2.city
                ORDER BY SUM(o2.quantity * o2.unit_price * (1 - o2.discount)) DESC
                LIMIT 1
            )                                                            AS top_city,
            (
                SELECT p2.category
                FROM orders o3
                INNER JOIN products p2 ON o3.product_id = p2.product_id
                GROUP BY p2.category
                ORDER BY SUM(o3.quantity * o3.unit_price * (1 - o3.discount)) DESC
                LIMIT 1
            )                                                            AS top_category
        FROM orders o;
    """
    try:
        rows = execute_raw_query(sql)
        if not rows:
            raise HTTPException(status_code=500, detail="Dashboard query returned no rows")
        row = rows[0]
        return {
            "total_revenue": row["total_revenue"] or Decimal("0"),
            "total_customers": row["total_customers"] or 0,
            "total_products": row["total_products"] or 0,
            "total_orders": row["total_orders"] or 0,
            "avg_order_value": row["avg_order_value"] or Decimal("0"),
            "top_city": row["top_city"] or "N/A",
            "top_category": row["top_category"] or "N/A",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard query failed: {str(e)}")


@router.get("/segmentation", response_model=AnalyticsModuleOut)
def get_customer_segmentation():
    """
    M6 — Customer Segmentation via NTILE(4).
    Returns all 7 customers with their Platinum/Gold/Silver/Bronze segments.
    Uses customer_totals CTE (reduces 35 orders → 7 customer totals before NTILE).
    """
    sql = """
        WITH base AS (
            SELECT
                o.order_id,
                o.customer_id,
                c.customer_name,
                c.city,
                ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.customer_id
            INNER JOIN products  p ON o.product_id  = p.product_id
        ),
        customer_totals AS (
            SELECT
                customer_id,
                customer_name,
                city,
                ROUND(SUM(order_amount), 2) AS total_spending
            FROM base
            GROUP BY customer_id, customer_name, city
        ),
        customer_segments AS (
            SELECT
                customer_id,
                customer_name,
                city,
                total_spending,
                NTILE(4) OVER (ORDER BY total_spending DESC) AS quartile,
                CASE NTILE(4) OVER (ORDER BY total_spending DESC)
                    WHEN 1 THEN 'Platinum'
                    WHEN 2 THEN 'Gold'
                    WHEN 3 THEN 'Silver'
                    WHEN 4 THEN 'Bronze'
                END AS segment
            FROM customer_totals
        )
        SELECT *
        FROM customer_segments
        ORDER BY total_spending DESC;
    """
    try:
        rows = execute_raw_query(sql)
        return {
            "module": "M6",
            "description": "Customer Segmentation — NTILE(4) Platinum/Gold/Silver/Bronze",
            "row_count": len(rows),
            "data": rows,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation query failed: {str(e)}")


@router.get("/ranking", response_model=AnalyticsModuleOut)
def get_customer_ranking():
    """
    M3 — Customer Ranking by city using ROW_NUMBER, RANK, DENSE_RANK.
    Uses customer_totals CTE (35 orders → 7 customer lifetime totals → ranked by city).
    """
    sql = """
        WITH base AS (
            SELECT
                o.customer_id,
                c.customer_name,
                c.city,
                ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.customer_id
            INNER JOIN products  p ON o.product_id  = p.product_id
        ),
        customer_totals AS (
            SELECT
                customer_id,
                customer_name,
                city,
                ROUND(SUM(order_amount), 2) AS total_spending
            FROM base
            GROUP BY customer_id, customer_name, city
        )
        SELECT
            customer_id,
            customer_name,
            city,
            total_spending,
            ROW_NUMBER()  OVER (PARTITION BY city ORDER BY total_spending DESC) AS row_num,
            RANK()        OVER (PARTITION BY city ORDER BY total_spending DESC) AS rank_in_city,
            DENSE_RANK()  OVER (PARTITION BY city ORDER BY total_spending DESC) AS dense_rank_in_city,
            ROUND(
                PERCENT_RANK() OVER (PARTITION BY city ORDER BY total_spending DESC)::NUMERIC, 4
            ) AS percent_rank_in_city,
            ROUND(
                CUME_DIST()    OVER (PARTITION BY city ORDER BY total_spending DESC)::NUMERIC, 4
            ) AS cume_dist_in_city
        FROM customer_totals
        ORDER BY city, total_spending DESC;
    """
    try:
        rows = execute_raw_query(sql)
        return {
            "module": "M3",
            "description": "Customer Ranking by City — ROW_NUMBER, RANK, DENSE_RANK, PERCENT_RANK, CUME_DIST",
            "row_count": len(rows),
            "data": rows,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ranking query failed: {str(e)}")


@router.get("/product-insights", response_model=AnalyticsModuleOut)
def get_product_insights():
    """
    M9 — Product Insights: Top 3 and Bottom 3 per category via DENSE_RANK.
    Uses filter-on-window pattern (CTE first, then WHERE on rank).
    DENSE_RANK is used (not RANK) to avoid gap skipping on ties.
    """
    sql = """
        WITH base AS (
            SELECT
                o.order_id,
                o.customer_id,
                p.product_id,
                p.product_name,
                p.category,
                p.brand,
                ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.customer_id
            INNER JOIN products  p ON o.product_id  = p.product_id
        ),
        product_totals AS (
            SELECT
                product_id,
                product_name,
                category,
                brand,
                ROUND(SUM(order_amount), 2) AS total_revenue,
                COUNT(order_id)             AS order_count
            FROM base
            GROUP BY product_id, product_name, category, brand
        ),
        ranked AS (
            SELECT
                product_id,
                product_name,
                category,
                brand,
                total_revenue,
                order_count,
                DENSE_RANK() OVER (PARTITION BY category ORDER BY total_revenue DESC) AS rank_top,
                DENSE_RANK() OVER (PARTITION BY category ORDER BY total_revenue ASC)  AS rank_bottom
            FROM product_totals
        )
        SELECT
            product_id,
            product_name,
            category,
            brand,
            total_revenue,
            order_count,
            rank_top,
            rank_bottom,
            CASE
                WHEN rank_top    <= 3 THEN 'Top 3'
                WHEN rank_bottom <= 3 THEN 'Bottom 3'
                ELSE 'Mid'
            END AS performance_tier
        FROM ranked
        ORDER BY category, total_revenue DESC;
    """
    try:
        rows = execute_raw_query(sql)
        return {
            "module": "M9",
            "description": "Product Insights — DENSE_RANK Top 3 / Bottom 3 per Category",
            "row_count": len(rows),
            "data": rows,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product insights query failed: {str(e)}")


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


# ── Moving Analytics endpoint (M7) ────────────────────────────────────────────
@router.get("/moving-analytics")
def get_moving_analytics(customer_id: Optional[int] = QueryParam(default=None)):
    """
    M7 — Moving Averages (3-order, 5-order) and rolling revenue.
    Used by MovingAveragesChart.jsx in Phase 14.9.

    Optional query param: ?customer_id=1 to filter to one customer.
    Returns 35 rows (all customers) or fewer if filtered.
    customer_id is coerced to int by FastAPI, so direct interpolation is safe.
    """
    where_clause = f"WHERE o.customer_id = {customer_id}" if customer_id else ""

    sql = f"""
        WITH base AS (
            SELECT
                o.order_id,
                o.customer_id,
                c.customer_name,
                o.order_date,
                ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.customer_id
            INNER JOIN products  p ON o.product_id  = p.product_id
            {where_clause}
        )
        SELECT
            order_id,
            customer_id,
            customer_name,
            order_date::TEXT AS order_date,
            order_amount,
            ROUND(
                AVG(order_amount) OVER (
                    PARTITION BY customer_id ORDER BY order_date, order_id
                    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
                ), 2
            ) AS moving_avg_3,
            ROUND(
                AVG(order_amount) OVER (
                    PARTITION BY customer_id ORDER BY order_date, order_id
                    ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
                ), 2
            ) AS moving_avg_5,
            ROUND(
                SUM(order_amount) OVER (
                    PARTITION BY customer_id ORDER BY order_date, order_id
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ), 2
            ) AS rolling_revenue
        FROM base
        ORDER BY customer_id, order_date, order_id;
    """
    try:
        rows = execute_raw_query(sql)
        return {"status": "success", "row_count": len(rows), "data": rows}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Moving analytics query failed: {str(e)}")


# ── Revenue Timeline endpoint ──────────────────────────────────────────────────
@router.get("/revenue-timeline")
def get_revenue_timeline():
    """
    Cumulative running total per customer per order date.
    Used by RevenueTimelineChart.jsx and OrderTimelineChart.jsx in Phase 14.9.
    Returns all 35 rows across 7 customers, with product/category for tooltips.
    """
    sql = """
        WITH base AS (
            SELECT
                o.order_id,
                o.customer_id,
                c.customer_name,
                o.order_date,
                p.product_name,
                p.category,
                ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
            FROM orders o
            INNER JOIN customers c ON o.customer_id = c.customer_id
            INNER JOIN products  p ON o.product_id  = p.product_id
        )
        SELECT
            customer_id,
            customer_name,
            order_date::TEXT AS order_date,
            product_name,
            category,
            order_amount,
            ROUND(
                SUM(order_amount) OVER (
                    PARTITION BY customer_id ORDER BY order_date
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ), 2
            ) AS running_total
        FROM base
        ORDER BY customer_id, order_date;
    """
    try:
        rows = execute_raw_query(sql)
        return {"status": "success", "row_count": len(rows), "data": rows}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Revenue timeline query failed: {str(e)}")
