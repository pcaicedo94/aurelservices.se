import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const WindowCleaningBusiness = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const bookingUrl = "/api/booking";

  const sendToWebhook = async (e) => {
    e.preventDefault();
    const payload = {
      cleaningType: "Fönsterputsning Företag",
      name,
      email,
      phone,
      address,
      message,
    };

    try {
      const response = await fetch(bookingUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setPopupMessage(data.message || "Förfrågan skickad!");
      setShowPopup(true);
      if (response.ok) {
        setName(""); setEmail(""); setPhone(""); setAddress(""); setMessage("");
        setShowContactForm(false);
      }
    } catch (error) {
      setPopupMessage("Kunde inte ansluta till servern. Försök igen.");
      setShowPopup(true);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    window.location.reload();
  };

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Fönsterputsning för företag" bgImage="/images/Fönsterputs_kontor.png" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Fönsterputsning för företag i Stockholm – Rent och professionellt intryck</h2>
            <p>
              Rena fönster är en viktig del av ett professionellt intryck. Aurel Städ &amp; Allservice erbjuder fönsterputsning för företag i Stockholm, anpassad efter era lokaler och verksamhetens behov.
            </p>
            <p>
              Vi ser till att era fönster alltid håller hög standard och bidrar till en ljus och trivsam arbetsmiljö.
            </p>

            <h4>Vad ingår i vår fönsterputsning</h4>
            <ul>
              <li>Putsning av fönster invändigt och utvändigt</li>
              <li>Rengöring av glasytor för ett klart och fläckfritt resultat</li>
              <li>Avtorkning av karmar och kanter</li>
            </ul>

            <h4>Flexibla upplägg</h4>
            <p>
              Vi erbjuder både enstaka uppdrag och regelbunden fönsterputsning enligt schema, anpassat efter era behov.
            </p>

            <h4>Fördelar för företag</h4>
            <ul>
              <li>Ett professionellt och välskött intryck</li>
              <li>Ökat ljusinsläpp i lokalerna</li>
              <li>Flexibla tider för minimal störning</li>
              <li>Pålitlig och erfaren personal</li>
            </ul>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med er förfrågan</li>
              <li>Vi bokar ett kostnadsfritt platsbesök</li>
              <li>Ni får en skräddarsydd offert baserad på omfattning och behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill ni boka fönsterputsning för ert företag? Kontakta oss idag för ett kostnadsfritt platsbesök och offert.</p>
              <button type="button" className="default-btn" onClick={() => setShowContactForm(true)}>
                Begär offert
              </button>
            </div>
          </div>

          {showContactForm && (
            <div className="col-lg-12">
              <div className="accordion">
                <h3>Kontaktformulär</h3>
                <form className="contact-form" onSubmit={sendToWebhook}>
                  <div className="form-group">
                    <label htmlFor="name">Namn</label>
                    <input type="text" id="name" className="form-control" placeholder="Ange ditt namn" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">E-post</label>
                    <input type="email" id="email" className="form-control" placeholder="Ange din e-post" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Telefonnummer</label>
                    <input type="tel" id="phone" className="form-control" placeholder="Ange ditt telefonnummer" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Adress</label>
                    <input type="text" id="address" className="form-control" placeholder="Ange lokalens adress" value={address} onChange={(e) => setAddress(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Meddelande</label>
                    <textarea id="message" className="form-control" placeholder="Beskriv era behov" value={message} onChange={(e) => setMessage(e.target.value)} rows="4" />
                  </div>
                  <button type="submit" className="default-btn">Skicka</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="popup-window">
          <div className="popup-content">
            <h3>Bekräftelse</h3>
            <p>{popupMessage}</p>
            <button className="default-btn" onClick={handlePopupClose}>OK</button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default WindowCleaningBusiness;
