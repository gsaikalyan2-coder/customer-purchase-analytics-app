/**
 * ResultsTable — displays SQL query results in all 4 states.
 * Source: DESIGN-voltagent.md §ex-data-table-cell
 */
import { useState } from "react";
import { IconAlert } from "./Icons";

const PAGE_SIZE = 50;

function NullCell() {
  return (
    <span style={{
      color: "var(--color-mute)",
      fontStyle: "italic",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-caption-size)",
    }}>
      NULL
    </span>
  );
}

function PaginationBar({ page, totalPages, onPrev, onNext, rowCount, pageSize }) {
  const start = page * pageSize + 1;
  const end   = Math.min((page + 1) * pageSize, rowCount);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-md) var(--space-lg)",
      borderTop: "1px solid var(--color-hairline)",
      backgroundColor: "var(--color-canvas-soft)",
    }}>
      <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
        Showing {start}–{end} of {rowCount} rows
      </span>
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <button
          onClick={onPrev}
          disabled={page === 0}
          style={paginationBtnStyle(page === 0)}
        >
          ← Prev
        </button>
        <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)", alignSelf: "center" }}>
          Page {page + 1} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          style={paginationBtnStyle(page >= totalPages - 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function paginationBtnStyle(disabled) {
  return {
    padding: "var(--space-xs) var(--space-md)",
    backgroundColor: disabled ? "transparent" : "var(--color-canvas)",
    color: disabled ? "var(--color-mute)" : "var(--color-ink)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "var(--text-caption-size)",
    fontFamily: "var(--font-sans)",
    opacity: disabled ? 0.4 : 1,
    transition: "all var(--transition-fast)",
  };
}

function isNumericColumn(rows, col) {
  const sample = rows.find((r) => r[col] !== null && r[col] !== undefined);
  if (!sample) return false;
  return typeof sample[col] === "number";
}

export default function ResultsTable({ result, error, status, durationMs }) {
  const [page, setPage] = useState(0);

  const rows        = result?.rows || [];
  const columns     = result?.columns || [];
  const totalPages  = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows    = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── State D: No query yet ──────────────────────────────────────────────
  if (status === "idle" && !result && !error) {
    return (
      <div style={emptyStateStyle}>
        <p style={{ color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)", margin: 0 }}>
          Run a query to see results here
        </p>
      </div>
    );
  }

  // ── State C: Error ─────────────────────────────────────────────────────
  if (status === "error" && error) {
    return (
      <div style={{
        margin: 0,
        backgroundColor: "var(--color-canvas-soft)",
        border: "1px solid var(--color-hairline)",
        borderLeft: "3px solid var(--color-danger)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <IconAlert size={16} />
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm-size)",
            fontWeight: "600",
            color: "var(--color-ink)",
          }}>
            Query Error
            {error.error_code && (
              <code style={{
                marginLeft: "var(--space-sm)",
                fontSize: "var(--text-caption-size)",
                color: "var(--color-danger)",
                backgroundColor: "rgba(248,113,113,0.08)",
                padding: "1px 6px",
                borderRadius: "var(--radius-xs)",
              }}>
                {error.error_code}
              </code>
            )}
          </span>
          {durationMs !== null && (
            <span style={{ marginLeft: "auto", fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
              {durationMs}ms
            </span>
          )}
        </div>

        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-code-size)",
          color: "var(--color-body)",
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {error.error_message}
        </p>

        {error.hint && (
          <div style={{
            borderTop: "1px solid var(--color-hairline)",
            paddingTop: "var(--space-md)",
            fontSize: "var(--text-body-sm-size)",
            color: "var(--color-mute)",
            lineHeight: "var(--text-body-md-lh)",
          }}>
            <span style={{ fontWeight: "600", color: "var(--color-primary-soft)" }}>Hint: </span>
            {error.hint}
          </div>
        )}
      </div>
    );
  }

  // ── State B: Success, 0 rows ───────────────────────────────────────────
  if (status === "success" && result && rows.length === 0) {
    return (
      <div style={{ ...emptyStateStyle, border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
        <span style={{ color: "var(--color-primary)", fontSize: "18px" }}>✓</span>
        <p style={{ color: "var(--color-body)", fontSize: "var(--text-body-sm-size)", margin: 0 }}>
          Query executed successfully — 0 rows returned
        </p>
        {durationMs !== null && (
          <p style={{ color: "var(--color-mute)", fontSize: "var(--text-caption-size)", margin: 0 }}>
            {durationMs}ms
          </p>
        )}
      </div>
    );
  }

  // ── State A: Has rows ──────────────────────────────────────────────────
  if (status === "success" && result && rows.length > 0) {
    return (
      <div style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}>
        {/* Results header bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-md) var(--space-lg)",
          backgroundColor: "var(--color-canvas-soft)",
          borderBottom: "1px solid var(--color-hairline)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            {/* Row count pill */}
            <span style={{
              backgroundColor: "rgba(0,217,146,0.10)",
              color: "var(--color-primary)",
              border: "1px solid rgba(0,217,146,0.25)",
              borderRadius: "var(--radius-pill)",
              padding: "var(--space-xxs) var(--space-md)",
              fontSize: "var(--text-caption-size)",
              fontWeight: "600",
            }}>
              {result.row_count} {result.row_count === 1 ? "row" : "rows"}
            </span>
            {result.truncated && (
              <span style={{
                backgroundColor: "rgba(245,158,11,0.10)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "var(--radius-pill)",
                padding: "var(--space-xxs) var(--space-md)",
                fontSize: "var(--text-caption-size)",
                fontWeight: "600",
              }}>
                Truncated at {result.truncated_at}
              </span>
            )}
          </div>
          {durationMs !== null && (
            <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
              Executed in {durationMs}ms
            </span>
          )}
        </div>

        {/* Scrollable table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-sans)",
            backgroundColor: "var(--color-canvas)",
          }}>
            <thead>
              <tr>
                {/* Row number gutter */}
                <th style={{ ...thStyle, width: "40px", color: "var(--color-mute)" }}>#</th>
                {columns.map((col) => (
                  <th key={col} style={{
                    ...thStyle,
                    textAlign: isNumericColumn(rows, col) ? "right" : "left",
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--color-hairline)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-canvas-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Row number */}
                  <td style={{ ...tdStyle, color: "var(--color-mute)", fontFamily: "var(--font-mono)", textAlign: "right", userSelect: "none" }}>
                    {page * PAGE_SIZE + i + 1}
                  </td>
                  {columns.map((col) => {
                    const value = row[col];
                    const isNum = isNumericColumn(rows, col);
                    return (
                      <td key={col} style={{
                        ...tdStyle,
                        textAlign: isNum ? "right" : "left",
                        fontFamily: isNum ? "var(--font-mono)" : "var(--font-sans)",
                        fontVariantNumeric: isNum ? "tabular-nums" : "normal",
                      }}>
                        {value === null || value === undefined ? <NullCell /> : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            rowCount={rows.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          />
        )}
      </div>
    );
  }

  return null;
}

const emptyStateStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-sm)",
  padding: "var(--space-5xl)",
};

const thStyle = {
  padding: "var(--space-md) var(--space-lg)",
  backgroundColor: "var(--color-canvas-soft)",
  color: "var(--color-mute)",
  fontSize: "var(--text-caption-size)",
  fontWeight: "600",
  letterSpacing: "var(--text-eyebrow-mono-ls)",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--color-hairline)",
  fontFamily: "var(--font-sans)",
};

const tdStyle = {
  padding: "var(--space-md) var(--space-lg)",
  fontSize: "var(--text-body-sm-size)",
  color: "var(--color-ink)",
  whiteSpace: "nowrap",
  maxWidth: "320px",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
