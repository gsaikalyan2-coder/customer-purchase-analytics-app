/**
 * SqlEditor.jsx — the SQL editor page component.
 *
 * Layout:
 *   Page Header (eyebrow + title + description)
 *   Snippet bar (quick-load sample queries)
 *   Editor card: Schema panel (collapsible) | Editor pane (highlight + textarea) | Footer | Toolbar
 *   Results pane (states A/B/C/D)
 *   History panel (slide-in overlay)
 */
import { useRef, useEffect, useCallback, useState } from "react";
import { useSqlEditor } from "../hooks/useSqlEditor";
import { useQueryHistory } from "../hooks/useQueryHistory";
import { useAiSuggestion } from "../hooks/useAiSuggestion";
import { highlightSql } from "../utils/sqlHighlight";
import ResultsTable from "../components/ResultsTable";
import AiSuggestionPanel from "../components/AiSuggestionPanel";
import { IconUsers, IconBox, IconShoppingCart } from "../components/Icons";
import LoadingSpinner from "../components/LoadingSpinner";

/* ── Schema definition (static — matches live Supabase DB) ──────────── */
const SCHEMA = [
  {
    table: "customers",
    icon: IconUsers,
    columns: [
      { name: "customer_id",   type: "SERIAL PK" },
      { name: "customer_name", type: "VARCHAR(100)" },
      { name: "city",          type: "VARCHAR(50)" },
      { name: "signup_date",   type: "DATE" },
    ],
  },
  {
    table: "products",
    icon: IconBox,
    columns: [
      { name: "product_id",   type: "SERIAL PK" },
      { name: "product_name", type: "VARCHAR(100)" },
      { name: "category",     type: "VARCHAR(50)" },
      { name: "brand",        type: "VARCHAR(50)" },
    ],
  },
  {
    table: "orders",
    icon: IconShoppingCart,
    columns: [
      { name: "order_id",    type: "SERIAL PK" },
      { name: "customer_id", type: "INT FK" },
      { name: "product_id",  type: "INT FK" },
      { name: "order_date",  type: "DATE" },
      { name: "quantity",    type: "INT" },
      { name: "unit_price",  type: "NUMERIC(10,2)" },
      { name: "discount",    type: "NUMERIC(5,2)" },
    ],
  },
];

/* ── SNIPPET LIBRARY ─────────────────────────────────────────────────── */
const SNIPPETS = [
  {
    label: "All customers",
    sql: "SELECT * FROM customers ORDER BY customer_id;",
  },
  {
    label: "Total revenue",
    sql: "SELECT ROUND(SUM(quantity * unit_price * (1 - discount)), 2) AS total_revenue FROM orders;",
  },
  {
    label: "Revenue per customer",
    sql: `SELECT c.customer_name, c.city,
    ROUND(SUM(o.quantity * o.unit_price * (1 - o.discount)), 2) AS total_revenue,
    COUNT(o.order_id) AS order_count
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.customer_name, c.city
ORDER BY total_revenue DESC;`,
  },
  {
    label: "Running total (M2)",
    sql: `SELECT c.customer_name, o.order_date,
    ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount,
    SUM(ROUND(o.quantity * o.unit_price * (1 - o.discount), 2))
        OVER (PARTITION BY o.customer_id ORDER BY o.order_date
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
ORDER BY c.customer_id, o.order_date;`,
  },
  {
    label: "Customer segments (M6)",
    sql: `WITH base AS (
    SELECT o.customer_id, c.customer_name, c.city,
           ROUND(o.quantity * o.unit_price * (1 - o.discount), 2) AS order_amount
    FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id
),
totals AS (
    SELECT customer_id, customer_name, city,
           ROUND(SUM(order_amount), 2) AS total_spending
    FROM base GROUP BY customer_id, customer_name, city
)
SELECT customer_name, city, total_spending,
    NTILE(4) OVER (ORDER BY total_spending DESC) AS quartile,
    CASE NTILE(4) OVER (ORDER BY total_spending DESC)
        WHEN 1 THEN 'Platinum' WHEN 2 THEN 'Gold'
        WHEN 3 THEN 'Silver'   WHEN 4 THEN 'Bronze'
    END AS segment
FROM totals ORDER BY total_spending DESC;`,
  },
];

/* ── Schema Panel ────────────────────────────────────────────────────── */
function SchemaPanel({ onInsertColumn, collapsed }) {
  return (
    <div style={{
      width: collapsed ? "0" : "220px",
      minWidth: collapsed ? "0" : "220px",
      overflow: "hidden",
      transition: "width var(--transition-slow), min-width var(--transition-slow)",
      borderRight: collapsed ? "none" : "1px solid var(--color-hairline)",
      backgroundColor: "var(--color-canvas-soft)",
    }}>
      {!collapsed && (
        <div style={{ padding: "var(--space-lg)" }}>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-caption-size)",
            fontWeight: "600",
            letterSpacing: "var(--text-eyebrow-mono-ls)",
            textTransform: "uppercase",
            color: "var(--color-mute)",
            margin: "0 0 var(--space-lg) 0",
          }}>
            Schema
          </p>
          {SCHEMA.map(({ table, icon: TableIcon, columns }) => (
            <div key={table} style={{ marginBottom: "var(--space-xl)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                <TableIcon size={14} />
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: "600",
                  color: "var(--color-ink)",
                }}>
                  {table}
                </span>
              </div>
              {columns.map(({ name, type }) => (
                <div
                  key={name}
                  onClick={() => onInsertColumn(name)}
                  title={`Click to insert: ${name}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-xs) var(--space-sm)",
                    borderRadius: "var(--radius-xs)",
                    cursor: "pointer",
                    transition: "background-color var(--transition-fast)",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,217,146,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-primary-soft)" }}>
                    {name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-mute)" }}>
                    {type}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── History Panel ───────────────────────────────────────────────────── */
function HistoryPanel({ history, clearHistory, onRestore, onClose }) {
  return (
    <div style={{
      position: "absolute",
      top: 0, right: 0,
      width: "340px",
      height: "100%",
      backgroundColor: "var(--color-canvas-soft)",
      borderLeft: "1px solid var(--color-hairline)",
      display: "flex",
      flexDirection: "column",
      zIndex: "var(--z-raised)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-lg)",
        borderBottom: "1px solid var(--color-hairline)",
      }}>
        <span style={{ fontSize: "var(--text-body-sm-size)", fontWeight: "600", color: "var(--color-ink)" }}>
          Query History
        </span>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button onClick={clearHistory} style={ghostBtnStyle}>Clear all</button>
          <button onClick={onClose} style={ghostBtnStyle}>✕</button>
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {history.length === 0 ? (
          <p style={{ padding: "var(--space-xl)", color: "var(--color-mute)", fontSize: "var(--text-body-sm-size)" }}>
            No queries yet
          </p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => { onRestore(item.sql); onClose(); }}
              style={{
                padding: "var(--space-md) var(--space-lg)",
                borderBottom: "1px solid var(--color-hairline)",
                cursor: "pointer",
                transition: "background-color var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,217,146,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xs)" }}>
                <span style={{
                  fontSize: "var(--text-caption-size)",
                  color: item.status === "error" ? "var(--color-danger)" : "var(--color-primary)",
                  fontWeight: "600",
                }}>
                  {item.status === "error" ? `✗ Error` : `✓ ${item.rowCount} rows`}
                </span>
                <span style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
                  {item.durationMs}ms
                </span>
              </div>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--color-body)",
                margin: "0 0 var(--space-xs) 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {item.preview}
              </p>
              <span style={{ fontSize: "10px", color: "var(--color-mute)" }}>
                {new Date(item.executedAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ghostBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--color-mute)",
  fontSize: "var(--text-caption-size)",
  cursor: "pointer",
  padding: "var(--space-xs) var(--space-sm)",
  borderRadius: "var(--radius-xs)",
  fontFamily: "var(--font-sans)",
};

/* ── Main SqlEditor Page ─────────────────────────────────────────────── */
export default function SqlEditor() {
  const {
    sql, setSql,
    status, result, error, durationMs, isRunning,
    executeQuery, clearEditor,
  } = useSqlEditor();

  const { history, clearHistory, addToHistory } = useQueryHistory();

  /* Phase 14.8 — AI query suggestion lifecycle */
  const {
    status: aiStatus,
    suggestedSql,
    error: aiError,
    aiEnabled,
    isLoading: aiLoading,
    suggest,
    dismiss: dismissAi,
  } = useAiSuggestion();

  const textareaRef   = useRef(null);
  const highlightRef  = useRef(null);
  const [schemaCollapsed, setSchemaCollapsed] = useState(false);
  const [historyOpen,     setHistoryOpen]     = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [activeSnippet,   setActiveSnippet]   = useState(null);

  /* Sync highlight layer with textarea scroll */
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop  = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  /* Update highlight layer content */
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.innerHTML = highlightSql(sql) + "\n"; // trailing newline prevents flicker
    }
  }, [sql]);

  /* Ctrl+Enter / Cmd+Enter keyboard shortcut + Tab → 2 spaces */
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning) executeQuery();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta    = textareaRef.current;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const next  = sql.slice(0, start) + "  " + sql.slice(end);
      setSql(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [isRunning, executeQuery, sql, setSql]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sql]);

  const insertColumn = useCallback((colName) => {
    const ta    = textareaRef.current;
    const start = ta?.selectionStart ?? sql.length;
    const next  = sql.slice(0, start) + colName + sql.slice(start);
    setSql(next);
    requestAnimationFrame(() => {
      if (ta) { ta.selectionStart = ta.selectionEnd = start + colName.length; ta.focus(); }
    });
  }, [sql, setSql]);

  /* Phase 14.8 — apply an AI suggestion, preserving the prior query in history */
  const handleUseSuggestion = useCallback((suggested) => {
    if (sql.trim()) {
      addToHistory({
        sql,
        durationMs: 0,
        rowCount: 0,
        status: "replaced_by_ai",
      });
    }
    setSql(suggested);
    dismissAi();
  }, [sql, addToHistory, setSql, dismissAi]);

  const charCount = sql.length;
  const lineCount = sql.split("\n").length;

  const sharedEditorFont = {
    fontFamily: "var(--font-mono)",
    fontSize:   "var(--text-code-size)",
    lineHeight: "var(--text-code-lh)",
    tabSize:    2,
    padding:    "var(--space-xl)",
  };

  return (
    <div style={{
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "var(--space-5xl) var(--page-gutter)",
    }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <p className="text-eyebrow" style={{ marginBottom: "var(--space-sm)" }}>
        SQL Editor
      </p>
      <h1 style={{
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-display-lg-size)",
        fontWeight: "var(--text-display-lg-weight)",
        lineHeight: "var(--text-display-lg-lh)",
        letterSpacing: "var(--text-display-lg-ls)",
        color: "var(--color-ink-strong)",
        margin: "0 0 var(--space-sm) 0",
      }}>
        Query Explorer
      </h1>
      <p style={{ color: "var(--color-body)", fontSize: "var(--text-body-lg-size)", marginBottom: "var(--space-3xl)" }}>
        Write and execute PostgreSQL queries against the live Customer Purchase Analytics database.
        Only <code>SELECT</code>, <code>EXPLAIN</code>, and <code>WITH</code> (CTEs) are permitted.
      </p>

      {/* ── Snippet Bar ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginBottom: "var(--space-xl)" }}>
        {SNIPPETS.map((s, i) => (
          <button
            key={i}
            onClick={() => { setSql(s.sql); setActiveSnippet(i); }}
            style={{
              padding: "var(--space-xs) var(--space-md)",
              backgroundColor: activeSnippet === i ? "rgba(0,217,146,0.10)" : "var(--color-canvas)",
              color: activeSnippet === i ? "var(--color-primary)" : "var(--color-body)",
              border: `1px solid ${activeSnippet === i ? "rgba(0,217,146,0.3)" : "var(--color-hairline)"}`,
              borderRadius: "var(--radius-pill)",
              fontSize: "var(--text-body-sm-size)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Main Editor Card ─────────────────────────────────────────── */}
      <div style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        marginBottom: "var(--space-xl)",
        position: "relative",
      }}>
        {/* AI Suggestion Panel — Phase 14.8 */}
        <AiSuggestionPanel
          aiEnabled={aiEnabled}
          isLoading={aiLoading}
          suggestedSql={suggestedSql}
          error={aiError}
          status={aiStatus}
          onSuggest={suggest}
          onUseSql={handleUseSuggestion}
          onDismiss={dismissAi}
        />

        <div style={{ display: "flex" }}>
          {/* Schema sidebar */}
          <SchemaPanel
            collapsed={schemaCollapsed}
            onInsertColumn={insertColumn}
          />

          {/* Editor area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Editor inner — highlight layer + textarea stacked */}
            <div style={{ position: "relative", minHeight: "240px" }}>
              {/* Highlight layer (behind) */}
              <div
                ref={highlightRef}
                aria-hidden="true"
                style={{
                  ...sharedEditorFont,
                  position:   "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak:  "break-word",
                  color:      "var(--color-ink)",
                  overflow:   "hidden",
                  pointerEvents: "none",
                  borderBottom: "1px solid var(--color-hairline)",
                  backgroundColor: "var(--color-canvas)",
                  margin: 0,
                }}
              />
              {/* Actual textarea (transparent — floats on top) */}
              <textarea
                ref={textareaRef}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={syncScroll}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                aria-label="SQL query editor"
                aria-describedby="editor-hint"
                style={{
                  ...sharedEditorFont,
                  position:        "relative",
                  width:           "100%",
                  minHeight:       "240px",
                  resize:          "vertical",
                  border:          "none",
                  outline:         "none",
                  backgroundColor: "transparent",
                  color:           "transparent",
                  caretColor:      "var(--color-primary)",
                  zIndex:          1,
                  display:         "block",
                  borderBottom:    "1px solid var(--color-hairline)",
                  margin:          0,
                }}
              />
            </div>

            {/* Editor footer */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-sm) var(--space-lg)",
              backgroundColor: "var(--color-canvas-soft)",
              borderBottom: "1px solid var(--color-hairline)",
            }}>
              <span id="editor-hint" style={{ fontSize: "var(--text-caption-size)", color: "var(--color-mute)" }}>
                {lineCount} {lineCount === 1 ? "line" : "lines"} · {charCount} chars ·{" "}
                <kbd style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>Ctrl+Enter</kbd> to run
              </span>
              <button
                onClick={() => setSchemaCollapsed((v) => !v)}
                style={{
                  ...ghostBtnStyle,
                  color: "var(--color-primary-soft)",
                  fontSize: "11px",
                }}
              >
                {schemaCollapsed ? "Show schema →" : "← Hide schema"}
              </button>
            </div>

            {/* Toolbar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-md) var(--space-lg)",
              backgroundColor: "var(--color-canvas-soft)",
            }}>
              {/* Run button — button-primary per DESIGN-voltagent.md */}
              <button
                onClick={() => executeQuery()}
                disabled={isRunning || !sql.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-md) var(--space-lg)",
                  backgroundColor: isRunning ? "var(--color-canvas-soft)" : "var(--color-primary)",
                  color: isRunning ? "var(--color-mute)" : "var(--color-on-primary)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-button-md-size)",
                  fontWeight: "var(--text-button-md-weight)",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  transition: "all var(--transition-fast)",
                  opacity: (!sql.trim()) ? 0.5 : 1,
                }}
              >
                {isRunning ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                      style={{ animation: "spin 0.75s linear infinite" }}>
                      <circle cx="12" cy="12" r="9" stroke="var(--color-mute)" strokeWidth="2" />
                      <path d="M12 3 A9 9 0 0 1 21 12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Running…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Run Query
                  </>
                )}
              </button>

              {/* Clear button — button-outline-on-dark */}
              <button
                onClick={() => { clearEditor(); setActiveSnippet(null); }}
                style={{
                  padding: "var(--space-md) var(--space-lg)",
                  backgroundColor: "var(--color-canvas)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-button-md-size)",
                  fontWeight: "var(--text-button-md-weight)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Clear
              </button>

              {/* Copy button — ghost icon */}
              <button
                onClick={handleCopy}
                title="Copy SQL to clipboard"
                aria-label="Copy SQL to clipboard"
                style={{
                  padding: "var(--space-md)",
                  backgroundColor: "transparent",
                  color: copied ? "var(--color-primary)" : "var(--color-mute)",
                  border: "1px solid transparent",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--text-body-sm-size)",
                  fontFamily: "var(--font-sans)",
                  transition: "all var(--transition-fast)",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>

              {/* History toggle */}
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={historyOpen}
                style={{
                  marginLeft: "auto",
                  padding: "var(--space-sm) var(--space-md)",
                  backgroundColor: historyOpen ? "rgba(0,217,146,0.08)" : "transparent",
                  color: historyOpen ? "var(--color-primary)" : "var(--color-mute)",
                  border: `1px solid ${historyOpen ? "rgba(0,217,146,0.25)" : "transparent"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: "var(--text-body-sm-size)",
                  fontFamily: "var(--font-sans)",
                  transition: "all var(--transition-fast)",
                }}
              >
                History {history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* History panel overlay */}
        {historyOpen && (
          <HistoryPanel
            history={history}
            clearHistory={clearHistory}
            onRestore={(restoredSql) => setSql(restoredSql)}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>

      {/* ── Results Area ────────────────────────────────────────────── */}
      {isRunning ? (
        <LoadingSpinner message="Executing query…" />
      ) : (
        <ResultsTable result={result} error={error} status={status} durationMs={durationMs} />
      )}

      {/* Spin keyframe for run button */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
