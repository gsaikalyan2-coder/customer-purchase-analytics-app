/**
 * chartTheme.js — Recharts colour and style tokens.
 *
 * All colour values are derived from DESIGN-voltagent.md (the mandated palette).
 * Do not hardcode colours in chart components — reference these exports.
 *
 * Material 3 design language (Phase 14.9 request):
 *   Because Material 3 has no official web chart component library
 *   (@material/web is maintenance-only and ships no charts), M3 is applied as a
 *   design language layered onto Recharts — shape scale, tonal elevation, state
 *   layers, M3 type roles, and M3 motion easing — while keeping the Voltagent
 *   dark palette. Those M3 tokens live in M3 below and are consumed by
 *   ChartContainer and the chart controls.
 */

export const CUSTOMER_COLORS = {
  1: "#00d992",   // Aanya Sharma   — primary green
  2: "#2fd6a1",   // Rohan Mehta    — primary soft
  3: "#60a5fa",   // Priya Nair     — blue
  4: "#f59e0b",   // Karan Kapoor   — amber
  5: "#c084fc",   // Sneha Joshi    — purple
  6: "#fb923c",   // Vikram Rao     — orange
  7: "#f472b6",   // Divya Reddy    — pink
};

// Customer names in ID order — for legend labels
export const CUSTOMER_NAMES = {
  1: "Aanya Sharma",
  2: "Rohan Mehta",
  3: "Priya Nair",
  4: "Karan Kapoor",
  5: "Sneha Joshi",
  6: "Vikram Rao",
  7: "Divya Reddy",
};

export const CHART_THEME = {
  background:    "transparent",
  cartesianGrid: "rgba(61, 58, 57, 0.4)",
  axisText:      "#8b949e",
  axisLine:      "#3d3a39",
  tooltipBg:     "#1a1a1a",
  tooltipBorder: "#3d3a39",
  tooltipText:   "#f2f2f2",
  fontFamily:    "Inter, system-ui, -apple-system, sans-serif",
  fontSize:      11,
};

export const MOVING_AVG_COLORS = {
  actual:     "#3d3a39",    // hairline — dashed actual order amount
  moving3:    "#00d992",    // primary — 3-order moving average
  moving5:    "#2fd6a1",    // primary-soft — 5-order moving average
};

/**
 * Material 3 design tokens, mapped onto the Voltagent dark palette.
 * Used for chart-card chrome and interactive controls so the Recharts layer
 * reads as Material 3 (shape, tonal elevation, state layers, motion) without
 * abandoning the mandated palette.
 */
export const M3 = {
  // Shape scale (m3.material.io shape corners)
  shape: {
    extraSmall: "4px",
    small:      "8px",
    medium:     "12px",
    large:      "16px",
    full:       "9999px",
  },
  // Tonal elevation as box-shadow (dark-surface friendly; M3 uses tonal color
  // as the primary cue, with a soft shadow only for separation from busy bg)
  elevation: {
    level0: "none",
    level1: "0 1px 2px rgba(0,0,0,0.30), 0 1px 3px rgba(0,0,0,0.18)",
    level2: "0 1px 2px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.22)",
  },
  // M3 motion easing + durations (legacy easing set, valid for web transitions)
  motion: {
    emphasized:           "cubic-bezier(0.2, 0, 0, 1)",
    emphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
    standard:             "cubic-bezier(0.2, 0, 0, 1)",
    durationShort:        "200ms",
    durationMedium:       "300ms",
  },
  // State-layer opacities (M3 interaction states)
  state: {
    hover:   0.08,
    focus:   0.10,
    pressed: 0.10,
  },
};

// INR currency formatter for axis ticks and tooltips
export const formatINR = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);

// Short date formatter for X-axis ticks
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
};
