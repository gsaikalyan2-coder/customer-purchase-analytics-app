"""
Req #43 — Mega Report SQL Query
Covers: M1 (Purchase Journey), M2 (Spending Analytics), M3 (Ranking),
        M4 (Category Analysis), M5 (Revenue Contribution), M6 (Segmentation),
        M7 (Moving Analytics), M8 (Purchase Patterns)

Excluded: M9 (Product Insights), M10 (Bonus) — both filter rows and are
          incompatible with the one-row-per-order constraint (35 rows).

Returns: 35 rows × 45+ columns
Verified: Phase 10 audits — row count = 35, no NULL in core columns,
          SUM(order_amount) = 555627.50, all customer segments present.
"""

MEGA_REPORT_SQL = """
WITH base AS (
    SELECT
        o.order_id,
        o.customer_id,
        c.customer_name,
        c.city,
        c.signup_date,
        o.product_id,
        p.product_name,
        p.category,
        p.brand,
        o.order_date,
        o.quantity,
        o.unit_price,
        o.discount,
        ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN products  p ON o.product_id  = p.product_id
),

customer_totals AS (
    SELECT
        customer_id,
        city,
        ROUND(SUM(order_amount), 2) AS total_spending
    FROM base
    GROUP BY customer_id, city
),

customer_segments AS (
    SELECT
        customer_id,
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

SELECT
    -- ── Identity Columns ──────────────────────────────────────
    b.order_id,
    b.customer_id,
    b.customer_name,
    b.city,
    b.signup_date,
    b.product_id,
    b.product_name,
    b.category,
    b.brand,
    b.order_date,
    b.quantity,
    b.unit_price,
    b.discount,
    b.order_amount,

    -- ── M1: Purchase Journey ──────────────────────────────────
    ROW_NUMBER() OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS purchase_sequence,

    FIRST_VALUE(b.order_date) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS first_purchase_date,

    LAST_VALUE(b.order_date) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS latest_purchase_date,

    LAG(b.order_date, 1) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS previous_order_date,

    LEAD(b.order_date, 1) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS next_order_date,

    b.order_date - LAG(b.order_date, 1) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS days_since_last_order,

    -- ── M2: Spending Analytics ────────────────────────────────
    SUM(b.order_amount) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total_spend,

    AVG(b.order_amount) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_avg_spend,

    MAX(b.order_amount) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_max_spend,

    MIN(b.order_amount) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_min_spend,

    SUM(b.order_amount) OVER (
        PARTITION BY b.customer_id
    ) AS lifetime_total_spend,

    AVG(b.order_amount) OVER (
        PARTITION BY b.customer_id
    ) AS lifetime_avg_spend,

    -- ── M3: Customer Ranking (by city, lifetime spend) ────────
    ROW_NUMBER() OVER (
        PARTITION BY ct.city ORDER BY ct.total_spending DESC
    ) AS city_row_number,

    RANK() OVER (
        PARTITION BY ct.city ORDER BY ct.total_spending DESC
    ) AS city_rank,

    DENSE_RANK() OVER (
        PARTITION BY ct.city ORDER BY ct.total_spending DESC
    ) AS city_dense_rank,

    ROUND(
        PERCENT_RANK() OVER (
            PARTITION BY ct.city ORDER BY ct.total_spending DESC
        )::NUMERIC, 4
    ) AS city_percent_rank,

    ROUND(
        CUME_DIST() OVER (
            PARTITION BY ct.city ORDER BY ct.total_spending DESC
        )::NUMERIC, 4
    ) AS city_cume_dist,

    -- ── M4: Category Analysis ─────────────────────────────────
    SUM(b.order_amount) OVER (
        PARTITION BY b.customer_id, b.category ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS category_running_total,

    MAX(b.order_amount) OVER (
        PARTITION BY b.customer_id, b.category ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS category_running_max,

    MIN(b.order_amount) OVER (
        PARTITION BY b.customer_id, b.category ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS category_running_min,

    LAST_VALUE(b.order_amount) OVER (
        PARTITION BY b.customer_id, b.category ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS category_last_order_amount,

    -- ── M5: Revenue Contribution ──────────────────────────────
    ROUND(
        b.order_amount / NULLIF(SUM(b.order_amount) OVER (PARTITION BY b.customer_id), 0) * 100, 2
    ) AS pct_of_customer_spend,

    ROUND(
        b.order_amount / NULLIF(SUM(b.order_amount) OVER (PARTITION BY b.category), 0) * 100, 2
    ) AS pct_of_category_revenue,

    ROUND(
        b.order_amount / NULLIF(SUM(b.order_amount) OVER (), 0) * 100, 4
    ) AS pct_of_company_revenue,

    -- ── M6: Segmentation ──────────────────────────────────────
    cs.quartile,
    cs.segment,

    -- ── M7: Moving Analytics ──────────────────────────────────
    ROUND(
        AVG(b.order_amount) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 2
    ) AS moving_avg_3,

    ROUND(
        AVG(b.order_amount) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ), 2
    ) AS moving_avg_5,

    ROUND(
        SUM(b.order_amount) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
            ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
        ), 2
    ) AS surrounding_3_sum,

    SUM(b.order_amount) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rolling_revenue,

    -- ── M8: Purchase Patterns ─────────────────────────────────
    LAG(b.order_amount, 1) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS previous_order_amount,

    LEAD(b.order_amount, 1) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS next_order_amount,

    b.order_amount - LAG(b.order_amount, 1) OVER (
        PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
    ) AS spend_difference,

    ROUND(
        (b.order_amount - LAG(b.order_amount, 1) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        )) / NULLIF(
            LAG(b.order_amount, 1) OVER (
                PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
            ), 0
        ) * 100, 2
    ) AS spend_change_pct,

    CASE
        WHEN LAG(b.order_amount, 1) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ) IS NULL THEN 'First Purchase'
        WHEN b.order_amount > LAG(b.order_amount, 1) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ) THEN 'Higher'
        WHEN b.order_amount < LAG(b.order_amount, 1) OVER (
            PARTITION BY b.customer_id ORDER BY b.order_date, b.order_id
        ) THEN 'Lower'
        ELSE 'Same'
    END AS spend_trend

FROM base b
INNER JOIN customer_totals  ct ON b.customer_id = ct.customer_id
INNER JOIN customer_segments cs ON b.customer_id = cs.customer_id
ORDER BY b.customer_id, b.order_date, b.order_id;
"""
