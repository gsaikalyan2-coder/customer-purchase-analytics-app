from fastapi import APIRouter, HTTPException
from app.database import execute_raw_query
from app.models.schemas import OrderOut

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# order_amount is always calculated (ROUND(quantity * unit_price * (1 - discount), 2))
# It is never stored in the orders table — this is intentional (see project design decisions).
# We use psycopg2 / raw SQL here to calculate order_amount at query time.

_ORDERS_WITH_AMOUNT_SQL = """
    SELECT
        o.order_id,
        o.customer_id,
        c.customer_name,
        o.product_id,
        p.product_name,
        p.category,
        o.order_date,
        o.quantity,
        o.unit_price,
        o.discount,
        ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN products  p ON o.product_id  = p.product_id
    ORDER BY o.order_date, o.order_id;
"""


@router.get("/", response_model=list[OrderOut])
def list_orders():
    """
    Returns all 35 orders with calculated order_amount.
    Uses psycopg2 because order_amount is calculated (ROUND formula), not stored.
    """
    try:
        rows = execute_raw_query(_ORDERS_WITH_AMOUNT_SQL)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")


@router.get("/customer/{customer_id}", response_model=list[OrderOut])
def list_orders_by_customer(customer_id: int):
    """
    Returns all orders for a specific customer, with calculated order_amount.
    """
    sql = """
        SELECT
            o.order_id,
            o.customer_id,
            c.customer_name,
            o.product_id,
            p.product_name,
            p.category,
            o.order_date,
            o.quantity,
            o.unit_price,
            o.discount,
            ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
        FROM orders o
        INNER JOIN customers c ON o.customer_id = c.customer_id
        INNER JOIN products  p ON o.product_id  = p.product_id
        WHERE o.customer_id = %s
        ORDER BY o.order_date;
    """
    try:
        rows = execute_raw_query(sql, (customer_id,))
        return rows
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch orders for customer {customer_id}: {str(e)}"
        )
