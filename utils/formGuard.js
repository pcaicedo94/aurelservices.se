// Browser half of the anti-spam contract with /api/booking and /api/contact;
// the server half is utils/antiSpam.js.
//
//   company_website  honeypot input. People never see it, so it stays empty.
//   formStartedAt    Date.now() when the form was shown to the visitor.

export const HONEYPOT_FIELD = "company_website";
export const STARTED_AT_FIELD = "formStartedAt";

// Off screen rather than display: none, which many bots skip. With
// aria-hidden and tabIndex={-1} neither people nor screen readers reach it.
export const HONEYPOT_STYLE = {
  position: "absolute",
  left: "-10000px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
};
