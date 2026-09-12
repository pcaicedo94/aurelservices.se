import React, { useEffect, useRef, useState } from "react";
import useBookingSubmit from "../../lib/booking/useBookingSubmit";
import styles from "./Booking.module.css";

const EMPTY_CONTACT = { name: "", email: "", phone: "", address: "" };

// Contact step of an online booking. It owns the visitor's details, the
// anti-spam fields and the request state; the page supplies the calculator
// part of the payload through buildPayload(). Errors never reload the page,
// so everything the visitor typed stays in place.
const BookingContactForm = ({
  buildPayload,
  blockedHint = "",
  addressPlaceholder = "Ange din adress",
  focusSignal = 0,
  dateInputRef = null,
  onConflict,
  onSuccess,
}) => {
  const [contact, setContact] = useState(EMPTY_CONTACT);
  // Anti-spam contract with /api/booking: the honeypot must arrive empty and
  // formStartedAt tells the server how long the form was open.
  const [companyWebsite, setCompanyWebsite] = useState("");
  const startedAt = useRef(0);
  const sectionRef = useRef(null);
  const firstFieldRef = useRef(null);
  const { sending, error, submit } = useBookingSubmit();

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // When the form appears, and again on every "Boka tjänsten" click.
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    firstFieldRef.current?.focus({ preventScroll: true });
  }, [focusSignal]);

  const update = (field) => (e) => {
    const { value } = e.target;
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blockedHint) return;

    const payload = {
      ...buildPayload(),
      ...contact,
      company_website: companyWebsite,
      formStartedAt: startedAt.current,
    };
    const result = await submit(payload);
    if (result.skipped) return;

    if (result.ok) {
      setContact(EMPTY_CONTACT);
      onSuccess?.(payload);
      return;
    }

    if (result.error.kind === "conflict") {
      onConflict?.(payload.dateTime);
      const field = dateInputRef?.current;
      if (field) {
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.focus({ preventScroll: true });
      }
    }
  };

  return (
    <div ref={sectionRef} className={`accordion ${styles.section}`}>
      <h3>Kontaktformulär</h3>
      <form className="contact-form" onSubmit={handleSubmit} aria-busy={sending || undefined}>
        <div className="form-group">
          <label htmlFor="name">Namn</label>
          <input
            ref={firstFieldRef}
            type="text"
            id="name"
            className="form-control"
            placeholder="Ange ditt namn"
            autoComplete="name"
            value={contact.name}
            onChange={update("name")}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">E-post</label>
          <input
            type="email"
            id="email"
            className="form-control"
            placeholder="Ange din e-post"
            autoComplete="email"
            value={contact.email}
            onChange={update("email")}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Telefonnummer</label>
          <input
            type="tel"
            id="phone"
            className="form-control"
            placeholder="Ange ditt telefonnummer"
            autoComplete="tel"
            value={contact.phone}
            onChange={update("phone")}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Adress</label>
          <input
            type="text"
            id="address"
            className="form-control"
            placeholder={addressPlaceholder}
            autoComplete="street-address"
            value={contact.address}
            onChange={update("address")}
            required
          />
        </div>

        <div className={styles.trap} aria-hidden="true">
          <label htmlFor="company_website">Webbplats</label>
          <input
            type="text"
            id="company_website"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
          />
        </div>

        {error && (
          <div className={styles.alert} role="alert">
            {error.kind === "conflict" ? (
              <>
                <strong>Tiden är tyvärr redan bokad.</strong> Välj en annan dag eller tid i
                beräkningen ovan och skicka igen. Dina uppgifter finns kvar.
              </>
            ) : (
              <>
                <strong>Bokningen kunde inte skickas.</strong> {error.message} Dina uppgifter
                finns kvar.
              </>
            )}
          </div>
        )}

        {blockedHint && (
          <div className={styles.notice} role="status">
            <strong>Beräkningen ovan är inte komplett.</strong> {blockedHint}
          </div>
        )}

        <button
          type="submit"
          className={`default-btn ${styles.button}${sending ? ` ${styles.sending}` : ""}`}
          disabled={sending || Boolean(blockedHint)}
        >
          {sending ? "Skickar…" : "Skicka bokning"}
        </button>
      </form>
    </div>
  );
};

export default BookingContactForm;
