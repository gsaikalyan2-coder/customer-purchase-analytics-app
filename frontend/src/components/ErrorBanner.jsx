export default function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-lg)",
        padding: "var(--space-lg) var(--space-2xl)",
        backgroundColor: "var(--color-canvas-soft)",
        border: "1px solid var(--color-hairline)",
        borderLeft: "3px solid var(--color-danger)",   /* semantic error indicator */
        borderRadius: "var(--radius-md)",
        margin: "var(--space-lg) 0",
      }}
    >
      {/* Error icon — SVG, no emoji */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, marginTop: "2px" }}>
        <circle cx="12" cy="12" r="10" stroke="var(--color-danger)" strokeWidth="1.5" />
        <path d="M12 8v5M12 16h.01" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body-sm-size)",
          fontWeight: "var(--text-body-sm-strong-weight)",
          color: "var(--color-ink)",
          margin: "0 0 var(--space-xs) 0",
        }}>
          Failed to load data
        </p>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body-sm-size)",
          color: "var(--color-body)",
          margin: 0,
        }}>
          {message}
        </p>
      </div>

      {onRetry && (
        /* button-outline-on-dark from DESIGN-voltagent.md */
        <button
          onClick={onRetry}
          style={{
            flexShrink: 0,
            padding: "var(--space-sm) var(--space-lg)",
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm-size)",
            fontWeight: "600",
            cursor: "pointer",
            transition: "border-color var(--transition-fast), color var(--transition-fast)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-hairline)"; e.currentTarget.style.color = "var(--color-ink)"; }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
