/* ─── Icons.jsx ────────────────────────────────────────────────────
   All icons:
   - Stroke width: 1.5px (uniform)
   - Fill: none (outline style)
   - Color: inherited via currentColor (set by parent CSS)
   - aria-hidden="true" focusable="false" (decorative by default)
   ─────────────────────────────────────────────────────────────────── */

const iconDefaults = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

export function IconLightning({ size = 22, color = "var(--color-primary)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults} style={{ color }}>
      <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" strokeWidth="1.5" />
    </svg>
  );
}

export function IconDashboard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconUsers({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconBox({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

export function IconShoppingCart({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function IconBarChart({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function IconAlert({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function IconRefresh({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export function IconChevronRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...iconDefaults}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
