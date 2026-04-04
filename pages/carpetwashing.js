import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const CarpetWashing = () => {
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
      cleaningType: "Mattvått",
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
      <PageBanner pageTitle="Mattvått" bgImage="/images/page-title-bg-5.jpg" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Mattvått i Stockholm – Professionell rengöring av mattor</h2>
            <p>
              Har dina mattor blivit smutsiga eller slitna? Aurel Städ &amp; Allservice erbjuder professionell mattvått i Stockholm för privatpersoner, företag och bostadsrättsföreningar. Vi rengör dina mattor på djupet och återställer deras fräschör.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Djuprengöring av mattor</li>
              <li>Borttagning av fläckar och smuts</li>
              <li>Rengöring som förbättrar hygien och inomhusmiljö</li>
              <li>Anpassade metoder beroende på material</li>
            </ul>

            <h4>Fördelar</h4>
            <ul>
              <li>Fräschare och renare mattor</li>
              <li>Förlänger mattans livslängd</li>
              <li>Bättre inomhusmiljö</li>
              <li>Professionellt resultat</li>
            </ul>

            <h4>Flexibla upplägg</h4>
            <p>Vi erbjuder både enstaka tvättar och återkommande underhåll, anpassat efter behov.</p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert baserad på mattans storlek och skick</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du boka mattvått i Stockholm? Kontakta oss idag för offert och rådgivning.</p>
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

export default CarpetWashing;
