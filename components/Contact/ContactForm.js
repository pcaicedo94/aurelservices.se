import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { HONEYPOT_FIELD, HONEYPOT_STYLE, STARTED_AT_FIELD } from "../../utils/formGuard";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);


const alertContent = () => {
  MySwal.fire({
    title: "Tack!",
    text: "Ditt meddelande har skickats. Vi återkommer så snart som möjligt.",
    icon: "success",
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

// Without this the form silently pretended to succeed when the request failed.
const alertError = (message) => {
  MySwal.fire({
    title: "Något gick fel",
    text: message || "Meddelandet kunde inte skickas. Vänligen försök igen.",
    icon: "error",
    confirmButtonColor: "#2d9070",
  });
};

// Form initial state
const INITIAL_STATE = {
  name: "",
  email: "",
  number: "",
  subject: "",
  text: "",
  [HONEYPOT_FIELD]: "",
};

const ContactForm = () => {
  const [contact, setContact] = useState(INITIAL_STATE);
  // When the form was shown, so the API can tell a person from a bot that
  // submits at once. Set after mount to keep server and client markup equal.
  const startedAt = useRef(0);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A ref, not state: a fast double click fires twice before React re-renders
    // the disabled button.
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const { name, email, number, subject, text } = contact;
      // The input is named `number`; the API expects `phone`.
      const payload = {
        name,
        email,
        phone: number,
        subject,
        text,
        [HONEYPOT_FIELD]: contact[HONEYPOT_FIELD],
        [STARTED_AT_FIELD]: startedAt.current,
      };
      await axios.post("/api/contact", payload);
      setContact(INITIAL_STATE);
      startedAt.current = Date.now();
      alertContent();
    } catch (error) {
      console.error(error);
      alertError(error?.response?.data?.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <>
      <div className="contact-section ptb-50">
        <div className="container">
          <div className="about-content">
            <h2>Hör av dig!</h2>
            <p className="pb-100">
              Låt oss ta hand om städningen så att du kan fokusera på
              det som verkligen betyder något. Kontakta oss idag för att
              begära en offert eller boka en konsultation. Vi är här
              för att hjälpa dig att hålla ditt utrymme fläckfritt!
            </p>
          </div>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="contact-image">
                <img src="/images/contact.png" alt="image" />
              </div>
            </div>

            <div className="col-lg-6">
              <div className="contact-form">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      name="name"
                      placeholder="Ditt namn"
                      className="form-control"
                      value={contact.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Din e-post"
                      className="form-control"
                      value={contact.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="number"
                      placeholder="Ditt telefonnummer"
                      className="form-control"
                      value={contact.number}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="subject"
                      placeholder="Ämne"
                      className="form-control"
                      value={contact.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <textarea
                      name="text"
                      cols="30"
                      rows="5"
                      placeholder="Ditt meddelande"
                      className="form-control"
                      value={contact.text}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Honeypot: invisible to people, filled in by bots. */}
                  <div aria-hidden="true" style={HONEYPOT_STYLE}>
                    <label htmlFor="contact-company-website">Lämna detta fält tomt</label>
                    <input
                      type="text"
                      id="contact-company-website"
                      name={HONEYPOT_FIELD}
                      tabIndex={-1}
                      autoComplete="off"
                      value={contact[HONEYPOT_FIELD]}
                      onChange={handleChange}
                    />
                  </div>

                  <button type="submit" className="default-btn" disabled={sending}>
                    {sending ? "Skickar…" : "Skicka meddelande"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default ContactForm;
