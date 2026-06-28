import { useCustomers } from "../hooks/useCustomers";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

export default function Customers() {
  const { customers, loading, error } = useCustomers();

  if (loading) return <LoadingSpinner message="Loading customers..." />;
  if (error) return <div style={styles.page}><ErrorBanner message={error} /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Customers</h1>
        <span style={styles.count}>{customers.length} total</span>
      </div>
      <div style={styles.wrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["ID", "Name", "City", "Signup Date"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr
                key={c.customer_id}
                style={styles.tr}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-canvas-soft)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <td style={styles.td}>{c.customer_id}</td>
                <td style={{ ...styles.td, fontWeight: "600", color: "var(--color-ink-strong)" }}>{c.customer_name}</td>
                <td style={styles.td}>{c.city}</td>
                <td style={styles.td}>{c.signup_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Standard shared table styles — DESIGN-voltagent.md §ex-data-table-cell */
const styles = {
  page: { maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-5xl) var(--page-gutter)" },
  header: { display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-2xl)" },
  title: {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-display-lg-size)",
    fontWeight: "var(--text-display-lg-weight)",
    lineHeight: "var(--text-display-lg-lh)",
    letterSpacing: "var(--text-display-lg-ls)",
    color: "var(--color-ink-strong)",
    margin: 0,
  },
  count: {
    backgroundColor: "rgba(0, 217, 146, 0.12)",
    color: "var(--color-primary)",
    border: "1px solid rgba(0, 217, 146, 0.25)",
    padding: "var(--space-xxs) var(--space-md)",
    borderRadius: "var(--radius-pill)",
    fontSize: "var(--text-body-sm-size)",
    fontWeight: "var(--text-body-sm-strong-weight)",
  },
  wrapper: {
    overflowX: "auto",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-hairline)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "var(--color-canvas)",
    fontFamily: "var(--font-sans)",
  },
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
  tr: {
    borderBottom: "1px solid var(--color-hairline)",
    transition: "background-color var(--transition-fast)",
  },
  td: {
    padding: "var(--space-md) var(--space-lg)",
    fontSize: "var(--text-body-sm-size)",
    fontWeight: "var(--text-body-sm-weight)",
    lineHeight: "var(--text-body-sm-lh)",
    color: "var(--color-ink)",
    whiteSpace: "nowrap",
  },
};
