/**
 * sqlHighlight — lightweight SQL syntax highlighting without any npm dependency.
 *
 * Technique: a SINGLE-PASS tokeniser builds an HTML string. Each character of the
 * source is classified exactly once (string literal | keyword | number | plain),
 * so generated markup is never re-scanned. This avoids the class of bug where a
 * later regex pass matches digits/letters inside already-emitted HTML attributes
 * (e.g. the "600" inside font-weight:600).
 *
 * Token colours use Voltagent design tokens via CSS custom properties:
 *   keywords    → var(--color-primary-soft)   #2fd6a1
 *   strings     → #f59e0b                     (amber — semantic warning colour)
 *   comments    → var(--color-mute)            #8b949e
 *   numbers     → var(--color-primary)         #00d992
 */

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "EXISTS",
  "INNER", "LEFT", "RIGHT", "OUTER", "FULL", "JOIN", "ON", "USING",
  "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "DISTINCT",
  "AS", "CASE", "WHEN", "THEN", "ELSE", "END", "WITH", "RECURSIVE",
  "UNION", "INTERSECT", "EXCEPT", "ALL",
  // Window functions
  "OVER", "PARTITION", "ROWS", "RANGE", "BETWEEN",
  "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT", "ROW",
  "ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE",
  "PERCENT_RANK", "CUME_DIST",
  "LAG", "LEAD", "FIRST_VALUE", "LAST_VALUE",
  "SUM", "AVG", "COUNT", "MAX", "MIN",
  // Data types and functions
  "ROUND", "NULLIF", "COALESCE", "CAST",
  "NUMERIC", "INTEGER", "VARCHAR", "TEXT", "DATE", "BOOLEAN",
  "NULL", "TRUE", "FALSE", "EXPLAIN", "ANALYZE",
  // Join types
  "NATURAL", "CROSS",
];

/**
 * One master pattern with ordered alternation:
 *   1) string literal   2) keyword   3) number
 * The engine scans left-to-right and matches whichever applies at each position.
 * Because the string-literal alternative comes first, keywords/numbers inside a
 * quoted string are consumed as part of the string and not separately coloured.
 */
const MASTER_PATTERN = new RegExp(
  "('(?:''|[^'])*')" +                          // group 1: string literal
  "|(\\b(?:" + SQL_KEYWORDS.join("|") + ")\\b)" + // group 2: keyword
  "|(\\b\\d+(?:\\.\\d+)?\\b)",                    // group 3: number
  "gi"
);

/**
 * Escape HTML special characters before injecting into innerHTML.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Tokenise and highlight a SQL string.
 * Returns an HTML string safe for innerHTML.
 */
export function highlightSql(sql) {
  if (!sql) return "";

  // Process line-by-line to handle -- comments correctly
  const lines = sql.split("\n");

  const highlightedLines = lines.map((line) => {
    const commentIdx = line.indexOf("--");
    if (commentIdx !== -1) {
      const codePart    = line.slice(0, commentIdx);
      const commentPart = line.slice(commentIdx);
      return (
        highlightCodePart(codePart) +
        `<span style="color:var(--color-mute);font-style:italic">${escapeHtml(commentPart)}</span>`
      );
    }
    return highlightCodePart(line);
  });

  return highlightedLines.join("\n");
}

/**
 * Single-pass highlighter for a comment-free code fragment.
 * Plain text between matches is HTML-escaped; matched tokens are wrapped in
 * already-final spans that are never re-scanned.
 */
function highlightCodePart(code) {
  let out  = "";
  let last = 0;

  for (const m of code.matchAll(MASTER_PATTERN)) {
    const [match, strLit, keyword, number] = m;
    const offset = m.index;

    // plain (unmatched) text before this token
    out += escapeHtml(code.slice(last, offset));

    if (strLit !== undefined) {
      out += `<span style="color:#f59e0b">${escapeHtml(strLit)}</span>`;
    } else if (keyword !== undefined) {
      out += `<span style="color:var(--color-primary-soft);font-weight:600">${keyword.toUpperCase()}</span>`;
    } else if (number !== undefined) {
      out += `<span style="color:var(--color-primary)">${number}</span>`;
    }

    last = offset + match.length;
  }

  // trailing plain text after the last token
  out += escapeHtml(code.slice(last));
  return out;
}
