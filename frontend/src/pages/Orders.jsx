import { useOrders } from "../hooks/useOrders";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

export default function Orders() {
  const { orders, loading, error } = useOrders();

  if (loading) return <LoadingSpinner message="Loading orders..." />;
  if (error) return <div style={styles.page}><ErrorBanner message={error} /></div>;

  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Orders</h1>
        <span style={styles.count}>{orders.length} total</span>
      </div>
      <p style={styles.note}>
        <strong style={{ color: "var(--color-ink)" }}>Note:</strong> <code>order_amount</code> is calculated at query time
        as <code>ROUND(quantity × unit_price × (1 − discount), 2)</code>. It is never stored in the database.
      </p>
      <div style={styles.wrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Order ID", "Date", "Customer", "Product", "Category", "Qty", "Unit Price", "Discount", "Order Amount"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.order_id}
                style={styles.tr}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-canvas-soft)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <td style={styles.td}>#{o.order_id}</td>
                <td style={styles.td}>{o.order_date}</td>
                <td style={{ ...styles.td, fontWeight: "600", color: "var(--color-ink-strong)" }}>{o.customer_name}</td>
                <td style={styles.td}>{o.product_name}</td>
                <td style={styles.td}>{o.category}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{o.quantity}</td>
                <td style={{ ...styles.td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmtINR(o.unit_price)}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{(o.discount * 100).toFixed(0)}%</td>
                <td style={{ ...styles.td, textAlign: "right", fontWeight: "600", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{fmtINR(o.order_amount)}</td>
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
  header: { display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" },
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
  note: {
    backgroundColor: "var(--color-canvas-soft)",
    border: "1px solid var(--color-hairline)",
    borderLeft: "3px solid var(--color-warning)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-md) var(--space-lg)",
    fontSize: "var(--text-body-sm-size)",
    color: "var(--color-body)",
    marginBottom: "var(--space-xl)",
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
