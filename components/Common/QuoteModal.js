import React, { useEffect, useRef, useState } from "react";
import { HONEYPOT_FIELD, HONEYPOT_STYLE, STARTED_AT_FIELD } from "../../utils/formGuard";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  message: "",
  [HONEYPOT_FIELD]: "",
};

// A blank answer per declared field, so every control stays controlled and a
// finished request leaves nothing behind for the next visitor.
const emptyAnswers = (fields) =>
  (fields || []).reduce((acc, field) => ({ ...acc, [field.name]: "" }), {});

// Today in the visitor's own timezone, as the `min` of a date field: a quote
// can be wanted today, never last week. toISOString() would be the UTC day,
// which is yesterday for anyone east of Greenwich early in the morning.
const localToday = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// The answers that were actually given, keyed by their Swedish label and in
// the order the fields were declared: that is how they read in the mail to the
// office. An untouched field adds no row.
const answeredRows = (fields, form) =>
  (fields || []).reduce((acc, field) => {
    const value = String(form[field.name] ?? "").trim();
    return value ? { ...acc, [field.label]: value } : acc;
  }, {});

// Quote requests reserve no time slot, so they go to the contact endpoint
// (which mails the office and confirms to the customer), not to /api/booking.
const QuoteModal = ({
  open,
  onClose,
  service,
  title = "Begär offert",
  subject,
  addressLabel = "Adress",
  addressPlaceholder = "Ange din adress",
  details = null,
  // Declarative, service-specific questions: see config/quoteFields.js. Every
  // one of them is optional on purpose.
  fields = null,
}) => {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...emptyAnswers(fields) }));
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");
  // Set on opening, not at render: the server has no visitor timezone, and a
  // modal left open overnight must not keep yesterday as its earliest date.
  const [today, setToday] = useState("");
  const firstField = useRef(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!open) return undefined;

    // Sent along so the API can tell a person from a bot that submits at once.
    startedAt.current = Date.now();
    setToday(localToday());

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
          details: {
            Tjänst: service,
            [addressLabel]: form.address,
            ...(details || {}),
            ...answeredRows(fields, form),
          },
          [HONEYPOT_FIELD]: form[HONEYPOT_FIELD],
          [STARTED_AT_FIELD]: startedAt.current,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message);

      setForm({ ...EMPTY_FORM, ...emptyAnswers(fields) });
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
                <label htmlFor="quote-address">{addressLabel}</label>
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
              {(fields || []).map((field) => {
                const id = `quote-field-${field.name}`;
                const hintId = field.hint ? `${id}-hint` : undefined;
                const shared = {
                  id,
                  className: "form-control",
                  value: form[field.name] ?? "",
                  onChange: update(field.name),
                  "aria-describedby": hintId,
                };
                return (
                  <div className="form-group" key={field.name}>
                    <label htmlFor={id}>{field.label}</label>
                    {field.type === "select" ? (
                      <select {...shared}>
                        <option value="">{field.placeholder || "Välj ett alternativ"}</option>
                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea {...shared} rows="3" placeholder={field.placeholder} />
                    ) : field.type === "date" ? (
                      // A date is picked, never typed: the office used to get
                      // "8:e november" and had to guess the year. A date input
                      // ignores `placeholder`, so what to do when the date is
                      // not settled yet belongs in `hint`.
                      <input {...shared} type="date" min={today || undefined} />
                    ) : (
                      <input
                        {...shared}
                        type={field.type === "number" ? "number" : "text"}
                        inputMode={field.type === "number" ? "decimal" : undefined}
                        min={field.type === "number" ? "0" : undefined}
                        step={field.type === "number" ? "any" : undefined}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.hint && (
                      <small className="form-text text-muted" id={hintId}>
                        {field.hint}
                      </small>
                    )}
                  </div>
                );
              })}
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
              {/* Honeypot: invisible to people, filled in by bots. */}
              <div aria-hidden="true" style={HONEYPOT_STYLE}>
                <label htmlFor="quote-company-website">Lämna detta fält tomt</label>
                <input
                  type="text"
                  id="quote-company-website"
                  name={HONEYPOT_FIELD}
                  tabIndex={-1}
                  autoComplete="off"
                  value={form[HONEYPOT_FIELD]}
                  onChange={update(HONEYPOT_FIELD)}
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
