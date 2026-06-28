# Phase 14.5 — Voltagent Design System Redesign
## Dashboard UI/UX Overhaul Sub-Plan
**Runs between:** Phase 14 (Req #43 Mega Report) and Phase 15 (Final Integration Testing)**
**Project:** Customer Purchase Analytics — Full-Stack Integration**
**Author:** Saikalyan G | Incedo Inc. Internship Task 2**
**Design Authority:** `DESIGN-voltagent.md` (Voltagent design language v:alpha)**
**Stack:** React 18 + Vite + inline CSS (existing codebase)**
**Target Directory:** `C:\Users\saika\Downloads\customer-purchase-analytics-app\frontend\`**

---

## ⚠️ Claude Cowork Execution Rules

Before touching any file:
1. Read every section of this document in full before writing a single line of code
2. All design decisions reference `DESIGN-voltagent.md` — do not invent values that aren't in it
3. Work file by file. After each file, confirm it renders without error before proceeding
4. Do not install any new npm packages unless explicitly listed in §6.1
5. All existing data-fetching logic and API calls must remain 100% intact — this phase is styling only
6. Never hardcode hex values in component files — only reference CSS variables defined in `index.css`
7. Wait for Saikalyan to confirm each sub-task before moving to the next

---

## 0. Sub-Plan Overview

```
Phase 14.5 consists of 6 sequential sub-tasks:

  ST-1  Design Token Foundation      (~1.5 hrs)
  ST-2  Layout & Grid Restructure    (~2.0 hrs)
  ST-3  Navbar Redesign              (~1.0 hr)
  ST-4  Component Library Upgrade    (~2.0 hrs)
  ST-5  Icon System Overhaul         (~1.5 hrs)
  ST-6  Validation & Testing         (~1.0 hr)
                              ─────────────────
  TOTAL ESTIMATE                      ~9.0 hrs
```

**Dependency map:**
```
ST-1 ──► ST-2 ──► ST-3 ──► ST-4 ──► ST-5 ──► ST-6
  └──────────────────────────────────────────────────► Phase 15
```
ST-1 must complete before any other sub-task. All others are sequential.

---

## 1. Design Token Foundation (ST-1)

**Estimated time:** 1.5 hours
**Files modified:** `frontend/src/index.css` (full replacement)
**Depends on:** Nothing — this is the root of all changes

### Objective

Replace all hardcoded style values scattered across component inline styles with a single CSS custom property token system that maps 1:1 to `DESIGN-voltagent.md`. Every colour, spacing, radius, and typography value used in subsequent sub-tasks must come from this file.

### Why this runs first

The existing codebase uses hardcoded hex values like `#1e3a5f`, `#c9a227`, `#64748b`, and `#f8fafc` scattered across 10+ component files. These are the old Navy/Gold palette from the original internship project. They must be replaced wholesale with the Voltagent dark canvas system.

### 1.1 — Complete `index.css` Replacement

Claude Cowork: **Replace the entire contents** of `frontend/src/index.css` with the following. This file defines every design token used in the entire application.

```css
/* ═══════════════════════════════════════════════════════════════════
   CUSTOMER PURCHASE ANALYTICS — DESIGN TOKENS
   Source: DESIGN-voltagent.md (Voltagent design language v:alpha)
   All values are 1:1 mapped from the design system.
   DO NOT add hardcoded hex values in component files.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Color Tokens ───────────────────────────────────────────────── */
:root {
  /* Brand Accent — reserved for CTAs, status pills, active indicators */
  --color-primary:        #00d992;
  --color-primary-soft:   #2fd6a1;
  --color-primary-deep:   #10b981;
  --color-on-primary:     #101010;

  /* Surface */
  --color-canvas:         #101010;
  --color-canvas-soft:    #1a1a1a;
  --color-canvas-text-soft: #f5f6f7;

  /* Text */
  --color-ink:            #f2f2f2;
  --color-ink-strong:     #ffffff;
  --color-body:           #bdbdbd;
  --color-mute:           #8b949e;

  /* Borders */
  --color-hairline:       #3d3a39;
  --color-hairline-soft:  #b8b3b0;

  /* ── Semantic Colours (dashboard-specific) ── */
  --color-success:        #00d992;  /* primary green = success in this system */
  --color-warning:        #f59e0b;  /* amber for declining trends */
  --color-danger:         #f87171;  /* red for negative spend change */
  --color-neutral:        #8b949e;  /* mute for first-purchase labels */

  /* ── Spacing Scale (base unit: 4px) ── */
  --space-xxs:  2px;
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   12px;
  --space-lg:   16px;
  --space-xl:   20px;
  --space-2xl:  24px;
  --space-3xl:  32px;
  --space-4xl:  40px;
  --space-5xl:  48px;
  --space-6xl:  64px;

  /* ── Border Radius Scale ── */
  --radius-none: 0px;
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-pill: 9999px;
  --radius-full: 9999px;

  /* ── Typography Scale ── */
  --font-sans: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;

  /* Display */
  --text-display-xl-size:    60px;
  --text-display-xl-weight:  400;
  --text-display-xl-lh:      60px;
  --text-display-xl-ls:      -0.65px;

  --text-display-lg-size:    36px;
  --text-display-lg-weight:  400;
  --text-display-lg-lh:      40px;
  --text-display-lg-ls:      -0.9px;

  --text-display-md-size:    24px;
  --text-display-md-weight:  700;
  --text-display-md-lh:      32px;
  --text-display-md-ls:      -0.6px;

  --text-display-sm-size:    20px;
  --text-display-sm-weight:  600;
  --text-display-sm-lh:      28px;

  /* Eyebrow */
  --text-eyebrow-mono-size:    14px;
  --text-eyebrow-mono-weight:  600;
  --text-eyebrow-mono-lh:      20px;
  --text-eyebrow-mono-ls:      2.52px;

  /* Body */
  --text-body-lg-size:    18px;
  --text-body-lg-weight:  400;
  --text-body-lg-lh:      28px;

  --text-body-md-size:    16px;
  --text-body-md-weight:  400;
  --text-body-md-lh:      26px;

  --text-body-md-strong-weight: 600;
  --text-body-md-strong-lh:     24px;

  --text-body-sm-size:    14px;
  --text-body-sm-weight:  400;
  --text-body-sm-lh:      20px;

  --text-body-sm-strong-weight: 600;
  --text-body-sm-strong-lh:     23px;

  /* Caption */
  --text-caption-size:    12px;
  --text-caption-weight:  400;
  --text-caption-lh:      16px;

  /* Code */
  --text-code-size:    13px;
  --text-code-weight:  400;
  --text-code-lh:      18px;

  /* Button */
  --text-button-md-size:    16px;
  --text-button-md-weight:  600;
  --text-button-md-lh:      24px;

  /* ── Elevation (from DESIGN-voltagent.md §Elevation & Depth) ── */
  --shadow-none:   none;
  --shadow-glow:   0 0 15px rgba(92, 88, 85, 0.2);
  --shadow-modal:  0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(148,163,184,0.1) inset;
  --shadow-primary-glow: 0 0 20px rgba(0, 217, 146, 0.15);

  /* ── Z-index Scale ── */
  --z-base:    0;
  --z-raised:  10;
  --z-sticky:  100;
  --z-overlay: 200;
  --z-modal:   300;
  --z-toast:   400;

  /* ── Animation ── */
  --transition-fast:   150ms ease;
  --transition-base:   200ms ease;
  --transition-slow:   300ms ease;

  /* ── Layout ── */
  --container-max:  1280px;
  --navbar-height:  60px;
  --sidebar-width:  240px;
  --page-gutter:    var(--space-3xl);
}

/* ── Global Reset ─────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-body-md-size);
  font-weight: var(--text-body-md-weight);
  line-height: var(--text-body-md-lh);
  color: var(--color-ink);
  background-color: var(--color-canvas);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Inter OpenType features as specified in DESIGN-voltagent.md */
  font-feature-settings: "calt" 1, "rlig" 1;
}

/* ── Focus Rings (WCAG AA — do not remove) ─────────────────────── */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}

/* ── Scrollbar (dark theme) ─────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-canvas); }
::-webkit-scrollbar-thumb { background: var(--color-hairline); border-radius: var(--radius-pill); }
::-webkit-scrollbar-thumb:hover { background: var(--color-mute); }

/* ── Typography Utility Classes ─────────────────────────────────── */
.text-display-xl {
  font-family: var(--font-sans);
  font-size: var(--text-display-xl-size);
  font-weight: var(--text-display-xl-weight);
  line-height: var(--text-display-xl-lh);
  letter-spacing: var(--text-display-xl-ls);
}

.text-display-lg {
  font-family: var(--font-sans);
  font-size: var(--text-display-lg-size);
  font-weight: var(--text-display-lg-weight);
  line-height: var(--text-display-lg-lh);
  letter-spacing: var(--text-display-lg-ls);
}

.text-display-md {
  font-family: var(--font-sans);
  font-size: var(--text-display-md-size);
  font-weight: var(--text-display-md-weight);
  line-height: var(--text-display-md-lh);
  letter-spacing: var(--text-display-md-ls);
}

.text-display-sm {
  font-family: var(--font-sans);
  font-size: var(--text-display-sm-size);
  font-weight: var(--text-display-sm-weight);
  line-height: var(--text-display-sm-lh);
}

.text-eyebrow {
  font-family: var(--font-sans);
  font-size: var(--text-eyebrow-mono-size);
  font-weight: var(--text-eyebrow-mono-weight);
  line-height: var(--text-eyebrow-mono-lh);
  letter-spacing: var(--text-eyebrow-mono-ls);
  text-transform: uppercase;
  color: var(--color-primary);
}

.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-code-size);
  font-weight: var(--text-code-weight);
  line-height: var(--text-code-lh);
}

.text-mute { color: var(--color-mute); }
.text-body { color: var(--color-body); }
.text-ink  { color: var(--color-ink); }
.text-primary { color: var(--color-primary); }

/* ── Code Inline Chip ────────────────────────────────────────────── */
code, .code-chip {
  font-family: var(--font-mono);
  font-size: var(--text-code-size);
  background: var(--color-canvas-soft);
  color: var(--color-canvas-text-soft);
  padding: var(--space-xxs) var(--space-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-hairline);
}

/* ── Section Divider (dashed rhythm cue from DESIGN-voltagent.md) ── */
.section-divider {
  border: none;
  border-top: 1px dashed rgba(79, 93, 117, 0.4);
  margin: var(--space-5xl) 0;
}

/* ── Green Divider Band ────────────────────────────────────────── */
.green-divider-band {
  border-top: 2px solid var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding: var(--space-sm) 0;
}

/* ── Reduced Motion ──────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Responsive Breakpoints ──────────────────────────────────────── */
/* Mobile  < 768px  — hero 60→32px, cards 1-up, nav hamburger       */
/* Tablet  768–1023px — cards 2-up, nav horizontal                   */
/* Desktop ≥ 1024px  — full 3-up grids, sidebar                      */
```

### 1.2 — Verification for ST-1

After writing `index.css`, Claude Cowork must:

1. Open browser at `http://localhost:5173`
2. Confirm background is `#101010` (near-black canvas)
3. Open browser DevTools → Elements → Select `<body>` → Confirm `background-color: rgb(16, 16, 16)`
4. Confirm `--color-primary` is `#00d992` in computed styles
5. Confirm no console errors

**ST-1 sign-off message:**
```
✅ ST-1 COMPLETE — Design token foundation installed
  - 20 colour tokens mapped from DESIGN-voltagent.md
  - 11 spacing tokens (2px–64px, base unit 4px)
  - 5 border-radius tokens
  - 14 typography scale tokens
  - Elevation shadows defined
  - Canvas background #101010 confirmed in browser
```

---

## 2. Layout & Grid Restructure (ST-2)

**Estimated time:** 2.0 hours
**Files modified:**
- `frontend/src/App.jsx` (shell layout)
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Orders.jsx`
**Depends on:** ST-1 complete

### Objective

Replace the basic padding-only layout with a proper app shell. The app gets a sticky navbar, a full-height dark canvas layout, a max-width container, and content-band spacing aligned to the `{spacing.5xl}` / `{spacing.3xl}` system from `DESIGN-voltagent.md`. The Dashboard KPI grid moves from a uniform 7-card grid to an intentional asymmetric 2-3-2 bento layout.

### 2.1 — App.jsx Shell Update

Claude Cowork: Replace `frontend/src/App.jsx` entirely:

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <BrowserRouter>
      {/*
        App shell — full-height dark canvas layout.
        Source: DESIGN-voltagent.md §nav-bar + §content-band
        - Navbar fixed at top (--navbar-height: 60px)
        - Main content offset by navbar height
        - Canvas background runs edge-to-edge (no light mode)
      */}
      <div style={{
        minHeight: "100dvh",              /* dvh prevents iOS Safari jump */
        backgroundColor: "var(--color-canvas)",
        display: "flex",
        flexDirection: "column",
      }}>
        <Navbar />

        {/* Page content area — offset by sticky navbar */}
        <main
          id="main-content"              /* skip-link target */
          style={{
            flex: 1,
            paddingTop: "var(--navbar-height)",
          }}
        >
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/customers"  element={<Customers />} />
            <Route path="/products"   element={<Products />} />
            <Route path="/orders"     element={<Orders />} />
            <Route path="/analytics"  element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

### 2.2 — Page Container Helper (inline in each page)

Every page must use this container pattern for consistent width and gutter alignment:

```jsx
// Standard page container pattern — use in all 5 pages
// Source: DESIGN-voltagent.md §Grid & Container
// max-width ~1280px, horizontal gutter {spacing.3xl} (32px) desktop
const pageContainer = {
  maxWidth: "var(--container-max)",
  margin: "0 auto",
  padding: "var(--space-5xl) var(--page-gutter)",  /* 48px top/bottom, 32px sides */
};

// Mobile overrides must be handled via CSS @media or inline style
```

### 2.3 — Dashboard.jsx Layout Redesign

The current Dashboard uses a flat 7-equal-card grid. Per `DESIGN-voltagent.md`:
- Feature-card grids are **2-up to 3-up at desktop**, **1-up at mobile**
- Cards use `{spacing.2xl}` (24px) padding
- Section headline uses `{typography.display-lg}` (36px)
- Eyebrow above headline uses `{typography.eyebrow-mono}` (uppercase, 2.52px tracking, green)

Claude Cowork: Replace `frontend/src/pages/Dashboard.jsx` entirely:

```jsx
import { useDashboard } from "../hooks/useAnalytics";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

/* ─── KPI Card ─────────────────────────────────────────────────────
   Source: DESIGN-voltagent.md §card-feature
   Background:   {colors.canvas}    #101010
   Border:       1px solid {colors.hairline}  #3d3a39
   Radius:       {rounded.md}  8px
   Padding:      {spacing.2xl}  24px
   Hover:        Level 2 glow — 0 0 15px rgba(92,88,85,0.2)
   ─────────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, accent = false, wide = false }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-canvas)",
        border: accent
          ? "2px solid var(--color-primary)"        /* featured card: 2px primary green */
          : "1px solid var(--color-hairline)",       /* standard card: hairline border */
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2xl)",
        gridColumn: wide ? "span 2" : "span 1",
        cursor: "default",
        transition: "box-shadow var(--transition-base)",
        /* No box-shadow default — hairlines are the brand's elevation system */
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-glow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Eyebrow label — {typography.eyebrow-mono} per DESIGN-voltagent.md */}
      <p style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-eyebrow-mono-size)",       /* 14px */
        fontWeight: "var(--text-eyebrow-mono-weight)",   /* 600 */
        lineHeight: "var(--text-eyebrow-mono-lh)",       /* 20px */
        letterSpacing: "var(--text-eyebrow-mono-ls)",    /* 2.52px */
        textTransform: "uppercase",
        color: "var(--color-mute)",
        margin: "0 0 var(--space-lg) 0",
      }}>
        {label}
      </p>

      {/* Value — {typography.display-md} per DESIGN-voltagent.md */}
      <p style={{
        fontFamily: "var(--font-mono)",                  /* SF Mono for numeric counters */
        fontSize: accent ? "var(--text-display-lg-size)" : "var(--text-display-md-size)",
        fontWeight: accent ? "var(--text-display-lg-weight)" : "var(--text-display-md-weight)",
        lineHeight: accent ? "var(--text-display-lg-lh)" : "var(--text-display-md-lh)",
        letterSpacing: accent ? "var(--text-display-lg-ls)" : "var(--text-display-md-ls)",
        color: accent ? "var(--color-primary)" : "var(--color-ink-strong)",
        margin: 0,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { summary, loading, error } = useDashboard();

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error)   return (
    <div style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "var(--space-5xl) var(--page-gutter)" }}>
      <ErrorBanner message={error} />
    </div>
  );

  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  return (
    /* content-band: {spacing.5xl} top/bottom, {spacing.3xl} sides */
    <div style={{
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "var(--space-5xl) var(--page-gutter)",
    }}>

      {/* ── Section Header ─────────────────────────────────────────── */}
      {/* Eyebrow above headline — eyebrow-mono style from DESIGN-voltagent.md */}
      <p className="text-eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
        Incedo Internship · Task 2
      </p>

      {/* Section headline — {typography.display-lg} 36px / 400 weight */}
      <h1 style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-display-lg-size)",        /* 36px */
        fontWeight: "var(--text-display-lg-weight)",    /* 400 — intentionally calm */
        lineHeight: "var(--text-display-lg-lh)",
        letterSpacing: "var(--text-display-lg-ls)",
        color: "var(--color-ink-strong)",
        margin: "0 0 var(--space-sm) 0",
      }}>
        Customer Analytics
      </h1>

      <p style={{
        fontSize: "var(--text-body-lg-size)",
        fontWeight: "var(--text-body-lg-weight)",
        lineHeight: "var(--text-body-lg-lh)",
        color: "var(--color-body)",
        marginBottom: "var(--space-4xl)",
        maxWidth: "560px",
      }}>
        Jan–Jun 2024 · 7 customers · 8 products · 35 orders
      </p>

      {/* ── Dashed Section Divider — brand rhythm cue ─────────────── */}
      <hr className="section-divider" style={{ marginTop: 0, marginBottom: "var(--space-4xl)" }} />

      {/* ── KPI Grid ──────────────────────────────────────────────────
          Layout: 2-3-2 bento on desktop, 1-up on mobile
          Source: DESIGN-voltagent.md §Grid & Container — 2-up to 3-up desktop
          ─────────────────────────────────────────────────────────── */}

      {/* Row 1 — 2 columns, revenue card spans 2 (accent/featured) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-lg)",
      }}>
        <KpiCard label="Total Revenue" value={fmtINR(summary.total_revenue)} accent wide />
        <KpiCard label="Avg Order Value" value={fmtINR(summary.avg_order_value)} />
      </div>

      {/* Row 2 — 3 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-lg)",
      }}>
        <KpiCard label="Total Orders"    value={summary.total_orders}    />
        <KpiCard label="Total Customers" value={summary.total_customers} />
        <KpiCard label="Total Products"  value={summary.total_products}  />
      </div>

      {/* Row 3 — 2 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-5xl)",
      }}>
        <KpiCard label="Top City"     value={summary.top_city}     />
        <KpiCard label="Top Category" value={summary.top_category} />
      </div>

      {/* ── About Band ─────────────────────────────────────────────── */}
      <hr className="section-divider" />

      <div style={{
        backgroundColor: "var(--color-canvas-soft)",
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2xl)",
      }}>
        {/* Eyebrow */}
        <p className="text-eyebrow" style={{ marginBottom: "var(--space-md)" }}>
          About this project
        </p>

        <p style={{ color: "var(--color-body)", lineHeight: "var(--text-body-md-lh)", marginBottom: "var(--space-md)" }}>
          This application exposes 10 SQL window function modules (M1–M10) and the 43-requirement
          Mega Report via a FastAPI backend connected to a live Supabase PostgreSQL database.
          Navigate to <strong style={{ color: "var(--color-ink)" }}>Analytics</strong> to explore window function results.
        </p>

        <p style={{ color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)" }}>
          <code>Supabase PostgreSQL 17.6</code> · Project ID:{" "}
          <code>ahoqabjdshigaqduiyou</code> · Region: <code>ap-south-1</code>
        </p>
      </div>
    </div>
  );
}
```

### 2.4 — Responsive Mobile Override

Claude Cowork: Add these responsive rules at the bottom of `index.css`:

```css
/* ── Responsive: Dashboard KPI Grid ─────────────────────────────── */
@media (max-width: 767px) {
  /* All grid rows collapse to 1-up on mobile */
  /* page gutter reduces on small screens */
  :root {
    --page-gutter: var(--space-lg);
  }
}

@media (max-width: 1023px) and (min-width: 768px) {
  /* Tablet: 2-up max */
  :root {
    --page-gutter: var(--space-2xl);
  }
}
```

---

## 3. Navbar Redesign (ST-3)

**Estimated time:** 1.0 hour
**Files modified:** `frontend/src/components/Navbar.jsx`
**Depends on:** ST-1 complete

### Objective

Align the Navbar with `DESIGN-voltagent.md §nav-bar` component spec. Replace the current Navy/Gold branded navbar with the dark canvas navbar: `{colors.canvas}` background, `{colors.body}` nav links, `{colors.primary}` active indicator, and a proper skip-link for accessibility.

**Key rules from DESIGN-voltagent.md:**
- `nav-bar`: `backgroundColor: {colors.canvas}`, padding `{spacing.md} {spacing.3xl}` (12px 32px)
- `nav-link`: `textColor: {colors.body}`, `typography: {typography.body-sm}` (14px/400)
- Active link: `color: {colors.ink-strong}` + left `2px solid {colors.primary}` indicator
- Height: `~60px` (12px padding + 24px line-height × 2 = ~60px natural)
- No drop shadow — the brand uses a hairline bottom border instead

Claude Cowork: Replace `frontend/src/components/Navbar.jsx` entirely:

```jsx
import { NavLink } from "react-router-dom";

/* Skip link target: <main id="main-content"> in App.jsx */

const navItems = [
  { path: "/",           label: "Dashboard"  },
  { path: "/customers",  label: "Customers"  },
  { path: "/products",   label: "Products"   },
  { path: "/orders",     label: "Orders"     },
  { path: "/analytics",  label: "Analytics"  },
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
          position: sticky (top: 0), z-index: --z-sticky (100)
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
          {/* Brand glyph — SVG lightning bolt in primary green */}
          {/* Source: DESIGN-voltagent.md — "the brand's lightning glyph" */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
              fill="var(--color-primary)"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Brand name — {typography.body-md-strong} sentence case */}
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
          {/* Source: DESIGN-voltagent.md §button-pill-tag + "live-status indicators" */}
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
        {/* Source: DESIGN-voltagent.md §nav-link
            textColor: {colors.body} #bdbdbd
            typography: {typography.body-sm} 14px/400
            Active: color {colors.ink-strong} + primary underline indicator */}
        <ul
          role="list"
          style={{
            display: "flex",
            listStyle: "none",
            gap: "var(--space-xs)",
            alignItems: "center",
          }}
        >
          {navItems.map(({ path, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={path === "/"}
                style={({ isActive }) => ({
                  display: "inline-block",
                  padding: "var(--space-sm) var(--space-md)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-body-sm-size)",       /* 14px */
                  fontWeight: isActive ? "600" : "var(--text-body-sm-weight)",
                  lineHeight: "var(--text-body-sm-lh)",
                  color: isActive ? "var(--color-ink-strong)" : "var(--color-body)",
                  textDecoration: "none",
                  borderRadius: "var(--radius-sm)",
                  borderBottom: isActive
                    ? "2px solid var(--color-primary)"       /* active indicator */
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
                aria-current={({ isActive }) => isActive ? "page" : undefined}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
```

---

## 4. Component Library Upgrade (ST-4)

**Estimated time:** 2.0 hours
**Files modified:**
- `frontend/src/components/LoadingSpinner.jsx`
- `frontend/src/components/ErrorBanner.jsx`
- `frontend/src/pages/Customers.jsx`
- `frontend/src/pages/Products.jsx`
- `frontend/src/pages/Orders.jsx`
- `frontend/src/pages/Analytics.jsx`
**Depends on:** ST-1, ST-3 complete

### 4.1 — LoadingSpinner.jsx

Claude Cowork: Replace entirely. The spinner uses `{colors.primary}` green per the brand system.

```jsx
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
```

### 4.2 — ErrorBanner.jsx

Claude Cowork: Replace entirely. Uses `{card-feature}` chrome with a red-tinted left border for semantic error signalling.

```jsx
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
```

### 4.3 — Table Component Standard (applies to Customers, Orders)

All tables in this application must follow `DESIGN-voltagent.md §ex-data-table-cell`:
- `headerBackground: {colors.canvas-soft}` — `#1a1a1a`
- `headerTypography: {typography.caption}` — 12px / 400 (eyebrow treatment: uppercase, tracked)
- `bodyTypography: {typography.body-sm}` — 14px / 400
- `cellPadding: {spacing.md} {spacing.lg}` — 12px 16px
- `rowBorder: {colors.hairline}` — 1px solid `#3d3a39`

```jsx
/* Standard shared table styles — reference these in Customers.jsx and Orders.jsx */
const tableStyles = {
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
    padding: "var(--space-md) var(--space-lg)",         /* {spacing.md} {spacing.lg} */
    textAlign: "left",
    backgroundColor: "var(--color-canvas-soft)",        /* {colors.canvas-soft} */
    color: "var(--color-mute)",
    fontSize: "var(--text-caption-size)",               /* {typography.caption} 12px */
    fontWeight: "600",
    letterSpacing: "var(--text-eyebrow-mono-ls)",       /* 2.52px tracking */
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--color-hairline)",
  },
  tr: {
    borderBottom: "1px solid var(--color-hairline)",    /* {colors.hairline} row border */
    transition: "background-color var(--transition-fast)",
  },
  td: {
    padding: "var(--space-md) var(--space-lg)",         /* {spacing.md} {spacing.lg} */
    fontSize: "var(--text-body-sm-size)",               /* {typography.body-sm} 14px */
    fontWeight: "var(--text-body-sm-weight)",
    lineHeight: "var(--text-body-sm-lh)",
    color: "var(--color-ink)",
    whiteSpace: "nowrap",
  },
};
```

Claude Cowork: Apply `tableStyles` to `Customers.jsx` and `Orders.jsx` by replacing all hardcoded `#1e3a5f`, `#f1f5f9`, `#334155`, `#fff` values with the CSS variable equivalents above. Keep all data-fetching hooks and logic unchanged.

### 4.4 — Badge / Pill Standard (applies to Products, Analytics, MegaReportTable)

All badges and status pills must follow `DESIGN-voltagent.md §button-pill-tag`:
- Shape: `{rounded.pill}` — `border-radius: 9999px`
- Padding: `{spacing.xs} {spacing.md}` — `4px 12px`
- Typography: `{typography.body-sm-strong}` — 14px / 600
- Base border: `1px solid {colors.hairline}`

```jsx
/* Standard badge render function — use in Products, Analytics, MegaReportTable */
const BADGE_PALETTE = {
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
  "Top 3":  { bg: "rgba(0, 217, 146, 0.08)",  border: "rgba(0, 217, 146, 0.2)",  text: "var(--color-primary)" },
  "Bottom 3": { bg: "rgba(248, 113, 113, 0.08)", border: "rgba(248, 113, 113, 0.2)", text: "var(--color-danger)" },
  "Mid":    { bg: "rgba(139, 148, 158, 0.08)", border: "rgba(139, 148, 158, 0.2)", text: "var(--color-mute)" },
};

function Badge({ label }) {
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
```

Claude Cowork: Extract this `Badge` component and `BADGE_PALETTE` into `frontend/src/components/Badge.jsx` as a named export. Then import and use it in `Products.jsx`, `Analytics.jsx`, and `MegaReportTable.jsx` to replace all existing badge/pill rendering.

---

## 5. Icon System Overhaul (ST-5)

**Estimated time:** 1.5 hours
**Files modified:** All component files using emoji or placeholder icons
**Depends on:** ST-1, ST-4 complete

### 5.1 — Icon Audit

Claude Cowork: Search the entire `frontend/src/` directory for:
- Any emoji used as UI elements (🎨, 📊, ⚠️, ✅, etc.)
- Any text-based icons
- Any `span` or `div` pretending to be an icon

Command:
```powershell
Select-String -Path "frontend\src\**\*.jsx" -Pattern "[\x{1F300}-\x{1FFFF}]" -Recursive
```

List every file and line where emoji appear.

### 5.2 — Icon Standards

Per `DESIGN-voltagent.md` §Do's and Don'ts and the `ui-ux-pro-max` skill icon rules:

| Rule | Specification |
|------|--------------|
| Format | SVG only — inline `<svg>` for design-critical icons |
| Size tokens | `16px` (sm), `18px` (md), `22px` (lg), `24px` (xl) |
| Stroke width | `1.5px` uniform across all icons — single stroke weight |
| Style | Outline/stroke (not filled) for nav and UI icons; filled only for brand lightning glyph |
| Color | Always use CSS variable — never hardcoded hex |
| Accessibility | `aria-hidden="true"` + `focusable="false"` on decorative icons; `aria-label` on functional icon-only buttons |
| Touch target | Minimum `44×44px` clickable area (use padding if icon is smaller) |

### 5.3 — Icon Library (Inline SVG Set)

Claude Cowork: Create `frontend/src/components/Icons.jsx` with the following SVG icon components. These are custom inline SVGs that match the Voltagent stroke-weight aesthetic:

```jsx
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
```

### 5.4 — Apply Icons to Navbar

Claude Cowork: Update `Navbar.jsx` to import icons from `Icons.jsx` and add them to each nav item:

```jsx
import { IconLightning, IconDashboard, IconUsers, IconBox, IconShoppingCart, IconBarChart } from "./Icons";

const navItems = [
  { path: "/",           label: "Dashboard",  Icon: IconDashboard   },
  { path: "/customers",  label: "Customers",  Icon: IconUsers       },
  { path: "/products",   label: "Products",   Icon: IconBox         },
  { path: "/orders",     label: "Orders",     Icon: IconShoppingCart },
  { path: "/analytics",  label: "Analytics",  Icon: IconBarChart    },
];

/* In the NavLink render, add the icon before the label: */
/* <Icon size={15} />  {label} */
/* Gap between icon and label: gap: "var(--space-sm)" */
/* Icon color inherits from NavLink color via currentColor */
```

---

## 6. Validation & Testing (ST-6)

**Estimated time:** 1.0 hour
**Depends on:** All ST-1 through ST-5 complete

### 6.1 — Colour Contrast Verification

All text/background pairs must meet WCAG AA (4.5:1 for body text, 3:1 for large text).

| Text Colour | Background | Ratio | WCAG |
|------------|-----------|-------|------|
| `{colors.ink}` `#f2f2f2` | `{colors.canvas}` `#101010` | ~15.5:1 | ✅ AAA |
| `{colors.body}` `#bdbdbd` | `{colors.canvas}` `#101010` | ~10.1:1 | ✅ AAA |
| `{colors.mute}` `#8b949e` | `{colors.canvas}` `#101010` | ~6.3:1  | ✅ AA |
| `{colors.primary}` `#00d992` | `{colors.canvas}` `#101010` | ~9.1:1  | ✅ AAA |
| `{colors.on-primary}` `#101010` | `{colors.primary}` `#00d992` | ~9.1:1  | ✅ AAA |
| `{colors.mute}` on `{colors.canvas-soft}` | ~5.9:1 | ✅ AA |

Claude Cowork: Open DevTools → Console and run:

```javascript
// Quick contrast check helper
function getLuminance(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const toLinear = c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b);
}
function contrast(hex1, hex2) {
  const l1 = getLuminance(hex1), l2 = getLuminance(hex2);
  return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2);
}
console.log('ink on canvas:',    contrast('#f2f2f2','#101010'));
console.log('body on canvas:',   contrast('#bdbdbd','#101010'));
console.log('mute on canvas:',   contrast('#8b949e','#101010'));
console.log('primary on canvas:',contrast('#00d992','#101010'));
```

All values must be ≥ 4.5 for body text, ≥ 3.0 for large text (18px+).

### 6.2 — Design Token Audit

Claude Cowork: Search for any remaining hardcoded hex colours in component files:

```powershell
Select-String -Path "frontend\src\**\*.jsx" -Pattern "#[0-9a-fA-F]{3,6}" -Recursive
```

**Acceptable exceptions** (these are semantic values in `BADGE_PALETTE` that are not in the design token file — they are calculated tints):
- `rgba(0, 217, 146, 0.08)` — primary tint at 8% opacity (acceptable tint of `--color-primary`)
- `rgba(248, 113, 113, 0.08)` — danger tint (acceptable semantic tint)
- `rgba(147, 51, 234, 0.08)` — purple category tint (acceptable)

**Not acceptable:**
- Any `#1e3a5f` (old Navy) → must be `var(--color-primary)` or `var(--color-canvas)`
- Any `#c9a227` (old Gold) → must be `var(--color-primary)`
- Any `#f8fafc` (old light background) → must be `var(--color-canvas)` or `var(--color-canvas-soft)`
- Any `#64748b` → must be `var(--color-mute)`
- Any `#fff` or `#ffffff` → must be `var(--color-ink-strong)`

Fix every non-exception hardcoded value before sign-off.

### 6.3 — Icon Audit Verification

```powershell
# Confirm no emoji remain as UI elements
Select-String -Path "frontend\src\**\*.jsx" -Pattern "[\x{1F300}-\x{1FFFF}]" -Recursive
```

Expected result: 0 matches (or only in content strings, not as icon replacements).

### 6.4 — Responsiveness Test Matrix

Claude Cowork: Open browser at `http://localhost:5173` and test each page in DevTools responsive mode:

| Page | Mobile (375px) | Tablet (768px) | Desktop (1280px) |
|------|---------------|----------------|-----------------|
| Dashboard | KPI cards stack 1-up | 2-up grid | 2-3-2 bento |
| Customers | Table scrolls horizontally | Full table | Full table |
| Products | Cards 1-up | Cards 2-up | Cards 3-up |
| Orders | Table scrolls, amounts visible | Full table | Full table |
| Analytics | Module buttons stack | 2 per row | Horizontal row |
| Mega Report | Scrolls horizontally | Scrolls | Color-grouped table |
| Navbar | Links visible (no hamburger this phase) | Horizontal | Horizontal |

### 6.5 — Interaction State Verification

Visit each of these manually and confirm the visual behaviour:

| Element | Hover State | Active/Pressed | Focus (Tab) |
|---------|------------|---------------|-------------|
| Nav links | Color: `--color-ink` | Primary underline border | Green `outline: 2px solid --color-primary` |
| KPI cards | `box-shadow: var(--shadow-glow)` | No transform | 2px outline |
| Retry button | Border/text becomes `--color-primary` | `scale(0.98)` | 2px outline |
| Analytics module buttons | Border shifts | Background `--color-canvas-soft` | 2px outline |

### 6.6 — Performance Baseline

Open DevTools → Lighthouse (or Performance tab):

```
Target metrics:
  LCP (Largest Contentful Paint):   < 2.5s
  CLS (Cumulative Layout Shift):    < 0.1  (no layout jumping from token switch)
  FID / INP:                        < 200ms
  No new network requests added     (this phase is CSS/JSX only)
```

### 6.7 — Cross-browser Spot Check

Test at `http://localhost:5173` in:
- Chrome (primary)
- Edge (Chromium — CSS variable support same as Chrome)
- Firefox (confirm `font-feature-settings: "calt" 1, "rlig" 1` renders Inter correctly)

---

## 7. Prohibited Actions (Claude Cowork Hard Rules)

These are absolute restrictions derived from `DESIGN-voltagent.md §Do's and Don'ts`:

| # | Prohibition | Source |
|---|------------|--------|
| 1 | Do NOT introduce a light mode | "Don't introduce a light-mode counterpart. The brand is dark-canvas only." |
| 2 | Do NOT use `#00d992` as body text | "Don't use the primary green as a body-text fill. It's CTA-only." |
| 3 | Do NOT add `box-shadow` to cards | "Don't drop a soft drop-shadow on cards. Use hairlines + occasional glow, never material shadows." |
| 4 | Do NOT use font-weight 700+ on display headlines | "Don't render the hero headline in heavy weight (700+). The brand's display is intentionally calm at weight 400." |
| 5 | Do NOT change Inter or SF Mono | "Don't replace Inter or SF Mono with a different family." |
| 6 | Do NOT break existing API hooks or data logic | Phase 14.5 is styling only. All `useCustomers`, `useOrders`, `useAnalytics` etc. must remain untouched. |
| 7 | Do NOT introduce gradient backgrounds | "No gradient mesh, no atmospheric backdrop" — per brand description |
| 8 | Do NOT use emoji as icons | Per `ui-ux-pro-max` skill — "Use vector-based icons (e.g., Lucide, Phosphor). Emojis are font-dependent." |
| 9 | Do NOT hardcode hex values in component files | All values must use `var(--token-name)` from `index.css` |
| 10 | Do NOT install new npm packages without listing them here | None are required. This phase uses inline SVG and CSS variables only. |

---

## 8. Timeline & Dependencies Summary

```
                    PHASE 14 (Req #43 Mega Report)
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │         PHASE 14.5 START            │
         └─────────────────────────────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │  ST-1: Design Token Foundation      │  ~1.5 hrs
         │  index.css complete replacement     │
         └─────────────────┬──────────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │  ST-2: Layout & Grid Restructure    │  ~2.0 hrs
         │  App.jsx shell + Dashboard bento    │
         └─────────────────┬──────────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │  ST-3: Navbar Redesign              │  ~1.0 hr
         │  Skip link + dark nav + indicators  │
         └─────────────────┬──────────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │  ST-4: Component Library Upgrade    │  ~2.0 hrs
         │  Spinner, ErrorBanner, Tables,      │
         │  Badge system, page token cleanup   │
         └─────────────────┬──────────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │  ST-5: Icon System Overhaul         │  ~1.5 hrs
         │  Icons.jsx SVG library, Navbar      │
         │  icons, emoji audit                 │
         └─────────────────┬──────────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │  ST-6: Validation & Testing         │  ~1.0 hr
         │  Contrast, token audit, responsive, │
         │  interaction states, Lighthouse     │
         └─────────────────┬──────────────────┘
                           │
                           ▼
                    PHASE 15 (Final Integration Testing)
```

**Total estimated time: ~9 hours**
**Risk buffer: +2 hours for debugging or iteration = ~11 hours worst case**

---

## 9. Phase 14.5 Final Sign-off

Claude Cowork must output this message when all 6 sub-tasks pass:

```
╔══════════════════════════════════════════════════════════════════╗
║         PHASE 14.5 — VOLTAGENT DESIGN SYSTEM REDESIGN           ║
║         All 6 Sub-Tasks Complete                                 ║
╚══════════════════════════════════════════════════════════════════╝

✅ ST-1  Design Token Foundation     — 20 colours, 11 spacing, 14 typography tokens
✅ ST-2  Layout & Grid Restructure   — App shell, bento KPI grid, max-width container
✅ ST-3  Navbar Redesign             — Skip link, hairline border, primary indicator, pill badge
✅ ST-4  Component Library Upgrade   — SVG spinner, semantic ErrorBanner, data table standard, Badge system
✅ ST-5  Icon System Overhaul        — Icons.jsx SVG library, emoji purged, stroke 1.5px uniform
✅ ST-6  Validation & Testing        — Contrast ≥4.5:1 ✓, zero hardcoded hex ✓, responsive ✓, no emoji ✓

DESIGN SYSTEM ADHERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source:   DESIGN-voltagent.md (Voltagent design language v:alpha)
Canvas:   #101010 (dark-only — no light mode)
Accent:   #00d992 (CTAs, status pills, active indicators only)
Type:     Inter (display/body) + SF Mono (code/metrics)
Cards:    Hairline borders only — no box-shadow
Radius:   6px buttons, 8px cards, 9999px pills

WCAG CONTRAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ink on Canvas:    ~15.5:1  ✅ AAA
Body on Canvas:   ~10.1:1  ✅ AAA
Mute on Canvas:   ~6.3:1   ✅ AA
Primary on Canvas: ~9.1:1  ✅ AAA

Ready to proceed to Phase 15 (Final Integration Testing).
```

---

*Phase 14.5 of 15 — Voltagent Design System Redesign*
*Runs between Phase 14 (Req #43) and Phase 15 (Final Integration Testing)*
*Design authority: DESIGN-voltagent.md*
*Customer Purchase Analytics Full-Stack Integration · Saikalyan G · Incedo Inc.*
