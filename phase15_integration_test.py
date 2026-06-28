#!/usr/bin/env python3
"""
Phase 15 — One-Click Integration Test Suite
Customer Purchase Analytics — Full-Stack Integration

Runs every backend check from Phase 15.2 (Backend Integration Test Suite) and
Phase 15.3 (Final Audit Cross-Reference) against the running FastAPI backend and
prints a PASS/FAIL line for each, followed by a summary table.

Requirements:
    - Backend running:  uvicorn app.main:app --reload --port 8000
    - Database reachable (Supabase PostgreSQL — credentials in backend/.env)
    - Python 3.8+  (standard library only — no pip installs needed)

Usage (from the project root, in a second terminal while the backend runs):
    python phase15_integration_test.py
    python phase15_integration_test.py --base-url http://localhost:8000

Exit code: 0 if every test passes, otherwise the number of failed tests.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

DEFAULT_BASE_URL = "http://localhost:8000"
TIMEOUT_SECONDS = 30  # mega-report can take 2-4s; allow headroom

# ----------------------------------------------------------------------------
# Terminal colours (auto-disabled when output is not a TTY, e.g. piped to file)
# ----------------------------------------------------------------------------
_USE_COLOR = sys.stdout.isatty()


def _c(code: str, text: str) -> str:
    return f"\033[{code}m{text}\033[0m" if _USE_COLOR else text


def green(t: str) -> str:
    return _c("92", t)


def red(t: str) -> str:
    return _c("91", t)


def yellow(t: str) -> str:
    return _c("93", t)


def cyan(t: str) -> str:
    return _c("96", t)


def bold(t: str) -> str:
    return _c("1", t)


# ----------------------------------------------------------------------------
# Result tracking
# ----------------------------------------------------------------------------
RESULTS: list[tuple[str, bool, str]] = []  # (label, passed, detail)


def record(label: str, passed: bool, detail: str = "") -> None:
    RESULTS.append((label, passed, detail))
    tag = green("PASS") if passed else red("FAIL")
    line = f"  [{tag}] {label}"
    if detail:
        line += f"  {yellow('→ ' + detail)}" if not passed else f"  ({detail})"
    print(line)


# ----------------------------------------------------------------------------
# HTTP helper — returns (status_code, parsed_json_or_None, raw_text)
# ----------------------------------------------------------------------------
def get(base_url: str, path: str):
    url = base_url.rstrip("/") + path
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            raw = resp.read().decode("utf-8")
            status = resp.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        status = e.code
    except Exception as e:  # noqa: BLE001 — surface connection problems as a clear failure
        return None, None, f"REQUEST FAILED: {type(e).__name__}: {e}"
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = None
    return status, parsed, raw


def approx(a: float, b: float, tol: float = 0.01) -> bool:
    return abs(float(a) - float(b)) <= tol


# ----------------------------------------------------------------------------
# Test sections
# ----------------------------------------------------------------------------
def test_health(base: str) -> None:
    print(cyan("\n── Health Checks ──"))

    status, data, raw = get(base, "/")
    if data is None:
        record("GET /  reachable", False, raw)
    else:
        ok = status == 200 and data.get("status") == "ok" and data.get("version") == "1.0.0"
        record("GET /  → status ok, version 1.0.0", ok, f"HTTP {status}")

    status, data, raw = get(base, "/health")
    if data is None:
        record("GET /health  reachable", False, raw)
    else:
        ds = data.get("dataset", {})
        ok = (
            status == 200
            and ds.get("customers") == 7
            and ds.get("products") == 8
            and ds.get("orders") == 35
            and approx(ds.get("total_revenue_inr", 0), 555627.50)
        )
        record("GET /health  → 7/8/35, revenue 555627.50", ok, f"dataset={ds}")


def test_customers(base: str) -> None:
    print(cyan("\n── Customer Endpoints ──"))

    status, data, raw = get(base, "/api/customers")
    if isinstance(data, list):
        record("GET /api/customers  → count 7", len(data) == 7, f"count={len(data)}")
    else:
        record("GET /api/customers  → count 7", False, raw)

    status, data, raw = get(base, "/api/customers/1")
    if isinstance(data, dict):
        ok = data.get("customer_name") == "Aanya Sharma" and data.get("city") == "Mumbai"
        record("GET /api/customers/1  → Aanya Sharma, Mumbai", ok,
               f"{data.get('customer_name')}, {data.get('city')}")
    else:
        record("GET /api/customers/1  → Aanya Sharma, Mumbai", False, raw)

    status, data, raw = get(base, "/api/customers/99")
    record("GET /api/customers/99  → HTTP 404 not found", status == 404, f"HTTP {status}")


def test_products(base: str) -> None:
    print(cyan("\n── Product Endpoints ──"))

    status, data, raw = get(base, "/api/products")
    if isinstance(data, list):
        record("GET /api/products  → count 8", len(data) == 8, f"count={len(data)}")
    else:
        record("GET /api/products  → count 8", False, raw)

    for category, expected in (("Electronics", 3), ("Apparel", 3), ("Appliances", 2)):
        status, data, raw = get(base, f"/api/products/category/{category}")
        if isinstance(data, list):
            record(f"GET /api/products/category/{category}  → count {expected}",
                   len(data) == expected, f"count={len(data)}")
        else:
            record(f"GET /api/products/category/{category}  → count {expected}", False, raw)


def test_orders(base: str) -> None:
    print(cyan("\n── Order Endpoints ──"))

    status, data, raw = get(base, "/api/orders")
    if isinstance(data, list):
        record("GET /api/orders  → count 35", len(data) == 35, f"count={len(data)}")

        first_amount = data[0].get("order_amount") if data else None
        record("GET /api/orders  → order_amount present & numeric on row 0",
               first_amount is not None and _is_number(first_amount),
               f"order_amount={first_amount}")

        try:
            total = sum(float(o["order_amount"]) for o in data)
            record("Σ order_amount  → 555627.50 (Phase 10 Audit 3)",
                   approx(total, 555627.50), f"total={total:.2f}")
        except (KeyError, TypeError, ValueError) as e:
            record("Σ order_amount  → 555627.50 (Phase 10 Audit 3)", False, str(e))
    else:
        record("GET /api/orders  → count 35", False, raw)

    status, data, raw = get(base, "/api/orders/customer/1")
    if isinstance(data, list):
        # Dataset note (15.2): Aanya has 5 or 6 orders depending on dataset revision.
        record("GET /api/orders/customer/1  → count 5 or 6", len(data) in (5, 6),
               f"count={len(data)}")
    else:
        record("GET /api/orders/customer/1  → count 5 or 6", False, raw)


def _is_number(v) -> bool:
    try:
        float(v)
        return True
    except (TypeError, ValueError):
        return False


def test_analytics(base: str) -> None:
    print(cyan("\n── Analytics Endpoints ──"))

    status, data, raw = get(base, "/api/analytics/dashboard")
    if isinstance(data, dict):
        ok = (
            approx(data.get("total_revenue", 0), 555627.50)
            and int(data.get("total_customers", 0)) == 7
            and int(data.get("total_orders", 0)) == 35
        )
        record("GET /api/analytics/dashboard  → revenue/customers/orders",
               ok, f"rev={data.get('total_revenue')} cust={data.get('total_customers')} ord={data.get('total_orders')}")
    else:
        record("GET /api/analytics/dashboard", False, raw)

    # Segmentation — 7 rows, 4 segments with the expected distribution
    status, data, raw = get(base, "/api/analytics/segmentation")
    if isinstance(data, dict) and isinstance(data.get("data"), list):
        rows = data["data"]
        record("GET /api/analytics/segmentation  → row_count 7",
               data.get("row_count") == 7 and len(rows) == 7, f"row_count={data.get('row_count')}")
        seg_counts: dict[str, int] = {}
        for r in rows:
            seg_counts[r.get("segment")] = seg_counts.get(r.get("segment"), 0) + 1
        expected = {"Platinum": 2, "Gold": 2, "Silver": 2, "Bronze": 1}
        record("segmentation  → Platinum×2, Gold×2, Silver×2, Bronze×1",
               seg_counts == expected, f"{seg_counts}")
    else:
        record("GET /api/analytics/segmentation", False, raw)

    status, data, raw = get(base, "/api/analytics/ranking")
    if isinstance(data, dict):
        record("GET /api/analytics/ranking  → row_count 7",
               data.get("row_count") == 7, f"row_count={data.get('row_count')}")
    else:
        record("GET /api/analytics/ranking", False, raw)

    status, data, raw = get(base, "/api/analytics/product-insights")
    if isinstance(data, dict):
        record("GET /api/analytics/product-insights  → row_count 8",
               data.get("row_count") == 8, f"row_count={data.get('row_count')}")
    else:
        record("GET /api/analytics/product-insights", False, raw)

    # Mega Report — the critical Req #43 check
    status, data, raw = get(base, "/api/analytics/mega-report")
    if isinstance(data, dict):
        record(bold("GET /api/analytics/mega-report  → row_count 35 (CRITICAL)"),
               data.get("row_count") == 35, f"row_count={data.get('row_count')}")
    else:
        record(bold("GET /api/analytics/mega-report  → row_count 35 (CRITICAL)"), False, raw)


def test_audit_cross_reference(base: str) -> None:
    """Phase 15.3 — mirror the 5 Phase 10 SQL audits through the API layer."""
    print(cyan("\n── Final Audit Cross-Reference (Phase 10 ↔ API) ──"))

    # Audit 1: mega-report row count = 35
    _, mega, _ = get(base, "/api/analytics/mega-report")
    record("Audit 1  → mega-report row_count = 35",
           isinstance(mega, dict) and mega.get("row_count") == 35,
           f"row_count={mega.get('row_count') if isinstance(mega, dict) else 'n/a'}")

    # Audit 2: no NULLs in core columns of the orders feed
    _, orders, _ = get(base, "/api/orders")
    if isinstance(orders, list) and orders:
        no_nulls = all(
            o.get("order_amount") is not None and o.get("customer_id") is not None
            for o in orders
        )
        record("Audit 2  → no NULLs in core order columns", no_nulls)
    else:
        record("Audit 2  → no NULLs in core order columns", False, "orders feed unavailable")

    # Audit 3: SUM(order_amount) = 555627.50 via dashboard
    _, dash, _ = get(base, "/api/analytics/dashboard")
    record("Audit 3  → dashboard total_revenue = 555627.50",
           isinstance(dash, dict) and approx(dash.get("total_revenue", 0), 555627.50),
           f"total_revenue={dash.get('total_revenue') if isinstance(dash, dict) else 'n/a'}")

    # Audit 4: all 4 segments present
    _, seg, _ = get(base, "/api/analytics/segmentation")
    if isinstance(seg, dict) and isinstance(seg.get("data"), list):
        segs = {r.get("segment") for r in seg["data"]}
        record("Audit 4  → 4 segments present (Platinum/Gold/Silver/Bronze)",
               {"Platinum", "Gold", "Silver", "Bronze"} <= segs, f"{sorted(segs)}")
    else:
        record("Audit 4  → 4 segments present", False, "segmentation unavailable")

    # Audit 5: 7 NULLs in previous_order_date (one first-purchase per customer)
    if isinstance(mega, dict) and isinstance(mega.get("data"), list):
        rows = mega["data"]
        if rows and "previous_order_date" in rows[0]:
            null_prev = sum(1 for r in rows if r.get("previous_order_date") is None)
            record("Audit 5  → 7 NULLs in previous_order_date (LAG first-purchase)",
                   null_prev == 7, f"nulls={null_prev}")
        else:
            record("Audit 5  → previous_order_date column present", False,
                   "column not found in mega-report rows")
    else:
        record("Audit 5  → 7 NULLs in previous_order_date", False, "mega-report unavailable")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 15 integration test suite")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL,
                        help=f"Backend base URL (default {DEFAULT_BASE_URL})")
    args = parser.parse_args()
    base = args.base_url

    print(bold(cyan("\n╔══════════════════════════════════════════════════════════╗")))
    print(bold(cyan("║   Phase 15 — Integration Test Suite                      ║")))
    print(bold(cyan("║   Customer Purchase Analytics — Full-Stack Integration   ║")))
    print(bold(cyan("╚══════════════════════════════════════════════════════════╝")))
    print(f"  Target backend: {bold(base)}")

    # Fail fast with a friendly message if the backend isn't up
    status, _, raw = get(base, "/")
    if status is None:
        print(red("\n  Backend is not reachable. Start it first:\n"))
        print("    cd backend")
        print("    .venv\\Scripts\\Activate.ps1      # Windows PowerShell")
        print("    uvicorn app.main:app --reload --port 8000\n")
        print(red(f"  ({raw})"))
        return 1

    test_health(base)
    test_customers(base)
    test_products(base)
    test_orders(base)
    test_analytics(base)
    test_audit_cross_reference(base)

    # Summary
    passed = sum(1 for _, ok, _ in RESULTS if ok)
    failed = len(RESULTS) - passed
    print(bold(cyan("\n────────────────────────── Summary ──────────────────────────")))
    print(f"  Total checks: {len(RESULTS)}    {green(f'Passed: {passed}')}    "
          f"{red(f'Failed: {failed}') if failed else green('Failed: 0')}")

    if failed:
        print(red("\n  Failed checks:"))
        for label, ok, detail in RESULTS:
            if not ok:
                print(red(f"    • {label}") + (f"  ({detail})" if detail else ""))
        print(red(f"\n  RESULT: {failed} check(s) failed.\n"))
    else:
        print(green(bold("\n  RESULT: ALL CHECKS PASSED ✅  Phase 15 backend suite is green.\n")))

    return failed


if __name__ == "__main__":
    sys.exit(main())
