import { useProducts } from "../hooks/useProducts";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { Badge } from "../components/Badge";

export default function Products() {
  const { products, loading, error } = useProducts();

  if (loading) return <LoadingSpinner message="Loading products..." />;
  if (error) return <div style={styles.page}><ErrorBanner message={error} /></div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Products</h1>
        <span style={styles.count}>{products.length} total</span>
      </div>
      <div style={styles.grid}>
        {products.map((p) => (
          <div
            key={p.product_id}
            style={styles.card}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-glow)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={styles.cardTop}>
              <Badge label={p.category} />
              <span style={styles.id}>#{p.product_id}</span>
            </div>
            <p style={styles.productName}>{p.product_name}</p>
            <p style={styles.brand}>{p.brand}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Feature-card grid — DESIGN-voltagent.md §card-feature (1-up → 2-up → 3-up) */
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "var(--space-lg)",
  },
  card: {
    backgroundColor: "var(--color-canvas)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-2xl)",
    transition: "box-shadow var(--transition-base)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" },
  id: { fontSize: "var(--text-caption-size)", color: "var(--color-mute)", fontFamily: "var(--font-mono)" },
  productName: {
    margin: "0 0 var(--space-xs)",
    fontWeight: "var(--text-body-md-strong-weight)",
    color: "var(--color-ink-strong)",
    fontSize: "var(--text-body-md-size)",
  },
  brand: { margin: 0, color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)" },
};
