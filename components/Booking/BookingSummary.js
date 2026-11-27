import React, { useId } from "react";
import styles from "./Booking.module.css";

// What a private customer always gets, shown under the summary (Textosweb,
// 2026-11-26: "Alltid hos Aurel"). Only what the client has confirmed: the
// collective agreement and liability insurance (Om oss), the guarantee, RUT
// on the invoice and a free, non-binding request.
const ALWAYS = [
  "Kollektivavtal",
  "Ansvarsförsäkring",
  "Nöjd kund-garanti",
  "RUT-avdraget dras direkt på fakturan",
  "Kostnadsfri och ej bindande förfrågan",
];

// Summary card with the call to action. A disabled button says what is
// missing, and when the price has to be quoted the button becomes
// "Begär offert" instead of sending a request for 0 kr.
//
// `privateCustomer` marks the four private calculators: since Textosweb the
// figure there is a preliminary price, the form sends a non-binding request,
// and a travel surcharge may be added in the offer.
const BookingSummary = ({
  children,
  mode = "book",
  hint = "",
  quoteNote = null,
  onBook,
  onQuote,
  footer = null,
  privateCustomer = false,
  bookLabel,
  style,
}) => {
  const hintId = useId();
  const isQuote = mode === "quote";
  const disabled = Boolean(hint);
  const label = isQuote
    ? "Begär offert"
    : bookLabel || (privateCustomer ? "Gå vidare till förfrågan" : "Boka tjänsten");

  return (
    <div className="summary-frame" style={style}>
      <h3>Summering:</h3>
      <ul className="summary-list">{children}</ul>
      {isQuote && quoteNote && <p className={styles.quoteNote}>{quoteNote}</p>}
      {privateCustomer && !isQuote && (
        <div className="preliminary-note">
          <h4>Preliminärt pris</h4>
          <p>
            Priset som visas är en uppskattning baserad på bostadens storlek och de uppgifter du
            lämnar. Beroende på bostadens adress kan ett resetillägg tillkomma. Eventuella
            resekostnader anges separat och meddelas via e-post tillsammans med det slutliga
            prisförslaget. Alla priser bekräftas av Aurel Städ &amp; Allservice AB innan bokning.
          </p>
        </div>
      )}
      <button
        type="button"
        className={`default-btn ${styles.button}`}
        onClick={isQuote ? onQuote : onBook}
        disabled={disabled}
        aria-describedby={disabled ? hintId : undefined}
      >
        {label}
      </button>
      {disabled && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {privateCustomer && (
        <div className="always-aurel">
          <p className="always-aurel-title">Alltid hos Aurel</p>
          <ul>
            {ALWAYS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {footer}
    </div>
  );
};

export default BookingSummary;
