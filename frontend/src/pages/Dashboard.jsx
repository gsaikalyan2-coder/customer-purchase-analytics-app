import { useDashboard } from "../hooks/useAnalytics";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

/* ─── KPI Card ─────────────────────────────────────────────────────
   Source: DESIGN-voltagent.md §card-feature
   Background:   {colors.canvas}    #101010
   Border:       1px solid {colors.hairline}  #3d3a39
   Radius:       {rounded.md}  8px
   Padding:      {spacing.2xl}  24px
   Hover:        Level 2 glow — 0 0 15px rgba(92,88,85,0.2)
   ─────────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, accent = false, wide = false }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-canvas)",
        border: accent
          ? "2px solid var(--color-primary)"        /* featured card: 2px primary green */
          : "1px solid var(--color-hairline)",       /* standard card: hairline border */
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2xl)",
        gridColumn: wide ? "span 2" : "span 1",
        cursor: "default",
        transition: "box-shadow var(--transition-base)",
        /* No box-shadow default — hairlines are the brand's elevation system */
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-glow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Eyebrow label — {typography.eyebrow-mono} per DESIGN-voltagent.md */}
      <p style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-eyebrow-mono-size)",       /* 14px */
        fontWeight: "var(--text-eyebrow-mono-weight)",   /* 600 */
        lineHeight: "var(--text-eyebrow-mono-lh)",       /* 20px */
        letterSpacing: "var(--text-eyebrow-mono-ls)",    /* 2.52px */
        textTransform: "uppercase",
        color: "var(--color-mute)",
        margin: "0 0 var(--space-lg) 0",
      }}>
        {label}
      </p>

      {/* Value — {typography.display-md} per DESIGN-voltagent.md */}
      <p style={{
        fontFamily: "var(--font-mono)",                  /* SF Mono for numeric counters */
        fontSize: accent ? "var(--text-display-lg-size)" : "var(--text-display-md-size)",
        fontWeight: accent ? "var(--text-display-lg-weight)" : "var(--text-display-md-weight)",
        lineHeight: accent ? "var(--text-display-lg-lh)" : "var(--text-display-md-lh)",
        letterSpacing: accent ? "var(--text-display-lg-ls)" : "var(--text-display-md-ls)",
        color: accent ? "var(--color-primary)" : "var(--color-ink-strong)",
        margin: 0,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { summary, loading, error } = useDashboard();

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error)   return (
    <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-5xl) var(--page-gutter)" }}>
      <ErrorBanner message={error} />
    </div>
  );

  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  return (
    /* content-band: {spacing.5xl} top/bottom, {spacing.3xl} sides */
    <div style={{
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "var(--space-5xl) var(--page-gutter)",
    }}>

      {/* ── Section Header ─────────────────────────────────────────── */}
      {/* Eyebrow above headline — eyebrow-mono style from DESIGN-voltagent.md */}
      <p className="text-eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
        Incedo Internship · Task 2
      </p>

      {/* Section headline — {typography.display-lg} 36px / 400 weight */}
      <h1 style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-display-lg-size)",        /* 36px */
        fontWeight: "var(--text-display-lg-weight)",    /* 400 — intentionally calm */
        lineHeight: "var(--text-display-lg-lh)",
        letterSpacing: "var(--text-display-lg-ls)",
        color: "var(--color-ink-strong)",
        margin: "0 0 var(--space-sm) 0",
      }}>
        Customer Analytics
      </h1>

      <p style={{
        fontSize: "var(--text-body-lg-size)",
        fontWeight: "var(--text-body-lg-weight)",
        lineHeight: "var(--text-body-lg-lh)",
        color: "var(--color-body)",
        marginBottom: "var(--space-4xl)",
        maxWidth: "560px",
      }}>
        Jan–Jun 2024 · 7 customers · 8 products · 35 orders
      </p>

      {/* ── Dashed Section Divider — brand rhythm cue ─────────────── */}
      <hr className="section-divider" style={{ marginTop: 0, marginBottom: "var(--space-4xl)" }} />

      {/* ── KPI Grid ──────────────────────────────────────────────────
          Layout: 2-3-2 bento on desktop, 1-up on mobile
          Source: DESIGN-voltagent.md §Grid & Container — 2-up to 3-up desktop
          ─────────────────────────────────────────────────────────── */}

      {/* Row 1 — 2 columns, revenue card spans 2 (accent/featured) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-lg)",
      }}>
        <KpiCard label="Total Revenue" value={fmtINR(summary.total_revenue)} accent wide />
        <KpiCard label="Avg Order Value" value={fmtINR(summary.avg_order_value)} />
      </div>

      {/* Row 2 — 3 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-lg)",
      }}>
        <KpiCard label="Total Orders"    value={summary.total_orders}    />
        <KpiCard label="Total Customers" value={summary.total_customers} />
        <KpiCard label="Total Products"  value={summary.total_products}  />
      </div>

      {/* Row 3 — 2 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-5xl)",
      }}>
        <KpiCard label="Top City"     value={summary.top_city}     />
        <KpiCard label="Top Category" value={summary.top_category} />
      </div>

      {/* ── About Band ─────────────────────────────────────────────── */}
      <hr className="section-divider" />

      <div style={{
        backgroundColor: "var(--color-canvas-soft)",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2xl)",
      }}>
        {/* Eyebrow */}
        <p className="text-eyebrow" style={{ marginBottom: "var(--space-md)" }}>
          About this project
        </p>

        <p style={{ color: "var(--color-body)", lineHeight: "var(--text-body-md-lh)", marginBottom: "var(--space-md)" }}>
          This application exposes 10 SQL window function modules (M1–M10) and the 43-requirement
          Mega Report via a FastAPI backend connected to a live Supabase PostgreSQL database.
          Navigate to <strong style={{ color: "var(--color-ink)" }}>Analytics</strong> to explore window function results.
        </p>

        <p style={{ color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)" }}>
          <code>Supabase PostgreSQL 17.6</code> · Project ID:{" "}
          <code>ahoqabjdshigaqduiyou</code> · Region: <code>ap-south-1</code>
        </p>
      </div>
    </div>
  );
}
