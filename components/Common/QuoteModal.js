import React, { useEffect, useRef, useState } from "react";

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", message: "" };

// Quote requests reserve no time slot, so they go to the contact endpoint
// (which mails the office and confirms to the customer), not to /api/booking.
const QuoteModal = ({
  open,
  onClose,
  service,
  title = "Begär offert",
  subject,
  addressPlaceholder = "Ange din adress",
  details = null,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  const firstField = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    // A finished request should not greet the visitor on the next opening.
    if (status === "sent") setStatus("idle");
    setError("");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    firstField.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: subject || `Offertförfrågan – ${service}`,
          text: form.message,
          details: { Tjänst: service, Adress: form.address, ...(details || {}) },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message);

      setForm(EMPTY_FORM);
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(
        err.message ||
          "Förfrågan kunde inte skickas. Vänligen försök igen eller ring oss på 076-045 02 28."
      );
    }
  };

  return (
    <div
      className="quote-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title">
        <div className="quote-modal-header">
          <h3 id="quote-modal-title">{title}</h3>
          <p>{service}</p>
        </div>
        <button type="button" className="quote-modal-close" onClick={onClose} aria-label="Stäng">
          &times;
        </button>

        <div className="quote-modal-body">
          {status === "sent" ? (
            <div className="quote-modal-done" role="status">
              <h4>Tack för din förfrågan!</h4>
              <p>
                Vi har tagit emot den och återkommer så snart som möjligt. En bekräftelse har
                skickats till din e-post.
              </p>
              <button type="button" className="default-btn" onClick={onClose}>
                Stäng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {details && (
                <ul className="quote-modal-summary">
                  {Object.entries(details).map(([label, value]) => (
                    <li key={label}>
                      <strong>{label}:</strong> {value}
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <div className="quote-modal-error" role="alert">
                  {error}
                </div>
              )}

              <div className="quote-modal-row">
                <div className="form-group">
                  <label htmlFor="quote-name">Namn</label>
                  <input
                    ref={firstField}
                    type="text"
                    id="quote-name"
                    className="form-control"
                    placeholder="Ange ditt namn"
                    value={form.name}
                    onChange={update("name")}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="quote-phone">Telefonnummer</label>
                  <input
                    type="tel"
                    id="quote-phone"
                    className="form-control"
                    placeholder="Ange ditt telefonnummer"
                    value={form.phone}
                    onChange={update("phone")}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="quote-email">E-post</label>
                <input
                  type="email"
                  id="quote-email"
                  className="form-control"
                  placeholder="Ange din e-post"
                  value={form.email}
                  onChange={update("email")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="quote-address">Adress</label>
                <input
                  type="text"
                  id="quote-address"
                  className="form-control"
                  placeholder={addressPlaceholder}
                  value={form.address}
                  onChange={update("address")}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="quote-message">Meddelande</label>
                <textarea
                  id="quote-message"
                  className="form-control"
                  placeholder="Beskriv era behov"
                  rows="4"
                  value={form.message}
                  onChange={update("message")}
                />
              </div>
              <button type="submit" className="default-btn" disabled={status === "sending"}>
                {status === "sending" ? "Skickar…" : "Skicka förfrågan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
