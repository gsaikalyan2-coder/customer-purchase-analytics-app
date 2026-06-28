/**
 * ChartContainer — shared wrapper for all three chart components.
 *
 * Material 3 design language: this is an M3 *outlined card* (shape-corner-medium,
 * outline-variant border) that lifts to elevation level 1 on hover using a tonal
 * shadow and M3 standard motion easing. The title uses the M3 label/title role
 * (uppercase, tracked); the subtitle uses the body role. Palette stays Voltagent.
 */
import { useState } from "react";
import { M3 } from "./chartTheme";

export default function ChartContainer({ title, subtitle, children, controls }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "var(--color-canvas)",
        border: "1px solid var(--color-hairline)",   /* M3 outline-variant */
        borderRadius: M3.shape.medium,                /* M3 shape-corner-medium (12dp) */
        padding: "var(--space-2xl)",
        marginBottom: "var(--space-xl)",
        boxShadow: hovered ? M3.elevation.level1 : M3.elevation.level0,
        transition: `box-shadow ${M3.motion.durationMedium} ${M3.motion.standard}`,
      }}
    >
      {/* Chart header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "var(--space-xl)",
        flexWrap: "wrap",
        gap: "var(--space-md)",
      }}>
        <div>
          <p style={{
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "2.52px",
            textTransform: "uppercase",
            color: "var(--color-primary)",
            margin: "0 0 var(--space-xs) 0",
            fontFamily: "var(--font-sans)",
          }}>
            {title}
          </p>
          {subtitle && (
            <p style={{
              fontSize: "var(--text-body-sm-size)",
              color: "var(--color-mute)",
              margin: 0,
              fontFamily: "var(--font-sans)",
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {controls && (
          <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", flexWrap: "wrap" }}>
            {controls}
          </div>
        )}
      </div>

      {/* Chart body */}
      {children}
    </div>
  );
}
