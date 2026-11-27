import React, { useEffect, useRef } from "react";
import styles from "./Booking.module.css";

// Shown in the page after a request is sent, replacing the old
// "Bekräftelse" popup that reloaded the page. Since Textosweb (2026-11-26)
// it confirms a non-binding request, not a booking.
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
      <h3>Tack för din förfrågan!</h3>
      <p>
        Vi har tagit emot din förfrågan om {service.toLowerCase()}
        {when ? `, önskad tid ${when}` : ""}. En sammanfattning skickas till{" "}
        <strong>{email}</strong>.
      </p>
      <p>
        Vi går igenom dina önskemål och återkommer via e-post med ett prisförslag och information
        om tillgängliga tider. Förfrågan är kostnadsfri och inte bindande.
      </p>
      <button type="button" className="default-btn" onClick={onDismiss}>
        Stäng
      </button>
    </div>
  );
};

export default BookingConfirmation;
