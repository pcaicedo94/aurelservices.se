import React, { useEffect, useRef } from "react";
import styles from "./Booking.module.css";

// Shown in the page after a successful booking, replacing the old
// "Bekräftelse" popup that reloaded the page.
const BookingConfirmation = ({ service, when, email, onDismiss }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={panelRef}
      className={`booking-confirmation ${styles.confirmation}`}
      role="status"
      tabIndex={-1}
    >
      <h3>Tack för din bokning!</h3>
      <p>
        Vi har tagit emot din bokning av {service.toLowerCase()}
        {when ? `, ${when}` : ""}. En sammanfattning skickas till <strong>{email}</strong> och
        vi återkommer med en bekräftelse inom kort.
      </p>
      <button type="button" className="default-btn" onClick={onDismiss}>
        Stäng
      </button>
    </div>
  );
};

export default BookingConfirmation;
