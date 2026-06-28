# Phase 14.9 — Time Series Chart Layer
## Recharts Visualisations for M7 Moving Averages and Revenue Trends
**Inserted between:** Phase 14.8 (AI Suggestions) → Phase 14.9 (Time Series) → Phase 15 (Final Testing)**
**Project:** Customer Purchase Analytics — Full-Stack Integration**
**Author:** Saikalyan G | Incedo Inc. Internship Task 2**
**Design System:** DESIGN-voltagent.md (dark canvas `#101010`, electric-green `#00d992`)**
**Stack:** FastAPI + React 18 + Recharts**
**Target Directory:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\`**

---

## ⚠️ Claude Cowork Execution Rules

1. Read this document fully before writing any code
2. Recharts is the only new npm package permitted — install it in Step 1
3. All chart colours must use the Voltagent palette: `#00d992` (primary), `#2fd6a1` (primary-soft), `#8b949e` (mute), `#3d3a39` (hairline)
4. No chart background fills — charts sit on `var(--color-canvas)` with transparent plot area
5. All existing Phase 14.75 and 14.8 files must remain intact — this phase adds new files and modifies only `Analytics.jsx` and `analytics.py`
6. Execute sub-tasks sequentially; confirm each with Saikalyan before the next

---

## 0. Phase Overview

### Purpose

Phase 14.9 adds an interactive time series chart layer to the **Analytics page**. Instead of only showing M7 (Moving Analytics) results as a raw data table, users can now toggle to a visual chart view that renders:

- **Moving Average Lines** — 3-order and 5-order moving averages overlaid on actual order amounts, per customer
- **Rolling Revenue Chart** — cumulative revenue by customer over time
- **Order Amount Timeline** — scatter/line chart of individual order amounts by date across all customers

Charts are built with **Recharts** (already in the React ecosystem, zero config beyond install) and themed entirely in the Voltagent dark canvas design system.

### Position in the phase sequence

```
Phase 14.8  — AI Query Suggestions (Claude API integration)
     │
     ▼
Phase 14.9  — Time Series Chart Layer (Recharts, M7 visual charts)
     │
     ▼
Phase 15    — Final Integration Testing, Git Init, Wrap-up
```

### What gets built

| Deliverable | Location |
|-------------|---------|
| `GET /api/analytics/moving-analytics` endpoint | Add to `backend/app/routers/analytics.py` |
| `GET /api/analytics/revenue-timeline` endpoint | Add to `backend/app/routers/analytics.py` |
| `useChartData.js` custom hook | `frontend/src/hooks/useChartData.js` |
| `MovingAveragesChart.jsx` component | `frontend/src/components/charts/MovingAveragesChart.jsx` |
| `RevenueTimelineChart.jsx` component | `frontend/src/components/charts/RevenueTimelineChart.jsx` |
| `OrderTimelineChart.jsx` component | `frontend/src/components/charts/OrderTimelineChart.jsx` |
| `ChartContainer.jsx` wrapper | `frontend/src/components/charts/ChartContainer.jsx` |
| `Analytics.jsx` — chart tab added | Modify `frontend/src/pages/Analytics.jsx` |
| `recharts` npm package | `frontend/package.json` |

---

## 1. Functional Requirements

### 1.1 New Analytics Page Tab

A new **"Charts"** tab is added to the existing Analytics module selector row. When selected, the Results area below shows three sub-charts in a vertically stacked layout instead of a data table.

The module selector now has:
- M6 — Segmentation *(existing)*
- M3 — Ranking *(existing)*
- M9 — Product Insights *(existing)*
- Req #43 — Mega Report *(existing)*
- **📈 Charts** *(new — Phase 14.9)*

When "Charts" is selected, three charts render in order:
1. Moving Averages Chart (M7)
2. Revenue Timeline Chart (running cumulative revenue)
3. Order Amount Timeline (individual order dots by date)

### 1.2 Chart 1 — Moving Averages (M7)

- **Type:** Multi-line chart (`LineChart` from Recharts)
- **X-axis:** `order_date` (formatted as `MMM DD` e.g. `Jan 05`)
- **Y-axis:** Amount in INR (formatted as `₹X,XXX`)
- **Series per chart:**
  - Actual order amount — thin dashed line (`#3d3a39` hairline colour)
  - 3-order moving average — solid bright green line (`#00d992`)
  - 5-order moving average — solid muted green line (`#2fd6a1`)
- **Customer filter:** Dropdown selector to pick one customer (default: Aanya Sharma, ID 1)
- **Legend:** Three entries with colour-matched dots, positioned at top-right
- **Tooltip:** On hover, shows date + all three values formatted as `₹X,XXX.XX`
- **Null handling:** The first 2 values of moving_avg_3 and first 4 of moving_avg_5 are NULL (not enough prior orders) — these points are simply omitted from the line (use `connectNulls={false}`)

### 1.3 Chart 2 — Revenue Timeline (Rolling Revenue)

- **Type:** Area chart (`AreaChart` from Recharts) — shows cumulative growth
- **X-axis:** `order_date` formatted as `MMM DD`
- **Y-axis:** INR total, formatted as `₹X,XXX`
- **Series:** One area per customer, stacked or overlaid
  - Display mode: **overlaid** (not stacked) — each customer's running total is shown independently
  - Default: show all 7 customers
  - Customer colours: use the 7-colour sequence defined in §3.3
- **Area fill:** Semi-transparent version of each line colour at 15% opacity
- **Legend:** Customer names as labels
- **Tooltip:** Date + each customer's running total
- **Final data point annotation:** A small label at the right edge of each area showing the customer's total lifetime spend

### 1.4 Chart 3 — Order Amount Timeline

- **Type:** Scatter chart (`ScatterChart` from Recharts) with optional line connection
- **X-axis:** `order_date`
- **Y-axis:** `order_amount` in INR
- **Each dot:** One order, coloured by customer
- **Dot size:** Fixed at radius 5px
- **Hover tooltip:** customer_name, product_name, category, order_date, order_amount
- **Toggle:** A "Connect dots" checkbox that adds a `Line` on top of the scatter for each customer

### 1.5 Chart Controls (shared across all three charts)

- **Customer filter** (applies to Chart 1 only, Charts 2+3 always show all customers)
- **Date range filter:** Two date inputs, `From` and `To`, defaulting to `2024-01-01` and `2024-06-30`
- **Export PNG button:** Uses `recharts` `ResponsiveContainer` ref + `html2canvas` — **do not install html2canvas** — instead just show a "Screenshot" note that uses the browser's native `window.print()` or points to DevTools
- **Refresh button:** Re-fetches data from the API

### 1.6 Responsive Behaviour

- Charts are wrapped in `<ResponsiveContainer width="100%" height={320}>` from Recharts
- On mobile (< 768px): Charts stack 1-up, height reduces to 240px
- All chart text uses `var(--font-sans)` at 11px (matching the data table caption scale)

---

## 2. Technical Architecture

### 2.1 Data Flow

```
Analytics.jsx
  │  User clicks "Charts" tab
  │
  ▼
useChartData.js hook
  │  GET /api/analytics/moving-analytics?customer_id=1
  │  GET /api/analytics/revenue-timeline
  │
  ▼
FastAPI — analytics.py (existing router, new endpoints added)
  │
  ├── moving-analytics: window function query (M7) via psycopg2
  │   → returns moving_avg_3, moving_avg_5, order_amount per order per customer
  │
  └── revenue-timeline: running SUM query via psycopg2
      → returns running_total, order_date per customer
  │
  ▼
Recharts components render with Voltagent dark theme tokens
```

### 2.2 New API Endpoints

#### `GET /api/analytics/moving-analytics`

**Query params:**
- `customer_id` (optional, integer) — filter to one customer; if omitted, returns all 35 rows

**Response (200):**
```json
{
  "status": "success",
  "row_count": 5,
  "data": [
    {
      "order_id": 1,
      "customer_id": 1,
      "customer_name": "Aanya Sharma",
      "order_date": "2024-01-05",
      "order_amount": 14200.0,
      "moving_avg_3": null,
      "moving_avg_5": null,
      "rolling_revenue": 14200.0
    }
  ]
}
```

#### `GET /api/analytics/revenue-timeline`

Returns one row per order for all customers, used to build per-customer running total area chart.

**Response (200):**
```json
{
  "status": "success",
  "row_count": 35,
  "data": [
    {
      "customer_id": 1,
      "customer_name": "Aanya Sharma",
      "order_date": "2024-01-05",
      "order_amount": 14200.0,
      "running_total": 14200.0
    }
  ]
}
```

### 2.3 SQL Queries for New Endpoints

**Moving Analytics SQL (M7 from the capstone):**

```sql
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
    order_date,
    order_amount,
    ROUND(
        AVG(order_amount) OVER (
            PARTITION BY customer_id ORDER BY order_date, order_id
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 2
    )                           AS moving_avg_3,
    ROUND(
        AVG(order_amount) OVER (
            PARTITION BY customer_id ORDER BY order_date, order_id
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ), 2
    )                           AS moving_avg_5,
    SUM(order_amount) OVER (
        PARTITION BY customer_id ORDER BY order_date, order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                           AS rolling_revenue
FROM base
ORDER BY customer_id, order_date, order_id;
```

**Revenue Timeline SQL:**

```sql
WITH base AS (
    SELECT
        o.customer_id,
        c.customer_name,
        o.order_date,
        ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.customer_id
    INNER JOIN products  p ON o.product_id  = p.product_id
)
SELECT
    customer_id,
    customer_name,
    order_date,
    order_amount,
    ROUND(
        SUM(order_amount) OVER (
            PARTITION BY customer_id ORDER BY order_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ), 2
    ) AS running_total
FROM base
ORDER BY customer_id, order_date;
```

### 2.3 Customer Colour Palette (Voltagent-aligned)

All 7 customers get a unique colour. These are derived from the Voltagent system — all work against the `#101010` canvas:

```javascript
// frontend/src/components/charts/chartTheme.js
export const CUSTOMER_COLORS = {
  1: "#00d992",   // Aanya Sharma   — primary green
  2: "#2fd6a1",   // Rohan Mehta    — primary soft
  3: "#60a5fa",   // Priya Nair     — blue
  4: "#f59e0b",   // Karan Kapoor   — amber
  5: "#c084fc",   // Sneha Joshi    — purple
  6: "#fb923c",   // Vikram Rao     — orange
  7: "#f472b6",   // Divya Reddy    — pink
};

export const CHART_THEME = {
  background:   "transparent",
  cartesianGrid: "rgba(61, 58, 57, 0.4)",  // hairline at 40% opacity
  axisText:     "#8b949e",                  // mute colour
  axisLine:     "#3d3a39",                  // hairline
  tooltipBg:    "#1a1a1a",                  // canvas-soft
  tooltipBorder:"#3d3a39",                  // hairline
  tooltipText:  "#f2f2f2",                  // ink
};
```

---

## 3. Implementation Steps

### Step 1 — Install Recharts

```powershell
# From frontend/ directory
npm install recharts
```

Verify `package.json` now contains `"recharts": "^x.x.x"` in dependencies.

### Step 2 — Chart Theme File

**File to create:** `frontend/src/components/charts/chartTheme.js`

```javascript
/**
 * chartTheme.js — Recharts colour and style tokens.
 * All values derived from DESIGN-voltagent.md.
 * Do not hardcode colours in chart components — reference these exports.
 */

export const CUSTOMER_COLORS = {
  1: "#00d992",   // Aanya Sharma   — primary green
  2: "#2fd6a1",   // Rohan Mehta    — primary soft
  3: "#60a5fa",   // Priya Nair     — blue
  4: "#f59e0b",   // Karan Kapoor   — amber
  5: "#c084fc",   // Sneha Joshi    — purple
  6: "#fb923c",   // Vikram Rao     — orange
  7: "#f472b6",   // Divya Reddy    — pink
};

// Customer names in ID order — for legend labels
export const CUSTOMER_NAMES = {
  1: "Aanya Sharma",
  2: "Rohan Mehta",
  3: "Priya Nair",
  4: "Karan Kapoor",
  5: "Sneha Joshi",
  6: "Vikram Rao",
  7: "Divya Reddy",
};

export const CHART_THEME = {
  background:    "transparent",
  cartesianGrid: "rgba(61, 58, 57, 0.4)",
  axisText:      "#8b949e",
  axisLine:      "#3d3a39",
  tooltipBg:     "#1a1a1a",
  tooltipBorder: "#3d3a39",
  tooltipText:   "#f2f2f2",
  fontFamily:    "Inter, system-ui, -apple-system, sans-serif",
  fontSize:      11,
};

export const MOVING_AVG_COLORS = {
  actual:     "#3d3a39",    // hairline — dashed actual order amount
  moving3:    "#00d992",    // primary — 3-order moving average
  moving5:    "#2fd6a1",    // primary-soft — 5-order moving average
};

// INR currency formatter for axis ticks and tooltips
export const formatINR = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

// Short date formatter for X-axis ticks
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
};
```

### Step 3 — Chart Container Wrapper

**File to create:** `frontend/src/components/charts/ChartContainer.jsx`

```jsx
/**
 * ChartContainer — shared wrapper for all three chart components.
 * Applies Voltagent card-feature chrome and section label.
 */
export default function ChartContainer({ title, subtitle, children, controls }) {
  return (
    <div style={{
      backgroundColor: "var(--color-canvas)",
      border: "1px solid var(--color-hairline)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-2xl)",
      marginBottom: "var(--space-xl)",
    }}>
      {/* Chart header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "var(--space-xl)",
        flexWrap: "wrap",
        gap: "var(--space-md)",
      }}>
        <div>
          <p style={{
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "2.52px",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            margin: "0 0 var(--space-xs) 0",
            fontFamily: "var(--font-sans)",
          }}>
            {title}
          </p>
          {subtitle && (
            <p style={{
              fontSize: "var(--text-body-sm-size)",
              color: "var(--color-mute)",
              margin: 0,
              fontFamily: "var(--font-sans)",
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {controls && (
          <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", flexWrap: "wrap" }}>
            {controls}
          </div>
        )}
      </div>

      {/* Chart body */}
      {children}
    </div>
  );
}
```

### Step 4 — Moving Averages Chart Component

**File to create:** `frontend/src/components/charts/MovingAveragesChart.jsx`

```jsx
/**
 * MovingAveragesChart — M7 Moving Averages (3-order, 5-order) per customer.
 *
 * Recharts components used:
 *   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
 *   ResponsiveContainer, ReferenceLine
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import {
  CUSTOMER_COLORS, CUSTOMER_NAMES, CHART_THEME,
  MOVING_AVG_COLORS, formatINR, formatDate,
} from "./chartTheme";

const CUSTOMERS = Object.entries(CUSTOMER_NAMES).map(([id, name]) => ({ id: Number(id), name }));

// Custom tooltip matching Voltagent dark theme
function MovingAvgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: CHART_THEME.tooltipBg,
      border: `1px solid ${CHART_THEME.tooltipBorder}`,
      borderRadius: "6px",
      padding: "10px 14px",
      fontFamily: CHART_THEME.fontFamily,
      fontSize: "12px",
    }}>
      <p style={{ color: "#f2f2f2", fontWeight: "600", margin: "0 0 6px" }}>
        {formatDate(label)}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color, margin: "2px 0" }}>
          {entry.name}: {formatINR(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function MovingAveragesChart({ data, selectedCustomerId, onCustomerChange }) {
  // Filter data for the selected customer
  const chartData = (data || []).filter((r) => r.customer_id === selectedCustomerId);

  const customerSelector = (
    <select
      value={selectedCustomerId}
      onChange={(e) => onCustomerChange(Number(e.target.value))}
      style={{
        backgroundColor: "var(--color-canvas-soft)",
        color: "var(--color-ink)",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-xs) var(--space-md)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-body-sm-size)",
        cursor: "pointer",
      }}
      aria-label="Select customer for moving averages chart"
    >
      {CUSTOMERS.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );

  return (
    <ChartContainer
      title="M7 — Moving Averages"
      subtitle="3-order and 5-order moving averages of order amounts per customer"
      controls={customerSelector}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
          <CartesianGrid stroke={CHART_THEME.cartesianGrid} strokeDasharray="3 3" />
          <XAxis
            dataKey="order_date"
            tickFormatter={formatDate}
            tick={{ fill: CHART_THEME.axisText, fontSize: CHART_THEME.fontSize, fontFamily: CHART_THEME.fontFamily }}
            axisLine={{ stroke: CHART_THEME.axisLine }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fill: CHART_THEME.axisText, fontSize: CHART_THEME.fontSize, fontFamily: CHART_THEME.fontFamily }}
            axisLine={{ stroke: CHART_THEME.axisLine }}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<MovingAvgTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.axisText }}
          />

          {/* Actual order amount — dashed hairline */}
          <Line
            type="monotone"
            dataKey="order_amount"
            name="Actual order"
            stroke={MOVING_AVG_COLORS.actual}
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: MOVING_AVG_COLORS.actual }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />

          {/* 3-order moving average — primary green */}
          <Line
            type="monotone"
            dataKey="moving_avg_3"
            name="3-order avg"
            stroke={MOVING_AVG_COLORS.moving3}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: MOVING_AVG_COLORS.moving3 }}
            connectNulls={false}
          />

          {/* 5-order moving average — primary soft */}
          <Line
            type="monotone"
            dataKey="moving_avg_5"
            name="5-order avg"
            stroke={MOVING_AVG_COLORS.moving5}
            strokeWidth={2}
            strokeDasharray="6 2"
            dot={false}
            activeDot={{ r: 4, fill: MOVING_AVG_COLORS.moving5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* NULL explanation note */}
      <p style={{
        marginTop: "var(--space-sm)",
        fontSize: "var(--text-caption-size)",
        color: "var(--color-mute)",
        fontFamily: "var(--font-sans)",
      }}>
        Note: 3-order avg starts from the 3rd order; 5-order avg from the 5th. Prior points are NULL by design (insufficient history).
      </p>
    </ChartContainer>
  );
}
```

### Step 5 — Revenue Timeline Chart Component

**File to create:** `frontend/src/components/charts/RevenueTimelineChart.jsx`

```jsx
/**
 * RevenueTimelineChart — cumulative running total per customer over time.
 * Uses AreaChart with semi-transparent fills.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import { CUSTOMER_COLORS, CUSTOMER_NAMES, CHART_THEME, formatINR, formatDate } from "./chartTheme";

const CUSTOMER_IDS = [1, 2, 3, 4, 5, 6, 7];

// Transform flat rows into date-keyed objects for AreaChart
function transformForAreaChart(data) {
  const dateMap = {};
  (data || []).forEach((row) => {
    const date = row.order_date;
    if (!dateMap[date]) {
      dateMap[date] = { order_date: date };
      CUSTOMER_IDS.forEach((id) => { dateMap[date][`c${id}`] = null; });
    }
    dateMap[date][`c${row.customer_id}`] = row.running_total;
  });

  // Forward-fill nulls — running total doesn't go back to zero between orders
  const sorted = Object.values(dateMap).sort((a, b) => a.order_date.localeCompare(b.order_date));
  const lastValues = {};
  return sorted.map((row) => {
    const filled = { ...row };
    CUSTOMER_IDS.forEach((id) => {
      if (filled[`c${id}`] === null && lastValues[id] != null) {
        filled[`c${id}`] = lastValues[id];
      }
      if (filled[`c${id}`] != null) lastValues[id] = filled[`c${id}`];
    });
    return filled;
  });
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));
  return (
    <div style={{
      backgroundColor: CHART_THEME.tooltipBg,
      border: `1px solid ${CHART_THEME.tooltipBorder}`,
      borderRadius: "6px",
      padding: "10px 14px",
      fontFamily: CHART_THEME.fontFamily,
      fontSize: "12px",
      maxWidth: "220px",
    }}>
      <p style={{ color: "#f2f2f2", fontWeight: "600", margin: "0 0 6px" }}>
        {formatDate(label)}
      </p>
      {sorted.map((entry) => entry.value != null && (
        <p key={entry.dataKey} style={{ color: entry.color, margin: "2px 0" }}>
          {entry.name}: {formatINR(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function RevenueTimelineChart({ data }) {
  const chartData = transformForAreaChart(data);

  return (
    <ChartContainer
      title="Cumulative Revenue Timeline"
      subtitle="Running total spend per customer (Jan – Jun 2024)"
    >
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
          <defs>
            {CUSTOMER_IDS.map((id) => (
              <linearGradient key={id} id={`gradient-c${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CUSTOMER_COLORS[id]} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CUSTOMER_COLORS[id]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={CHART_THEME.cartesianGrid} strokeDasharray="3 3" />
          <XAxis
            dataKey="order_date"
            tickFormatter={formatDate}
            tick={{ fill: CHART_THEME.axisText, fontSize: 11, fontFamily: CHART_THEME.fontFamily }}
            axisLine={{ stroke: CHART_THEME.axisLine }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fill: CHART_THEME.axisText, fontSize: 11, fontFamily: CHART_THEME.fontFamily }}
            axisLine={{ stroke: CHART_THEME.axisLine }}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<RevenueTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", fontFamily: CHART_THEME.fontFamily, color: CHART_THEME.axisText }}
          />
          {CUSTOMER_IDS.map((id) => (
            <Area
              key={id}
              type="monotone"
              dataKey={`c${id}`}
              name={CUSTOMER_NAMES[id]}
              stroke={CUSTOMER_COLORS[id]}
              fill={`url(#gradient-c${id})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: CUSTOMER_COLORS[id] }}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
```

### Step 6 — Order Amount Timeline Chart Component

**File to create:** `frontend/src/components/charts/OrderTimelineChart.jsx`

```jsx
/**
 * OrderTimelineChart — individual order amounts as scatter dots over time.
 * Each dot = one order, coloured by customer.
 */
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import ChartContainer from "./ChartContainer";
import { CUSTOMER_COLORS, CUSTOMER_NAMES, CHART_THEME, formatINR, formatDate } from "./chartTheme";

const CUSTOMER_IDS = [1, 2, 3, 4, 5, 6, 7];

// Group flat rows by customer_id
function groupByCustomer(data) {
  const groups = {};
  CUSTOMER_IDS.forEach((id) => { groups[id] = []; });
  (data || []).forEach((row) => {
    if (groups[row.customer_id]) {
      groups[row.customer_id].push({
        x: new Date(row.order_date).getTime(),    // numeric for ScatterChart X
        y: row.order_amount,
        order_date: row.order_date,
        customer_name: row.customer_name,
        product_name: row.product_name,
        category: row.category,
      });
    }
  });
  return groups;
}

function ScatterTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      backgroundColor: CHART_THEME.tooltipBg,
      border: `1px solid ${CHART_THEME.tooltipBorder}`,
      borderRadius: "6px",
      padding: "10px 14px",
      fontFamily: CHART_THEME.fontFamily,
      fontSize: "12px",
    }}>
      <p style={{ color: "#f2f2f2", fontWeight: "600", margin: "0 0 4px" }}>{d.customer_name}</p>
      <p style={{ color: "#8b949e", margin: "2px 0" }}>{d.product_name}</p>
      <p style={{ color: "#8b949e", margin: "2px 0" }}>{d.category}</p>
      <p style={{ color: "#8b949e", margin: "2px 0" }}>{formatDate(d.order_date)}</p>
      <p style={{ color: "#00d992", fontWeight: "600", margin: "4px 0 0" }}>{formatINR(d.y)}</p>
    </div>
  );
}

export default function OrderTimelineChart({ data }) {
  const [hiddenCustomers, setHiddenCustomers] = useState(new Set());
  const groups = groupByCustomer(data);

  const toggleCustomer = (id) => {
    setHiddenCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Custom legend with toggle behaviour
  const customLegend = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
      {CUSTOMER_IDS.map((id) => (
        <button
          key={id}
          onClick={() => toggleCustomer(id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 10px",
            backgroundColor: hiddenCustomers.has(id) ? "transparent" : `${CUSTOMER_COLORS[id]}18`,
            border: `1px solid ${hiddenCustomers.has(id) ? "var(--color-hairline)" : CUSTOMER_COLORS[id]}`,
            borderRadius: "9999px",
            color: hiddenCustomers.has(id) ? "var(--color-mute)" : CUSTOMER_COLORS[id],
            fontSize: "11px",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "all 150ms ease",
            opacity: hiddenCustomers.has(id) ? 0.5 : 1,
          }}
        >
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: CUSTOMER_COLORS[id],
            display: "inline-block",
            opacity: hiddenCustomers.has(id) ? 0.3 : 1,
          }} />
          {CUSTOMER_NAMES[id].split(" ")[0]}
        </button>
      ))}
    </div>
  );

  return (
    <ChartContainer
      title="Order Amount Timeline"
      subtitle="Individual order values by date — click a customer name to show/hide"
    >
      {customLegend}
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
          <CartesianGrid stroke={CHART_THEME.cartesianGrid} strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts) => formatDate(new Date(ts).toISOString().split("T")[0])}
            tick={{ fill: CHART_THEME.axisText, fontSize: 11, fontFamily: CHART_THEME.fontFamily }}
            axisLine={{ stroke: CHART_THEME.axisLine }}
            tickLine={false}
            scale="time"
          />
          <YAxis
            dataKey="y"
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fill: CHART_THEME.axisText, fontSize: 11, fontFamily: CHART_THEME.fontFamily }}
            axisLine={{ stroke: CHART_THEME.axisLine }}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ScatterTooltipContent />} cursor={{ stroke: CHART_THEME.axisLine }} />
          {CUSTOMER_IDS.map((id) =>
            !hiddenCustomers.has(id) ? (
              <Scatter
                key={id}
                name={CUSTOMER_NAMES[id]}
                data={groups[id]}
                fill={CUSTOMER_COLORS[id]}
                r={5}
                opacity={0.85}
              />
            ) : null
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
```

### Step 7 — useChartData.js Hook

**File to create:** `frontend/src/hooks/useChartData.js`

```javascript
/**
 * useChartData — fetches data for all three charts in parallel.
 * Calls /api/analytics/moving-analytics and /api/analytics/revenue-timeline.
 */
import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";

export function useChartData() {
  const [movingData,  setMovingData]  = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [movingRes, revenueRes] = await Promise.all([
        apiClient.get("/api/analytics/moving-analytics"),
        apiClient.get("/api/analytics/revenue-timeline"),
      ]);
      setMovingData(movingRes.data.data || []);
      setRevenueData(revenueRes.data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load chart data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { movingData, revenueData, loading, error, refetch: fetchAll };
}
```

### Step 8 — Backend: Add Two New Endpoints to analytics.py

Claude Cowork: Open `backend/app/routers/analytics.py` and append these two endpoints at the bottom of the file. Do not remove any existing code.

```python
from fastapi import Query as QueryParam

# ── Moving Analytics endpoint (M7) ────────────────────────────────────────────
@router.get("/moving-analytics")
def get_moving_analytics(customer_id: Optional[int] = QueryParam(default=None)):
    """
    M7 — Moving Averages (3-order, 5-order) and rolling revenue.
    Used by MovingAveragesChart.jsx in Phase 14.9.

    Optional query param: ?customer_id=1 to filter to one customer.
    Returns 35 rows (all customers) or fewer if filtered.
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Moving analytics query failed: {str(e)}")


# ── Revenue Timeline endpoint ──────────────────────────────────────────────────
@router.get("/revenue-timeline")
def get_revenue_timeline():
    """
    Cumulative running total per customer per order date.
    Used by RevenueTimelineChart.jsx in Phase 14.9.
    Returns all 35 rows across 7 customers.
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Revenue timeline query failed: {str(e)}")
```

Also add this import at the top of `analytics.py` if not already present:
```python
from typing import Optional
```

### Step 9 — Update Analytics.jsx to Add Charts Tab

Claude Cowork: Open `frontend/src/pages/Analytics.jsx` and make these targeted additions:

**Add imports at the top:**
```jsx
import { useState as useLocalState } from "react";
import MovingAveragesChart  from "../components/charts/MovingAveragesChart";
import RevenueTimelineChart from "../components/charts/RevenueTimelineChart";
import OrderTimelineChart   from "../components/charts/OrderTimelineChart";
import { useChartData }     from "../hooks/useChartData";
```

**Add to the `MODULES` array (new entry at the end):**
```jsx
{ id: "charts", label: "📈 Charts", description: "M7 moving averages, cumulative revenue, order timeline — Recharts" },
```

**Add hook call inside the component:**
```jsx
const { movingData, revenueData, loading: chartLoading, error: chartError, refetch: refetchCharts }
  = useChartData();
const [selectedCustomerForChart, setSelectedCustomerForChart] = useLocalState(1);
```

**In the results section, add the charts case:**

After the existing `selectedModule === "mega-report"` branch, add:

```jsx
{selectedModule === "charts" && (
  <div>
    {chartLoading && <LoadingSpinner message="Loading chart data…" />}
    {chartError && <ErrorBanner message={chartError} onRetry={refetchCharts} />}
    {!chartLoading && !chartError && (
      <>
        <MovingAveragesChart
          data={movingData}
          selectedCustomerId={selectedCustomerForChart}
          onCustomerChange={setSelectedCustomerForChart}
        />
        <RevenueTimelineChart data={revenueData} />
        <OrderTimelineChart   data={revenueData} />
      </>
    )}
  </div>
)}
```

---

## 4. Testing and Validation

### 4.1 Backend Endpoint Tests

```powershell
# Test 1: Moving analytics — all customers (35 rows)
curl.exe -s http://localhost:8000/api/analytics/moving-analytics | python -c "import sys,json; d=json.load(sys.stdin); print('rows:', d['row_count'])"
# Expected: rows: 35

# Test 2: Moving analytics — filtered to customer 1
curl.exe -s "http://localhost:8000/api/analytics/moving-analytics?customer_id=1" | python -c "import sys,json; d=json.load(sys.stdin); print('rows:', d['row_count'])"
# Expected: rows: 5 or 6 (Aanya Sharma's order count)

# Test 3: Verify first row has NULL moving_avg_3 (expected — first purchase)
curl.exe -s "http://localhost:8000/api/analytics/moving-analytics?customer_id=1" | python -c "import sys,json; d=json.load(sys.stdin); r=d['data'][0]; print('moving_avg_3:', r['moving_avg_3'])"
# Expected: moving_avg_3: None (NULL — correct)

# Test 4: Revenue timeline — 35 rows
curl.exe -s http://localhost:8000/api/analytics/revenue-timeline | python -c "import sys,json; d=json.load(sys.stdin); print('rows:', d['row_count'])"
# Expected: rows: 35

# Test 5: Last running_total for customer 1 should be their lifetime spend
curl.exe -s "http://localhost:8000/api/analytics/moving-analytics?customer_id=1" | python -c "import sys,json; d=json.load(sys.stdin); rows=d['data']; print('final rolling:', rows[-1]['rolling_revenue'])"
# Expected: matches /api/analytics/segmentation customer 1 total_spending
```

### 4.2 Frontend Visual Checklist

| # | Test | Expected |
|---|------|---------|
| 1 | Analytics page — "📈 Charts" tab visible | New tab appears in module selector |
| 2 | Click Charts tab | Three charts render without error |
| 3 | Chart 1 — customer selector dropdown | All 7 customers listed |
| 4 | Change customer in Chart 1 | Chart updates to show that customer's orders |
| 5 | Chart 1 — moving_avg_3 starts mid-line | Line starts at 3rd order (first 2 points missing — correct) |
| 6 | Chart 1 — tooltips on hover | Shows date + all three formatted INR values |
| 7 | Chart 2 — 7 coloured area series | One area per customer, distinct colours |
| 8 | Chart 2 — areas show growth over time | Running totals increase monotonically |
| 9 | Chart 3 — scatter dots visible | 35 dots, coloured by customer |
| 10 | Chart 3 — toggle customer | Click customer pill → that customer's dots disappear |
| 11 | Chart 3 — tooltip on dot | Shows customer, product, date, INR amount |
| 12 | Responsive 375px | Charts scroll horizontally, no overflow |
| 13 | No console errors | Browser DevTools console clean |
| 14 | Y-axis labels format | `₹14k` style (not full number) |
| 15 | Grid lines | Subtle dashed lines matching `hairline` colour |

### 4.3 Data Integrity Cross-Check

| Chart | Value to Check | Expected |
|-------|---------------|---------|
| Chart 1 (Aanya) | Final `rolling_revenue` | Matches Aanya's `total_spending` from `/api/analytics/segmentation` |
| Chart 2 (all) | Final value per area | Each customer's area ends at their lifetime total |
| Chart 3 | Total dot count | 35 dots across all customers |
| Chart 1 | `moving_avg_5` NULL count | First 4 rows for any customer with 5+ orders = NULL |

---

## 5. Handoff Checklist

### New Files Created in Phase 14.9

| File | ☐ |
|------|---|
| `frontend/src/components/charts/chartTheme.js` | ☐ |
| `frontend/src/components/charts/ChartContainer.jsx` | ☐ |
| `frontend/src/components/charts/MovingAveragesChart.jsx` | ☐ |
| `frontend/src/components/charts/RevenueTimelineChart.jsx` | ☐ |
| `frontend/src/components/charts/OrderTimelineChart.jsx` | ☐ |
| `frontend/src/hooks/useChartData.js` | ☐ |

### Existing Files Modified in Phase 14.9

| File | Change | ☐ |
|------|--------|---|
| `backend/app/routers/analytics.py` | Add `moving-analytics` + `revenue-timeline` endpoints | ☐ |
| `frontend/src/pages/Analytics.jsx` | Add Charts tab, import chart components, add `useChartData` hook | ☐ |
| `frontend/package.json` | `recharts` added after `npm install recharts` | ☐ |

---

## 6. Phase 14.9 Final Sign-off

Claude Cowork must output this message when all checklist items pass:

```
╔══════════════════════════════════════════════════════════════════╗
║       PHASE 14.9 — TIME SERIES CHART LAYER — COMPLETE           ║
╚══════════════════════════════════════════════════════════════════╝

✅ backend/app/routers/analytics.py    — /moving-analytics + /revenue-timeline endpoints
✅ frontend/src/components/charts/     — chartTheme.js + 3 chart components + ChartContainer
✅ frontend/src/hooks/useChartData.js  — parallel data fetch hook
✅ frontend/src/pages/Analytics.jsx   — Charts tab added, charts rendered

CHART INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Chart 1  MovingAveragesChart   — M7 3-order + 5-order avg lines per customer
  Chart 2  RevenueTimelineChart  — 7-area cumulative revenue (all customers)
  Chart 3  OrderTimelineChart    — 35 scatter dots, toggle by customer

DATA VERIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /moving-analytics  → 35 rows  ✓
  /revenue-timeline  → 35 rows  ✓
  Final rolling_revenue matches segmentation totals  ✓
  NULL moving_avg_3/5 on first orders per customer  ✓ (correct by design)

DESIGN ADHERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Canvas:  transparent chart background on #101010
  Accent:  #00d992 primary series, #2fd6a1 secondary
  Grid:    hairline #3d3a39 at 40% opacity (dashed)
  Tooltip: canvas-soft #1a1a1a background, hairline border

Ready to proceed to Phase 15 (Final Integration Testing, Git Init).
```

---

*Phase 14.9 of 15 — Time Series Chart Layer*
*Customer Purchase Analytics · Saikalyan G · Incedo Inc.*
