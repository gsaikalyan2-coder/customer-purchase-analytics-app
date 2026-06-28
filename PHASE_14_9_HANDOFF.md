# Phase 14.9 — Time-Series Charts — Handoff

**Status:** ✅ Implemented (as-built documentation)
**Project:** Customer Purchase Analytics — Full-Stack Integration
**Author:** Saikalyan G · Incedo Inc. Internship Task 2
**Design system:** DESIGN-voltagent.md + Material-3 motion/shape tokens (chart toolbar)
**Stack:** FastAPI (Python) + React 18 (Vite) + Supabase PostgreSQL 17.6 + Recharts 3.9
**Sits between:** Phase 14.8 (AI Suggestions) → **Phase 14.9 (Charts)** → Phase 15 (Final Testing)

---

## 0. Summary

Phase 14.9 adds an interactive **Charts** view to the Analytics page, turning the M7 moving-
average and cumulative-revenue window-function results into three Recharts time-series
visualizations. It appears as a fifth tab in the existing Analytics module selector; selecting it
swaps the data-table panel for the chart layer.

---

## 1. Where to find it

Navbar → **Analytics** (`/analytics`) → click the **📈 Charts** card in the module selector
(alongside M6 Segmentation, M3 Ranking, M9 Product Insights, Req #43 Mega Report). The other four
tabs render data tables; **Charts** is the only one that renders graphs.

---

## 2. File Inventory

### New files

| File | Purpose |
|------|---------|
| `frontend/src/hooks/useChartData.js` | Parallel fetch of the two chart endpoints |
| `frontend/src/components/charts/ChartContainer.jsx` | Shared card wrapper (title, subtitle, controls slot) |
| `frontend/src/components/charts/chartTheme.js` | `CUSTOMER_COLORS`, `CUSTOMER_NAMES`, `CHART_THEME`, `MOVING_AVG_COLORS`, `M3` tokens, `formatINR`, `formatDate` |
| `frontend/src/components/charts/MovingAveragesChart.jsx` | Recharts `LineChart` — M7 3-order & 5-order moving averages |
| `frontend/src/components/charts/RevenueTimelineChart.jsx` | Recharts `AreaChart` — cumulative revenue per customer |
| `frontend/src/components/charts/OrderTimelineChart.jsx` | Order-amount timeline — click a customer to show/hide |

### Modified files

| File | Change |
|------|--------|
| `frontend/src/pages/Analytics.jsx` | Added the **Charts** module tab; renders the 3 charts + an M3 tonal **Refresh** button; passes `null` to `useAnalytics` when Charts is active so no table fetch fires |
| `frontend/package.json` | `recharts: ^3.9.0` |

> Backend: no new endpoints were added for this phase — the charts consume two existing analytics
> routes (see §4).

---

## 3. The three charts

| Component | Recharts type | Title | Data |
|-----------|---------------|-------|------|
| `MovingAveragesChart` | `LineChart` | "M7 — Moving Averages" | 3-order & 5-order moving averages of order amounts; per-customer selector |
| `RevenueTimelineChart` | `AreaChart` | "Cumulative Revenue Timeline" | Running total spend per customer (Jan–Jun 2024), overlaid semi-transparent areas |
| `OrderTimelineChart` | line/area timeline | "Order Amount Timeline" | Individual order values by date; click a customer in the legend to toggle |

All three are wrapped in `ChartContainer` for consistent card chrome, and share colours/formatters
from `chartTheme.js` (`formatINR` for ₹ axis labels, `formatDate` for the x-axis).

---

## 4. Data flow

```
Analytics.jsx (Charts tab)
   └─ useChartData()  → Promise.all([
        GET /api/analytics/moving-analytics   → movingData   (M7, 35 rows; optional ?customer_id)
        GET /api/analytics/revenue-timeline   → revenueData  (cumulative running total, 35 rows)
      ])
   ├─ MovingAveragesChart   ← movingData (+ selectedCustomerId)
   ├─ RevenueTimelineChart  ← revenueData
   └─ OrderTimelineChart    ← revenueData
```

Both endpoints return `{ "status": "success", "row_count": N, "data": [...] }`. `moving-analytics`
computes `moving_avg_3`, `moving_avg_5`, and `rolling_revenue` via window frames; `revenue-timeline`
computes a `running_total` per customer with product/category for tooltips. Dataset: 7 customers,
35 orders.

---

## 5. Dependency notes (important)

- **Recharts 3.9** pulls in `es-toolkit` as a transitive dependency. A partial/interrupted
  `npm install` can leave `node_modules/es-toolkit/dist` missing its `function/`, `util/`, `math/`
  folders, which surfaces as `[UNRESOLVED_IMPORT] Could not resolve '../util/toPath.mjs'` when the
  Charts/Analytics page triggers Vite's optimizer. Fix: clean reinstall
  (`Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json; npm install`).
- The project runs **Vite 8 (Rolldown)**, which is stricter about deep `.mjs` resolution than the
  old esbuild optimizer. If a clean reinstall doesn't clear the es-toolkit errors, pin Vite to the
  stable 7.x line as a fallback.

---

## 6. Failure mode

The Charts tab needs both the backend running **and** the database reachable (it hits live analytics
endpoints). If the DB is unreachable, the charts show the `ErrorBanner` "Failed to load data" state
(now a fast, clear message after the Phase 15 `connect_timeout` change) with a **Retry** button wired
to `refetchCharts`.

---

## 7. Verification

- Analytics → **Charts** tab renders three charts without console errors.
- Moving Averages: switching the customer selector re-plots the 3-order/5-order lines.
- Revenue Timeline: overlaid areas, one per customer, ascending cumulative totals.
- Order Timeline: clicking a customer toggles their series.
- **Refresh** re-fetches both endpoints.

---

*Phase 14.9 — Time-Series Charts · Customer Purchase Analytics · Saikalyan G · Incedo Inc.*
