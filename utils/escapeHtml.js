const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// Escapes user supplied values before they are interpolated into email HTML.
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

// Removes line breaks so user input cannot inject extra mail headers
// (subject) or break plain text fields (calendar summary).
export function singleLine(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[\r\n]+/g, " ").trim();
}
