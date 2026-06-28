/**
 * MovingAveragesChart — M7 Moving Averages (3-order, 5-order) per customer.
 *
 * Recharts: LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
 *           ResponsiveContainer.
 * Material 3: the customer picker is styled as an M3 outlined select
 *   (shape-corner-small, outline border, primary focus outline). Tooltip reads
 *   as an M3 surface-container card. Palette stays Voltagent.
 */
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import ChartContainer from "./ChartContainer";
import {
  CUSTOMER_NAMES, CHART_THEME,
  MOVING_AVG_COLORS, formatINR, formatDate, M3,
} from "./chartTheme";

const CUSTOMERS = Object.entries(CUSTOMER_NAMES).map(([id, name]) => ({ id: Number(id), name }));

// Custom tooltip matching Voltagent dark theme / M3 surface-container card
function MovingAvgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: CHART_THEME.tooltipBg,
      border: `1px solid ${CHART_THEME.tooltipBorder}`,
      borderRadius: M3.shape.small,
      padding: "10px 14px",
      fontFamily: CHART_THEME.fontFamily,
      fontSize: "12px",
      boxShadow: M3.elevation.level2,
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
  const [focused, setFocused] = useState(false);

  // Filter data for the selected customer
  const chartData = (data || []).filter((r) => r.customer_id === selectedCustomerId);

  // M3 outlined select (shape-corner-small, outline border, primary focus ring)
  const customerSelector = (
    <select
      value={selectedCustomerId}
      onChange={(e) => onCustomerChange(Number(e.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        backgroundColor: "var(--color-canvas-soft)",
        color: "var(--color-ink)",
        border: `1px solid ${focused ? "var(--color-primary)" : "var(--color-hairline)"}`,
        borderRadius: M3.shape.small,
        padding: "var(--space-xs) var(--space-md)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-body-sm-size)",
        cursor: "pointer",
        outline: "none",
        transition: `border-color ${M3.motion.durationShort} ${M3.motion.standard}`,
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
