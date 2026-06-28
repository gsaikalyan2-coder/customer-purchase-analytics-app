from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal


# ─────────────────────────────────────────────
# Customer Schemas
# ─────────────────────────────────────────────
class CustomerOut(BaseModel):
    customer_id: int
    customer_name: str
    city: str
    signup_date: date

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Product Schemas
# ─────────────────────────────────────────────
class ProductOut(BaseModel):
    product_id: int
    product_name: str
    category: str
    brand: str

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Order Schemas
# ─────────────────────────────────────────────
class OrderOut(BaseModel):
    order_id: int
    customer_id: int
    customer_name: Optional[str] = None
    product_id: int
    product_name: Optional[str] = None
    category: Optional[str] = None
    order_date: date
    quantity: int
    unit_price: Decimal
    discount: Decimal
    order_amount: Optional[Decimal] = None  # Calculated field, not stored

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Analytics / Window Function Schemas
# ─────────────────────────────────────────────
class AnalyticsModuleOut(BaseModel):
    """Generic container for any window function query result."""
    module: str
    description: str
    row_count: int
    data: list[dict]


class DashboardSummaryOut(BaseModel):
    total_revenue: Decimal
    total_customers: int
    total_products: int
    total_orders: int
    avg_order_value: Decimal
    top_city: str
    top_category: str


# -----------------------------------------------
# SQL Editor Schemas (Phase 14.75)
# -----------------------------------------------
class SqlExecuteRequest(BaseModel):
    sql: str

    class Config:
        json_schema_extra = {
            "example": {
                "sql": "SELECT * FROM customers ORDER BY customer_id;"
            }
        }


class SqlExecuteResponse(BaseModel):
    status: str                           # "success" | "error"
    row_count: Optional[int] = None
    columns: Optional[list[str]] = None
    rows: Optional[list[dict]] = None
    duration_ms: int
    query_type: Optional[str] = None
    truncated: bool = False
    truncated_at: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    hint: Optional[str] = None

    truncated: bool = False
    truncated_at: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    hint: Optional[str] = None


# -----------------------------------------------
# AI Query Suggestion Schemas (Phase 14.8)
# -----------------------------------------------
class AiSuggestRequest(BaseModel):
    intent: str

    class Config:
        json_schema_extra = {
            "example": {"intent": "show running totals per customer by order date"}
        }


class AiSuggestDebug(BaseModel):
    prompt: Optional[str] = None


class AiSuggestResponse(BaseModel):
    status: str                          # "success" | "error"
    sql: Optional[str] = None
    model: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    debug: Optional[AiSuggestDebug] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    hint: Optional[str] = None
