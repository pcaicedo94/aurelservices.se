import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const Gardening = () => {
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
      cleaningType: "Trädgårdsskötsel",
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
      <PageBanner pageTitle="Trädgårdsskötsel" bgImage="/images/Trädgårdsskötsel.png" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Trädgårdsskötsel i Stockholm – Professionell hjälp med RUT-avdrag</h2>
            <p>
              Behöver du hjälp med din trädgård? Aurel Städ &amp; Allservice erbjuder professionell trädgårdsskötsel i Stockholm för privatpersoner. Vi hjälper dig att hålla din trädgård välskött, trivsam och i gott skick under hela säsongen.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Gräsklippning</li>
              <li>Ogräsrensning</li>
              <li>Beskärning av buskar och träd</li>
              <li>Lövkrattning och trädgårdsstädning</li>
              <li>Allmänt underhåll av trädgården</li>
            </ul>

            <h4>RUT-avdrag</h4>
            <p>
              Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden för trädgårdsskötsel.
            </p>
            <p>
              RUT-avdrag gäller för löpande underhåll av trädgården, till exempel gräsklippning, ogräsrensning och beskärning. Arbeten som innebär nyanläggning eller större förändringar av trädgården omfattas inte av RUT-avdrag.
            </p>
            <p>
              Vi hanterar hela RUT-avdraget direkt på fakturan så att det blir enkelt för dig.
            </p>

            <h4>Fördelar</h4>
            <ul>
              <li>En välskött och trivsam trädgård</li>
              <li>Mer tid över till annat</li>
              <li>Flexibla lösningar efter dina behov</li>
              <li>Pålitlig och noggrann service</li>
            </ul>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du får en offert baserad på arbetets omfattning</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du ha hjälp med trädgårdsskötsel? Kontakta oss idag för en kostnadsfri offert.</p>
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
                    <input type="text" id="address" className="form-control" placeholder="Ange din adress" value={address} onChange={(e) => setAddress(e.target.value)} required />
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

export default Gardening;
