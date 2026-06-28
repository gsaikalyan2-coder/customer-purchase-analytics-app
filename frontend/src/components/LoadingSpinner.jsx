export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-5xl) var(--space-lg)",
        gap: "var(--space-lg)",
      }}
    >
      {/* SVG spinner — avoids CSS animation on border for GPU perf */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ animation: "spin 0.75s linear infinite" }}
      >
        <circle cx="16" cy="16" r="13" stroke="var(--color-hairline)" strokeWidth="2.5" />
        <path
          d="M16 3 A13 13 0 0 1 29 16"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <p style={{
        color: "var(--color-mute)",
        fontSize: "var(--text-body-sm-size)",
        fontWeight: "var(--text-body-sm-weight)",
        lineHeight: "var(--text-body-sm-lh)",
        margin: 0,
      }}>
        {message}
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          svg[aria-hidden="true"] { animation: none; }
        }
      `}</style>
    </div>
  );
}
