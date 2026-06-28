import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import SqlEditor from "./pages/SqlEditor";

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
            <Route path="/sql-editor" element={<SqlEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
