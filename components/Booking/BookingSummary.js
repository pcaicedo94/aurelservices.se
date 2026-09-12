import React, { useId } from "react";
import styles from "./Booking.module.css";

// Summary card with the call to action. A disabled button says what is
// missing, and when the price has to be quoted the button becomes
// "Begär offert" instead of booking a service for 0 kr.
const BookingSummary = ({
  children,
  mode = "book",
  hint = "",
  quoteNote = null,
  onBook,
  onQuote,
  footer = null,
  style,
}) => {
  const hintId = useId();
  const isQuote = mode === "quote";
  const disabled = Boolean(hint);

  return (
    <div className="summary-frame" style={style}>
      <h3>Summering:</h3>
      <ul className="summary-list">{children}</ul>
      {isQuote && quoteNote && <p className={styles.quoteNote}>{quoteNote}</p>}
      <button
        type="button"
        className={`default-btn ${styles.button}`}
        onClick={isQuote ? onQuote : onBook}
        disabled={disabled}
        aria-describedby={disabled ? hintId : undefined}
      >
        {isQuote ? "Begär offert" : "Boka tjänsten"}
      </button>
      {disabled && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {footer}
    </div>
  );
};

export default BookingSummary;
