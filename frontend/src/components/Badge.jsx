/* ─── Badge.jsx ─────────────────────────────────────────────────────
   Standard badge / status pill — DESIGN-voltagent.md §button-pill-tag
   - Shape:      {rounded.pill}  border-radius: 9999px
   - Padding:    {spacing.xxs} {spacing.md}  →  2px 12px
   - Typography: {typography.body-sm-strong}  →  14px / 600
   - Base border: 1px solid {colors.hairline}
   The rgba() tints below are acceptable semantic tints of design tokens
   (see Phase 14.5 §6.2 — token audit acceptable exceptions).
   ─────────────────────────────────────────────────────────────────── */

export const BADGE_PALETTE = {
  /* Category badges */
  Electronics:  { bg: "rgba(0, 217, 146, 0.08)",  border: "rgba(0, 217, 146, 0.2)",  text: "var(--color-primary-soft)" },
  Apparel:      { bg: "rgba(147, 51, 234, 0.08)", border: "rgba(147, 51, 234, 0.2)", text: "#c084fc" },
  Appliances:   { bg: "rgba(251, 191, 36, 0.08)", border: "rgba(251, 191, 36, 0.2)", text: "#fbbf24" },

  /* Segment badges */
  Platinum:     { bg: "rgba(0, 217, 146, 0.10)",  border: "rgba(0, 217, 146, 0.25)", text: "var(--color-primary)" },
  Gold:         { bg: "rgba(245, 158, 11, 0.10)", border: "rgba(245, 158, 11, 0.25)", text: "#f59e0b" },
  Silver:       { bg: "rgba(139, 148, 158, 0.10)", border: "rgba(139, 148, 158, 0.25)", text: "var(--color-mute)" },
  Bronze:       { bg: "rgba(180, 83, 9, 0.10)",   border: "rgba(180, 83, 9, 0.25)",   text: "#b45309" },

  /* Trend badges */
  "First Purchase": { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.2)", text: "#60a5fa" },
  Higher:           { bg: "rgba(0, 217, 146, 0.08)",  border: "rgba(0, 217, 146, 0.2)",  text: "var(--color-primary)" },
  Lower:            { bg: "rgba(248, 113, 113, 0.08)", border: "rgba(248, 113, 113, 0.2)", text: "var(--color-danger)" },
  Same:             { bg: "rgba(139, 148, 158, 0.08)", border: "rgba(139, 148, 158, 0.2)", text: "var(--color-mute)" },

  /* Performance tier */
  "Top 3":    { bg: "rgba(0, 217, 146, 0.08)",  border: "rgba(0, 217, 146, 0.2)",  text: "var(--color-primary)" },
  "Bottom 3": { bg: "rgba(248, 113, 113, 0.08)", border: "rgba(248, 113, 113, 0.2)", text: "var(--color-danger)" },
  "Mid":      { bg: "rgba(139, 148, 158, 0.08)", border: "rgba(139, 148, 158, 0.2)", text: "var(--color-mute)" },
};

export function Badge({ label }) {
  const colors = BADGE_PALETTE[label] || {
    bg: "var(--color-canvas-soft)",
    border: "var(--color-hairline)",
    text: "var(--color-ink)",
  };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: "var(--radius-pill)",
      padding: "var(--space-xxs) var(--space-md)",       /* 2px 12px */
      fontSize: "var(--text-body-sm-size)",               /* 14px */
      fontWeight: "var(--text-body-sm-strong-weight)",    /* 600 */
      lineHeight: "var(--text-body-sm-lh)",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export default Badge;
