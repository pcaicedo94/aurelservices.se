import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const MoveCleaningBusiness = () => {
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
      cleaningType: "Flyttstädning Företag",
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
      <PageBanner pageTitle="Flyttstädning för företag" bgImage="/images/Flyttstädning-kontor.png" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Flyttstädning för företag i Stockholm – Professionell städning inför överlämning</h2>
            <p>
              Ska ert företag lämna en lokal? Aurel Städ &amp; Allservice erbjuder professionell flyttstädning för företag i Stockholm som uppfyller alla krav vid överlämning och besiktning.
            </p>
            <p>
              Vi ser till att lokalen lämnas i perfekt skick, vilket minskar risken för anmärkningar och sparar tid för er verksamhet.
            </p>

            <h4>Vad ingår i vår flyttstädning</h4>
            <ul>
              <li>Rengöring av alla ytor från golv till tak</li>
              <li>Dammsugning och våttorkning av golv</li>
              <li>Rengöring av dörrar, karmar, lister och kontaktpunkter</li>
              <li>Fönsterputsning invändigt och utvändigt</li>
              <li>Rengöring av kök och personalutrymmen</li>
              <li>Rengöring av toaletter och hygienutrymmen</li>
              <li>Avtorkning av skåp, hyllor och fasta installationer</li>
            </ul>

            <h4>Fördelar för företag</h4>
            <ul>
              <li>Säkerställer godkänd besiktning</li>
              <li>Professionellt resultat enligt krav</li>
              <li>Effektiv och strukturerad process</li>
              <li>Minimal påverkan på er verksamhet</li>
            </ul>

            <h4>Tilläggstjänst</h4>
            <p>Vi kan även hjälpa till med själva flytten vid behov, som en kompletterande tjänst.</p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med er förfrågan</li>
              <li>Vi bokar ett kostnadsfritt platsbesök</li>
              <li>Ni får en skräddarsydd offert baserad på lokalens behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du boka flyttstädning för ert företag? Kontakta oss idag för en kostnadsfri offert och platsbesök.</p>
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

export default MoveCleaningBusiness;
