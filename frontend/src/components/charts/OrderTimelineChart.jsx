/**
 * OrderTimelineChart — individual order amounts as scatter dots over time.
 * Each dot = one order, coloured by customer.
 *
 * Material 3: the per-customer toggles are M3 *filter chips* — selected chips get
 * a tonal container fill, a leading check glyph, and shape-corner-small; all chips
 * carry an M3 hover state layer and standard motion. Tooltip is an M3 surface card.
 */
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import ChartContainer from "./ChartContainer";
import { CUSTOMER_COLORS, CUSTOMER_NAMES, CHART_THEME, formatINR, formatDate, M3 } from "./chartTheme";

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
      borderRadius: M3.shape.small,
      padding: "10px 14px",
      fontFamily: CHART_THEME.fontFamily,
      fontSize: "12px",
      boxShadow: M3.elevation.level2,
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

  // M3 filter chips — selected = tonal container + leading check; hover state layer
  const customLegend = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
      {CUSTOMER_IDS.map((id) => {
        const selected = !hiddenCustomers.has(id);
        return (
          <button
            key={id}
            onClick={() => toggleCustomer(id)}
            aria-pressed={selected}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              backgroundColor: selected ? `${CUSTOMER_COLORS[id]}1f` : "transparent",
              border: `1px solid ${selected ? CUSTOMER_COLORS[id] : "var(--color-hairline)"}`,
              borderRadius: M3.shape.small,            /* M3 filter chip = corner-small */
              color: selected ? CUSTOMER_COLORS[id] : "var(--color-mute)",
              fontSize: "11px",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              cursor: "pointer",
              transition: `all ${M3.motion.durationShort} ${M3.motion.standard}`,
              opacity: selected ? 1 : 0.7,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = selected
                ? `${CUSTOMER_COLORS[id]}2e`
                : "rgba(242,242,242,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = selected
                ? `${CUSTOMER_COLORS[id]}1f`
                : "transparent";
            }}
          >
            {/* Leading element: M3 check when selected, colour dot when not */}
            {selected ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke={CUSTOMER_COLORS[id]} strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                backgroundColor: CUSTOMER_COLORS[id],
                display: "inline-block",
                opacity: 0.4,
              }} />
            )}
            {CUSTOMER_NAMES[id].split(" ")[0]}
          </button>
        );
      })}
    </div>
  );

  return (
    <ChartContainer
      title="Order Amount Timeline"
      subtitle="Individual order values by date — click a customer to show/hide"
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
