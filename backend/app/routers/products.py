from fastapi import APIRouter, HTTPException
from app.database import get_supabase_client
from app.models.schemas import ProductOut

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=list[ProductOut])
def list_products():
    """
    Returns all 8 products.
    Uses supabase-py client.
    """
    try:
        supabase = get_supabase_client()
        response = supabase.table("products").select("*").order("product_id").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@router.get("/category/{category}", response_model=list[ProductOut])
def list_products_by_category(category: str):
    """
    Returns products filtered by category.
    Valid categories: Electronics, Apparel, Appliances
    """
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("products")
            .select("*")
            .eq("category", category)
            .order("product_id")
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch products by category: {str(e)}"
        )
