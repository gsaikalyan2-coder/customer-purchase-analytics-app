/**
 * MegaReportTable — displays Req #43 Mega Report
 * 35 rows × 45+ columns with:
 * - Column groups by module (Identity + M1–M8) with token-styled headers
 * - Per-module accent coding (text colour + underline) for orientation
 * - Horizontal scrolling
 *
 * Styling: DESIGN-voltagent.md §ex-data-table-cell (dark canvas, hairline rows,
 * canvas-soft header). The MODULE_ACCENTS below are module-coding semantic tints
 * (same class of acceptable exception as Badge.jsx BADGE_PALETTE — Phase 14.5 §6.2).
 */

import { Badge } from "./Badge";

const MODULE_GROUPS = [
  {
    label: "Identity",
    accent: "var(--color-mute)",
    columns: [
      "order_id", "customer_id", "customer_name", "city", "product_name",
      "category", "order_date", "quantity", "unit_price", "discount", "order_amount"
    ],
  },
  {
    label: "M1 — Purchase Journey",
    accent: "#c084fc",
    columns: [
      "purchase_sequence", "first_purchase_date", "latest_purchase_date",
      "previous_order_date", "next_order_date", "days_since_last_order"
    ],
  },
  {
    label: "M2 — Spending Analytics",
    accent: "#60a5fa",
    columns: [
      "running_total_spend", "running_avg_spend", "running_max_spend",
      "running_min_spend", "lifetime_total_spend", "lifetime_avg_spend"
    ],
  },
  {
    label: "M3 — Ranking",
    accent: "#fbbf24",
    columns: [
      "city_row_number", "city_rank", "city_dense_rank",
      "city_percent_rank", "city_cume_dist"
    ],
  },
  {
    label: "M4 — Category",
    accent: "var(--color-primary)",
    columns: [
      "category_running_total", "category_running_max",
      "category_running_min", "category_last_order_amount"
    ],
  },
  {
    label: "M5 — Revenue Contribution",
    accent: "var(--color-danger)",
    columns: [
      "pct_of_customer_spend", "pct_of_category_revenue", "pct_of_company_revenue"
    ],
  },
  {
    label: "M6 — Segmentation",
    accent: "#c084fc",
    columns: ["quartile", "segment"],
  },
  {
    label: "M7 — Moving Analytics",
    accent: "#22d3ee",
    columns: [
      "moving_avg_3", "moving_avg_5", "surrounding_3_sum", "rolling_revenue"
    ],
  },
  {
    label: "M8 — Purchase Patterns",
    accent: "#f59e0b",
    columns: [
      "previous_order_amount", "next_order_amount",
      "spend_difference", "spend_change_pct", "spend_trend"
    ],
  },
];

function formatCell(col, value) {
  if (value === null || value === undefined) return <span style={{ color: "var(--color-mute)" }}>—</span>;

  /* Segment and spend_trend render as standard Badge pills (§4.4) */
  if (col === "segment" || col === "spend_trend") {
    return <Badge label={String(value)} />;
  }

  return String(value);
}

export default function MegaReportTable({ data }) {
  if (!data || data.length === 0) return <p style={{ color: "var(--color-mute)" }}>No data returned.</p>;

  // Build ordered column list from MODULE_GROUPS
  const allColumns = MODULE_GROUPS.flatMap((g) => g.columns).filter((col) => col in data[0]);

  // Map column → group accent
  const colAccent = {};
  MODULE_GROUPS.forEach((g) => g.columns.forEach((col) => { colAccent[col] = g.accent; }));

  return (
    <div>
      {/* Module group legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
        {MODULE_GROUPS.map((g) => (
          <div key={g.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span style={{ width: "10px", height: "10px", backgroundColor: g.accent, borderRadius: "var(--radius-xs)" }} />
            <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-body)" }}>{g.label}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-hairline)" }}>
        <table style={{ borderCollapse: "collapse", fontFamily: "var(--font-sans)", backgroundColor: "var(--color-canvas)" }}>
          <thead>
            <tr>
              {allColumns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "var(--space-md) var(--space-lg)",
                    backgroundColor: "var(--color-canvas-soft)",
                    color: colAccent[col] || "var(--color-mute)",
                    fontSize: "var(--text-caption-size)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    borderBottom: `2px solid ${colAccent[col] || "var(--color-hairline)"}`,
                    minWidth: col === "customer_name" ? "130px" : col === "spend_trend" ? "120px" : "80px",
                  }}
                >
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid var(--color-hairline)",
                  backgroundColor: i % 2 === 0 ? "transparent" : "var(--color-canvas-soft)",
                }}
              >
                {allColumns.map((col) => (
                  <td
                    key={col}
                    style={{
                      padding: "var(--space-sm) var(--space-lg)",
                      fontSize: "var(--text-body-sm-size)",
                      color: "var(--color-ink)",
                      whiteSpace: "nowrap",
                      fontWeight: col === "customer_name" ? "600" : "normal",
                      fontFamily: typeof row[col] === "number" ? "var(--font-mono)" : "var(--font-sans)",
                    }}
                  >
                    {formatCell(col, row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
