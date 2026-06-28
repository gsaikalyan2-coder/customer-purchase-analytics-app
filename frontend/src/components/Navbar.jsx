import { NavLink } from "react-router-dom";
import {
  IconLightning,
  IconDashboard,
  IconUsers,
  IconBox,
  IconShoppingCart,
  IconBarChart,
} from "./Icons";

/* Skip link target: <main id="main-content"> in App.jsx */

const navItems = [
  { path: "/",           label: "Dashboard",  Icon: IconDashboard    },
  { path: "/customers",  label: "Customers",  Icon: IconUsers        },
  { path: "/products",   label: "Products",   Icon: IconBox          },
  { path: "/orders",     label: "Orders",     Icon: IconShoppingCart },
  { path: "/analytics",  label: "Analytics",  Icon: IconBarChart     },
  { path: "/sql-editor", label: "SQL Editor", Icon: IconBarChart     },
];

export default function Navbar() {
  return (
    <>
      {/* ── Accessibility: Skip to main content ─────────────────────
          WCAG 2.1 SC 2.4.1 — keyboard users can bypass the nav.
          Visually hidden until focused.
          ──────────────────────────────────────────────────────────── */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: "-40px",
          left: 0,
          backgroundColor: "var(--color-primary)",
          color: "var(--color-on-primary)",
          padding: "var(--space-sm) var(--space-lg)",
          fontSize: "var(--text-body-sm-size)",
          fontWeight: "600",
          zIndex: "var(--z-toast)",
          borderRadius: "0 0 var(--radius-sm) 0",
          textDecoration: "none",
          transition: "top var(--transition-fast)",
        }}
        onFocus={(e) => { e.currentTarget.style.top = "0"; }}
        onBlur={(e)  => { e.currentTarget.style.top = "-40px"; }}
      >
        Skip to main content
      </a>

      {/* ── Navbar ──────────────────────────────────────────────────
          Source: DESIGN-voltagent.md §nav-bar
          backgroundColor: {colors.canvas}  #101010
          padding: {spacing.md} {spacing.3xl}  →  12px 32px
          position: fixed (top: 0), z-index: --z-sticky (100)
          Bottom border: 1px solid {colors.hairline} — brand edge treatment
          ──────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "var(--navbar-height)",
          backgroundColor: "var(--color-canvas)",
          borderBottom: "1px solid var(--color-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-md) var(--page-gutter)",
          zIndex: "var(--z-sticky)",
        }}
      >
        {/* ── Brand Mark ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <IconLightning size={22} />

          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-md-size)",
            fontWeight: "var(--text-body-md-strong-weight)",
            lineHeight: "var(--text-body-md-strong-lh)",
            color: "var(--color-ink-strong)",
            letterSpacing: "-0.2px",
          }}>
            Analytics
          </span>

          {/* Status pill — {rounded.pill} 9999px; primary green */}
          <span style={{
            backgroundColor: "rgba(0, 217, 146, 0.12)",
            color: "var(--color-primary)",
            border: "1px solid rgba(0, 217, 146, 0.25)",
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-xxs) var(--space-md)",
            fontSize: "var(--text-caption-size)",
            fontWeight: "600",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}>
            Live
          </span>
        </div>

        {/* ── Nav Links ─────────────────────────────────────────── */}
        <ul
          role="list"
          style={{
            display: "flex",
            listStyle: "none",
            gap: "var(--space-xs)",
            alignItems: "center",
          }}
        >
          {navItems.map(({ path, label, Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={path === "/"}
                style={({ isActive }) => ({
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-sm) var(--space-md)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: isActive ? "600" : "var(--text-body-sm-weight)",
                  lineHeight: "var(--text-body-sm-lh)",
                  color: isActive ? "var(--color-ink-strong)" : "var(--color-body)",
                  textDecoration: "none",
                  borderRadius: "var(--radius-sm)",
                  borderBottom: isActive
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                  transition: "color var(--transition-fast), border-color var(--transition-fast)",
                  outline: "none",
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    e.currentTarget.style.color = "var(--color-ink)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    e.currentTarget.style.color = "var(--color-body)";
                  }
                }}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
