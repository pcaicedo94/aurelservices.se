import React, { useState, useEffect } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const WindowCleaning = () => {
  // Form state
  const [rooms, setRooms] = useState("");
  const [hasSprojs, setHasSprojs] = useState(false);
  const [hasHighCeiling, setHasHighCeiling] = useState(false);
  const [hasTripleGlass, setHasTripleGlass] = useState(false);
  const [onlyBalcony, setOnlyBalcony] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(0);

  // Contact form and webhook state
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const webhookUrl = "https://cjsports.app.n8n.cloud/webhook/b2595e41-0fff-46b9-aeff-4b54e879b2d8";

  // Calendar constraints
  useEffect(() => {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(7, 0, 0, 0);
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setMinDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  // Price calculation logic
  useEffect(() => {
    let basePrice = 0;
    if (onlyBalcony) {
      basePrice = 450;
    } else {
      switch (rooms) {
        case "1": basePrice = 799; break;
        case "2": basePrice = 899; break;
        case "3": basePrice = 999; break;
        case "4": basePrice = 1099; break;
        default: basePrice = 0;
      }
    }

    if (basePrice > 0) {
      let finalPrice = basePrice;
      if (hasSprojs) finalPrice *= 1.25;
      if (hasHighCeiling) finalPrice *= 1.25;
      if (hasTripleGlass) finalPrice *= 1.25;
      setPredictedPrice(finalPrice.toFixed(2));
    } else if (rooms === "5") {
      setPredictedPrice("Offereras");
    } else {
      setPredictedPrice(0);
    }
  }, [rooms, hasSprojs, hasHighCeiling, hasTripleGlass, onlyBalcony]);

  // Time validation
  const handleDateTimeChange = (e) => {
    const selectedDateTime = e.target.value;
    if (selectedDateTime) {
      const selectedHour = new Date(selectedDateTime).getHours();
      if (selectedHour < 7 || selectedHour >= 17) {
        alert("Vänligen välj en tid mellan 07:00 och 17:00.");
        setDateTime("");
        return;
      }
    }
    setDateTime(selectedDateTime);
  };

  // Webhook submission
  const sendToWebhook = async (e) => {
    e.preventDefault();
    const addOns = [
      hasSprojs && "Spröjs",
      hasHighCeiling && "Hög takhöjd",
      hasTripleGlass && "Treglasfönster"
    ].filter(Boolean).join(", ");

    const payload = {
      cleaningType: "Fönsterputsning",
      rooms: onlyBalcony ? "Endast balkong" : `${rooms} rum och kök`,
      addOns,
      totalPrice: predictedPrice,
      dateTime,
      name,
      email,
      phone,
      address,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setPopupMessage(data.message || "Bokning skapad!");
    } catch (error) {
      setPopupMessage("Kunde inte ansluta till servern. Försök igen.");
    } finally {
      setShowPopup(true);
      clearFormFields();
    }
  };

  // Helper functions
  const clearFormFields = () => {
    setRooms("");
    setHasSprojs(false);
    setHasHighCeiling(false);
    setHasTripleGlass(false);
    setOnlyBalcony(false);
    setDateTime("");
    setPredictedPrice(0);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setShowContactForm(false);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    window.location.reload();
  };

  const isBookingDisabled = !dateTime || (!onlyBalcony && !rooms) || rooms === "5";

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Fönsterputsning" bgImage="/images/window-cleaning-banner.jpg" />

      <div className="container ptb-50">
        <div className="row">
          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Priser för Fönsterputsning</h2>
            <p>Priser inkl. Moms efter Rut avdrag. I priserna ingår rengöring av fönstrets bågar och dammning av persienner.</p>
            
            <form onSubmit={(e) => e.preventDefault()} className="window-cleaning-form">
              <div className="form-group">
                <label htmlFor="rooms">Antal rum</label>
                <select id="rooms" className="form-control" value={rooms} onChange={(e) => { setRooms(e.target.value); setOnlyBalcony(false); }} required={!onlyBalcony}>
                  <option value="">Välj antal rum</option>
                  <option value="1">1 rum och kök</option>
                  <option value="2">2 rum och kök</option>
                  <option value="3">3 rum och kök</option>
                  <option value="4">4 rum och kök</option>
                  <option value="5">5 rum och kök eller större</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tillägg</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="sprojs" checked={hasSprojs} onChange={(e) => setHasSprojs(e.target.checked)} />
                  <label className="form-check-label" htmlFor="sprojs">Spröjs (+25%)</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="highCeiling" checked={hasHighCeiling} onChange={(e) => setHasHighCeiling(e.target.checked)} />
                  <label className="form-check-label" htmlFor="highCeiling">Takhöjd över 280 cm (+25%)</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="tripleGlass" checked={hasTripleGlass} onChange={(e) => setHasTripleGlass(e.target.checked)} />
                  <label className="form-check-label" htmlFor="tripleGlass">Treglasfönster eller mer (+25%)</label>
                </div>
              </div>

              <div className="form-group">
                <label>Endast Balkong</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="onlyBalcony" checked={onlyBalcony} onChange={(e) => { setOnlyBalcony(e.target.checked); if (e.target.checked) setRooms(""); }} />
                  <label className="form-check-label" htmlFor="onlyBalcony">Endast inglasad balkong (från 450 kr)</label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dateTime">Önskat datum och tid (Mellan 07:00-17:00)</label>
                <input type="datetime-local" id="dateTime" className="form-control" value={dateTime} onChange={handleDateTimeChange} min={minDateTime} step="1800" required />
              </div>
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <div className="summary-frame">
              <h3>Summering:</h3>
              <ul className="summary-list">
                <li><strong>Val:</strong> {onlyBalcony ? "Endast balkong" : rooms ? `${rooms} rum och kök` : "Ej angiven"}</li>
                <li><strong>Tillägg:</strong> {[hasSprojs && "Spröjs", hasHighCeiling && "Hög takhöjd", hasTripleGlass && "Treglasfönster"].filter(Boolean).join(", ") || "Inga"}</li>
                <li><strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}</li>
                <li><strong>Uppskattat pris:</strong> {predictedPrice === "Offereras" ? "Offereras" : `${predictedPrice} kr`}</li>
              </ul>
              {rooms === "5" && !onlyBalcony && <p className="offer-text">För 5 rum eller större, vänligen kontakta oss för en offert.</p>}
              <button type="button" className="default-btn" onClick={() => setShowContactForm(true)} disabled={isBookingDisabled}>
                Boka tjänsten
              </button>
            </div>
          </div>

          {/* Contact Form Accordion */}
          {showContactForm && (
            <div className="col-lg-12">
              <div className="accordion">
                <h3>Kontaktformulär</h3>
                <form className="contact-form" onSubmit={sendToWebhook}>
                  <div className="form-group"><label htmlFor="name">Namn</label><input type="text" id="name" className="form-control" placeholder="Ange ditt namn" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                  <div className="form-group"><label htmlFor="email">E-post</label><input type="email" id="email" className="form-control" placeholder="Ange din e-post" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div className="form-group"><label htmlFor="phone">Telefonnummer</label><input type="tel" id="phone" className="form-control" placeholder="Ange ditt telefonnummer" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
                  <div className="form-group"><label htmlFor="address">Adress</label><input type="text" id="address" className="form-control" placeholder="Ange din adress" value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
                  <button type="submit" className="default-btn">Skicka</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup Window */}
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

export default WindowCleaning;
