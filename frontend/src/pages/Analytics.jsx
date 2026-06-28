import { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import { useChartData } from "../hooks/useChartData";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import MegaReportTable from "../components/MegaReportTable";
import { Badge, BADGE_PALETTE } from "../components/Badge";
import MovingAveragesChart from "../components/charts/MovingAveragesChart";
import RevenueTimelineChart from "../components/charts/RevenueTimelineChart";
import OrderTimelineChart from "../components/charts/OrderTimelineChart";
import { M3 } from "../components/charts/chartTheme";

const MODULES = [
  { id: "segmentation",     label: "M6 — Segmentation",     description: "NTILE(4) customer tiers: Platinum / Gold / Silver / Bronze" },
  { id: "ranking",          label: "M3 — Ranking",          description: "ROW_NUMBER, RANK, DENSE_RANK, PERCENT_RANK, CUME_DIST by city" },
  { id: "product-insights", label: "M9 — Product Insights", description: "DENSE_RANK top/bottom 3 products per category" },
  { id: "mega-report",      label: "Req #43 — Mega Report", description: "All M1–M8 window functions · 35 rows × 45+ columns (Phase 9)" },
  { id: "charts",           label: "📈 Charts",             description: "M7 moving averages, cumulative revenue, order timeline — Recharts" },
];

function AnalyticsTable({ data }) {
  if (!data || data.length === 0) return <p style={{ color: "var(--color-mute)" }}>No data returned.</p>;
  const columns = Object.keys(data[0]);

  const renderCell = (value) => {
    if (value === null || value === undefined) return <span style={{ color: "var(--color-mute)" }}>—</span>;
    /* Render a Badge pill when the value is a known badge/pill label (§4.4) */
    if (typeof value === "string" && value in BADGE_PALETTE) return <Badge label={value} />;
    return String(value);
  };

  return (
    <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-hairline)" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={styles.th}>
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              style={styles.tr}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-canvas-soft)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {columns.map((col) => (
                <td key={col} style={styles.td}>
                  {renderCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const [selectedModule, setSelectedModule] = useState("segmentation");
  // Skip the table fetch entirely when the Charts tab is active (no /api/analytics/charts endpoint exists)
  const { data, loading, error, refetch } = useAnalytics(selectedModule === "charts" ? null : selectedModule);

  // Phase 14.9 — chart data + per-customer selection for the Moving Averages chart
  const {
    movingData,
    revenueData,
    loading: chartLoading,
    error: chartError,
    refetch: refetchCharts,
  } = useChartData();
  const [selectedCustomerForChart, setSelectedCustomerForChart] = useState(1);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p className="text-eyebrow" style={{ marginBottom: "var(--space-sm)" }}>Window Functions · M1–M10</p>
        <h1 style={styles.title}>Analytics</h1>
        <p style={styles.description}>SQL window function results from M1–M10 modules</p>
      </div>

      <div style={styles.moduleSelector}>
        {MODULES.map((m) => {
          const active = selectedModule === m.id;
          return (
            <button
              key={m.id}
              style={{ ...styles.moduleBtn, ...(active ? styles.moduleBtnActive : {}) }}
              onClick={() => setSelectedModule(m.id)}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--color-mute)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--color-hairline)"; }}
            >
              <span style={{ ...styles.moduleBtnLabel, color: active ? "var(--color-primary)" : "var(--color-ink)" }}>{m.label}</span>
              <span style={styles.moduleBtnDesc}>{m.description}</span>
            </button>
          );
        })}
      </div>

      {selectedModule === "charts" ? (
        /* ── Phase 14.9 — Time Series Chart Layer ──────────────────────── */
        <div>
          <div style={styles.chartToolbar}>
            <span style={styles.chartToolbarHint}>
              {chartLoading ? "Loading chart data…" : `${movingData.length} order rows · 3 charts`}
            </span>
            {/* M3 filled-tonal button — Refresh */}
            <button
              type="button"
              onClick={refetchCharts}
              disabled={chartLoading}
              style={styles.refreshBtn}
              onMouseEnter={(e) => { if (!chartLoading) e.currentTarget.style.backgroundColor = "rgba(0,217,146,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,217,146,0.10)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
          </div>

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
              <OrderTimelineChart data={revenueData} />
            </>
          )}
        </div>
      ) : (
        <div style={styles.results}>
          {loading && <LoadingSpinner message="Running window function query..." />}
          {error && <ErrorBanner message={error} onRetry={refetch} />}
          {data && !loading && (
            <>
              <div style={styles.resultHeader}>
                <h2 style={styles.resultTitle}>{data.description}</h2>
                <span style={styles.rowCount}>{data.row_count} rows returned</span>
              </div>
              {selectedModule === "mega-report"
                ? <MegaReportTable data={data.data} />
                : <AnalyticsTable data={data.data} />
              }
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-5xl) var(--page-gutter)" },
  header: { marginBottom: "var(--space-2xl)" },
  title: {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-display-lg-size)",
    fontWeight: "var(--text-display-lg-weight)",
    lineHeight: "var(--text-display-lg-lh)",
    letterSpacing: "var(--text-display-lg-ls)",
    color: "var(--color-ink-strong)",
    margin: "0 0 var(--space-sm)",
  },
  description: { color: "var(--color-body)", fontSize: "var(--text-body-md-size)", margin: 0 },
  moduleSelector: { display: "flex", gap: "var(--space-md)", flexWrap: "wrap", marginBottom: "var(--space-3xl)" },
  moduleBtn: {
    display: "flex", flexDirection: "column", gap: "var(--space-xs)",
    padding: "var(--space-md) var(--space-lg)",
    backgroundColor: "var(--color-canvas)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--radius-md)",
    cursor: "pointer", textAlign: "left", minWidth: "220px",
    transition: "border-color var(--transition-fast), background-color var(--transition-fast)",
  },
  moduleBtnActive: {
    backgroundColor: "var(--color-canvas-soft)",
    borderColor: "var(--color-primary)",
  },
  moduleBtnLabel: { fontSize: "var(--text-body-sm-size)", fontWeight: "var(--text-body-sm-strong-weight)" },
  moduleBtnDesc: { fontSize: "var(--text-caption-size)", color: "var(--color-mute)" },
  results: {
    backgroundColor: "var(--color-canvas)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-2xl)",
  },
  resultHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-lg)", marginBottom: "var(--space-xl)", flexWrap: "wrap" },
  resultTitle: { fontSize: "var(--text-display-sm-size)", fontWeight: "var(--text-display-sm-weight)", color: "var(--color-ink-strong)", margin: 0 },
  rowCount: {
    backgroundColor: "rgba(0, 217, 146, 0.12)",
    color: "var(--color-primary)",
    border: "1px solid rgba(0, 217, 146, 0.25)",
    padding: "var(--space-xxs) var(--space-md)",
    borderRadius: "var(--radius-pill)",
    fontSize: "var(--text-caption-size)",
    fontWeight: "var(--text-body-sm-strong-weight)",
    whiteSpace: "nowrap",
  },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "var(--color-canvas)", fontFamily: "var(--font-sans)" },
  th: {
    padding: "var(--space-md) var(--space-lg)",
    textAlign: "left",
    backgroundColor: "var(--color-canvas-soft)",
    color: "var(--color-mute)",
    fontSize: "var(--text-caption-size)",
    fontWeight: "600",
    letterSpacing: "var(--text-eyebrow-mono-ls)",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--color-hairline)",
  },
  tr: { borderBottom: "1px solid var(--color-hairline)", transition: "background-color var(--transition-fast)" },
  td: {
    padding: "var(--space-md) var(--space-lg)",
    fontSize: "var(--text-body-sm-size)",
    color: "var(--color-ink)",
    whiteSpace: "nowrap",
  },
  // Phase 14.9 — chart toolbar (M3 filled-tonal Refresh button)
  chartToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-md)",
    marginBottom: "var(--space-lg)",
    flexWrap: "wrap",
  },
  chartToolbarHint: {
    fontSize: "var(--text-caption-size)",
    color: "var(--color-mute)",
    fontFamily: "var(--font-sans)",
  },
  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-xs)",
    padding: "var(--space-sm) var(--space-lg)",
    backgroundColor: "rgba(0,217,146,0.10)",   // M3 secondary-container tonal fill
    color: "var(--color-primary)",
    border: "none",
    borderRadius: M3.shape.full,                // M3 button = corner-full
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-button-md-size)",
    fontWeight: "var(--text-button-md-weight)",
    cursor: "pointer",
    transition: `background-color ${M3.motion.durationShort} ${M3.motion.standard}`,
  },
};
