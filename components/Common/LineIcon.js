import React from "react";

// Small line icons (24×24, stroke = currentColor) for the text cards that
// replaced the AI-made illustrations on Om oss (Textosweb, 2026-11-26). Inline
// SVG so they need no icon font and stay sharp in the static export.
const PATHS = {
  flex: "M4 7h11M4 7l3-3M4 7l3 3M20 17H9m11 0-3-3m3 3-3 3",
  quality: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z",
  service: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-5z",
  handshake: "M3 12l4-4 4 2 4-3 6 5-4 4-3-2-2 2-3-2-2 2-3-4z",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a2.5 2.5 0 1 0 0-5M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6m2-6c2.8 0 4 2.2 4 5",
  growth: "M4 19h16M6 15l4-4 3 3 5-6m0 0h-4m4 0v4",
  mission: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-3.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z",
  vision: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  respect: "M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z",
  empathy: "M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  responsibility: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zm-3 9 2 2 4-4",
  will: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
  environment: "M5 19c0-8 5-13 14-14-1 9-6 14-14 14zm0 0 7-7",
  calendar: "M4 6h16v14H4V6zm0 4h16M8 3v4m8-4v4",
};

const LineIcon = ({ name, size = 24, className = "line-icon" }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={PATHS[name] || PATHS.quality} />
  </svg>
);

export default LineIcon;
