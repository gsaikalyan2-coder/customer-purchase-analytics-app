from fastapi import APIRouter, HTTPException
from app.database import get_supabase_client
from app.models.schemas import CustomerOut

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("/", response_model=list[CustomerOut])
def list_customers():
    """
    Returns all 7 customers from the customers table.
    Uses supabase-py client (simple SELECT, no window functions needed).
    """
    try:
        supabase = get_supabase_client()
        response = supabase.table("customers").select("*").order("customer_id").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch customers: {str(e)}")


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int):
    """
    Returns a single customer by ID.
    """
    try:
        supabase = get_supabase_client()
        # NOTE: do NOT use .single() here — supabase-py raises a PostgREST error when
        # zero rows match, which the generic handler below would surface as HTTP 500.
        # Fetching a list and checking emptiness lets us return a clean 404 instead.
        response = (
            supabase.table("customers")
            .select("*")
            .eq("customer_id", customer_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch customer: {str(e)}")
