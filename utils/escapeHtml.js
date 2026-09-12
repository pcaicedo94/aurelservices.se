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

// For free text where the author's line breaks are part of the message: escape
// first, then turn the newlines into markup, so nothing user supplied is ever
// interpreted as HTML.
export function escapeHtmlMultiline(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

// Removes line breaks so user input cannot inject extra mail headers
// (subject) or break plain text fields (calendar summary).
export function singleLine(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[\r\n]+/g, " ").trim();
}
