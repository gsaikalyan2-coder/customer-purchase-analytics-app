/**
 * RevenueTimelineChart — cumulative running total per customer over time.
 * Uses AreaChart with semi-transparent fills (one overlaid area per customer).
 * Material 3: tooltip reads as an M3 surface-container card (shape-small, elev 2).
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import { CUSTOMER_COLORS, CUSTOMER_NAMES, CHART_THEME, formatINR, formatDate, M3 } from "./chartTheme";

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
      borderRadius: M3.shape.small,
      padding: "10px 14px",
      fontFamily: CHART_THEME.fontFamily,
      fontSize: "12px",
      maxWidth: "220px",
      boxShadow: M3.elevation.level2,
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
