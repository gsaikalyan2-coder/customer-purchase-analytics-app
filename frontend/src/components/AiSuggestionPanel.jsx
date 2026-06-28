/**
 * AiSuggestionPanel — intent input, quick chips, and suggestion preview.
 *
 * Design: DESIGN-voltagent.md
 *  - Intent input: {text-input} component spec (canvas-soft bg, hairline border, sm radius)
 *  - Suggest button: {button-primary} (green bg, dark text)
 *  - Chips: {button-pill-tag} (hairline border, pill radius)
 *  - Preview card: {card-feature} chrome (canvas bg, 2px primary border, md radius, 2xl padding)
 *  - Use this query: {button-primary}
 *  - Discard: {button-outline-on-dark}
 */
import { useState, useRef } from "react";
import { highlightSql } from "../utils/sqlHighlight";

const QUICK_CHIPS = [
  { label: "Running totals",     intent: "Show the running total spend per customer ordered by date" },
  { label: "Customer ranking",   intent: "Rank customers within each city by their total lifetime spend using ROW_NUMBER, RANK, and DENSE_RANK" },
  { label: "Category breakdown", intent: "Show running totals and maximums per customer per product category" },
  { label: "Segment by spend",   intent: "Segment customers into Platinum, Gold, Silver, Bronze tiers using NTILE(4) on lifetime spend" },
  { label: "Moving averages",    intent: "Show 3-order and 5-order moving averages of order amounts per customer" },
  { label: "Top products",       intent: "Rank products within each category by total revenue using DENSE_RANK, showing top 3 and bottom 3" },
];

export default function AiSuggestionPanel({
  aiEnabled,
  isLoading,
  suggestedSql,
  error,
  status,
  onSuggest,
  onUseSql,
  onDismiss,
}) {
  const [intent, setIntent] = useState("");
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (intent.trim()) onSuggest(intent);
  };

  const handleChip = (chipIntent) => {
    setIntent(chipIntent);
    onSuggest(chipIntent);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    if (e.key === "Escape") { onDismiss(); setIntent(""); }
  };

  return (
    <div style={{
      borderBottom: "1px solid var(--color-hairline)",
      backgroundColor: "var(--color-canvas-soft)",
      padding: "var(--space-lg) var(--space-2xl)",
    }}>
      {/* ── Section label ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        {/* Sparkle icon — AI indicator */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
            fill="var(--color-primary)" stroke="none" />
        </svg>
        <span style={{
          fontSize: "var(--text-caption-size)",
          fontWeight: "600",
          letterSpacing: "var(--text-eyebrow-mono-ls)",
          textTransform: "uppercase",
          color: aiEnabled ? "var(--color-primary)" : "var(--color-mute)",
        }}>
          {aiEnabled ? "AI Query Suggestions" : "AI Disabled — set ANTHROPIC_API_KEY"}
        </span>
      </div>

      {/* ── Intent input row ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        {/* text-input spec from DESIGN-voltagent.md */}
        <input
          ref={inputRef}
          type="text"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "show running totals per customer"'
          disabled={!aiEnabled || isLoading}
          aria-label="Describe the SQL query you want"
          style={{
            flex: 1,
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-md) var(--space-lg)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-body-sm-size)",
            lineHeight: "var(--text-body-sm-lh)",
            outline: "none",
            opacity: (!aiEnabled || isLoading) ? 0.5 : 1,
            transition: "border-color var(--transition-fast)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--color-hairline)"; }}
        />

        {/* Suggest button — button-primary */}
        <button
          onClick={handleSubmit}
          disabled={!aiEnabled || isLoading || !intent.trim()}
          aria-label="Generate AI query suggestion"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            padding: "var(--space-md) var(--space-lg)",
            backgroundColor: (!aiEnabled || !intent.trim()) ? "var(--color-canvas)" : "var(--color-primary)",
            color: (!aiEnabled || !intent.trim()) ? "var(--color-mute)" : "var(--color-on-primary)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-button-md-size)",
            fontWeight: "var(--text-button-md-weight)",
            cursor: (!aiEnabled || isLoading || !intent.trim()) ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all var(--transition-fast)",
            opacity: (!aiEnabled || !intent.trim()) ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                style={{ animation: "spin 0.75s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 3A9 9 0 0 1 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Generating…
            </>
          ) : (
            <>✦ Suggest</>
          )}
        </button>
      </div>

      {/* ── Quick chips — button-pill-tag from DESIGN-voltagent.md ──────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleChip(chip.intent)}
            disabled={!aiEnabled || isLoading}
            style={{
              padding: "var(--space-xs) var(--space-md)",
              backgroundColor: "var(--color-canvas)",
              color: aiEnabled ? "var(--color-body)" : "var(--color-mute)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-body-sm-size)",
              cursor: (!aiEnabled || isLoading) ? "not-allowed" : "pointer",
              transition: "all var(--transition-fast)",
              opacity: (!aiEnabled || isLoading) ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (aiEnabled && !isLoading) {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.color = "var(--color-primary)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-hairline)";
              e.currentTarget.style.color = "var(--color-body)";
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Error message ─────────────────────────────────────────────── */}
      {status === "error" && error && (
        <p style={{
          marginTop: "var(--space-md)",
          fontSize: "var(--text-body-sm-size)",
          color: "var(--color-danger)",
        }}>
          ✗ {error}
        </p>
      )}

      {/* ── Suggestion Preview Card — card-feature chrome ───────────────── */}
      {status === "success" && suggestedSql && (
        <div style={{
          marginTop: "var(--space-lg)",
          backgroundColor: "var(--color-canvas)",
          border: "2px solid var(--color-primary)",  /* featured card — 2px primary */
          borderRadius: "var(--radius-md)",
          padding: "var(--space-2xl)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <span style={{
              fontSize: "var(--text-caption-size)",
              fontWeight: "600",
              letterSpacing: "var(--text-eyebrow-mono-ls)",
              textTransform: "uppercase",
              color: "var(--color-primary)",
            }}>
              ✦ AI Suggestion
            </span>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              {/* Use this query — button-primary */}
              <button
                onClick={() => { onUseSql(suggestedSql); setIntent(""); }}
                style={{
                  padding: "var(--space-sm) var(--space-lg)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Use this query
              </button>
              {/* Discard — button-outline-on-dark */}
              <button
                onClick={() => { onDismiss(); setIntent(""); }}
                style={{
                  padding: "var(--space-sm) var(--space-lg)",
                  backgroundColor: "var(--color-canvas)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-body-sm-size)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Discard
              </button>
            </div>
          </div>

          {/* Highlighted SQL preview — code-mockup chrome.
              highlightSql() HTML-escapes all plain text and string literals and
              only emits keywords from a fixed alphanumeric allowlist, so this is
              XSS-safe even on AI-generated content. */}
          <div
            aria-label="AI-suggested SQL query preview"
            dangerouslySetInnerHTML={{ __html: highlightSql(suggestedSql) }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-code-size)",
              lineHeight: "var(--text-code-lh)",
              color: "var(--color-ink)",
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              maxHeight: "320px",
              backgroundColor: "var(--color-canvas-soft)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-lg)",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
