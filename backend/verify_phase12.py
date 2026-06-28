"""
Phase 12 verification script.
Run with the backend server already running on http://localhost:8000:

    python verify_phase12.py

Uses only the Python standard library (no extra installs).
Prints PASS/FAIL for every Phase 12.11 checklist item and exits 0 only if all pass.
"""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://localhost:8000"
results = []


def get(path):
    url = BASE + path
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def check(name, fn):
    try:
        ok, detail = fn()
    except urllib.error.HTTPError as e:
        ok, detail = False, f"HTTP {e.code} {e.reason}"
    except Exception as e:
        ok, detail = False, f"{type(e).__name__}: {e}"
    results.append((ok, name, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name} — {detail}")


def c_health():
    s, d = get("/health")
    return s == 200 and d.get("status") == "healthy", f"status={d.get('status')}"


def c_customers():
    s, d = get("/api/customers/")
    return s == 200 and len(d) == 7, f"count={len(d)} (expected 7)"


def c_customer_1():
    s, d = get("/api/customers/1")
    name, city = d.get("customer_name"), d.get("city")
    return name == "Aanya Sharma" and city == "Mumbai", f"{name}, {city}"


def c_products():
    s, d = get("/api/products/")
    return s == 200 and len(d) == 8, f"count={len(d)} (expected 8)"


def c_products_electronics():
    s, d = get("/api/products/category/Electronics")
    return len(d) == 3, f"count={len(d)} (expected 3)"


def c_orders():
    s, d = get("/api/orders/")
    count_ok = len(d) == 35
    no_null = all(r.get("order_amount") is not None for r in d)
    return count_ok and no_null, f"count={len(d)} (expected 35), no_null_amount={no_null}"


def c_orders_customer_1():
    s, d = get("/api/orders/customer/1")
    return s == 200 and len(d) > 0, f"count={len(d)} (expected > 0)"


def c_dashboard():
    s, d = get("/api/analytics/dashboard")
    rev = float(d.get("total_revenue"))
    return abs(rev - 555627.50) < 0.01, f"total_revenue={rev} (expected 555627.50)"


def c_segmentation():
    s, d = get("/api/analytics/segmentation")
    rows = d.get("data", [])
    segs = [r.get("segment") for r in rows]
    expected = ["Platinum", "Platinum", "Gold", "Gold", "Silver", "Silver", "Bronze"]
    return d.get("row_count") == 7 and segs == expected, f"row_count={d.get('row_count')}, segments={segs}"


def c_ranking():
    s, d = get("/api/analytics/ranking")
    return d.get("row_count") == 7, f"row_count={d.get('row_count')} (expected 7)"


def c_product_insights():
    s, d = get("/api/analytics/product-insights")
    return d.get("row_count") == 8, f"row_count={d.get('row_count')} (expected 8)"


print("=" * 60)
print("Phase 12 Backend Verification")
print("=" * 60)
check("1. /health reachable", c_health)
check("2. /api/customers returns 7", c_customers)
check("3. /api/customers/1 = Aanya Sharma, Mumbai", c_customer_1)
check("4. /api/products returns 8", c_products)
check("5. /api/products/category/Electronics returns 3", c_products_electronics)
check("6. /api/orders returns 35 with order_amount", c_orders)
check("7. /api/orders/customer/1 returns rows", c_orders_customer_1)
check("8. /api/analytics/dashboard total_revenue=555627.50", c_dashboard)
check("9. /api/analytics/segmentation 7 rows + tiers", c_segmentation)
check("10. /api/analytics/ranking returns 7", c_ranking)
check("11. /api/analytics/product-insights returns 8", c_product_insights)

print("=" * 60)
passed = sum(1 for ok, _, _ in results if ok)
total = len(results)
print(f"RESULT: {passed}/{total} checks passed")
if passed == total:
    print("✅ Phase 12 fully verified — all endpoints return correct live data.")
    sys.exit(0)
else:
    print("❌ Some checks failed. See FAIL lines above.")
    sys.exit(1)
