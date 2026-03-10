import React, { useState, useEffect } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const MoveCleaning = () => {
  const [size, setSize] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [predictedPrice, setPredictedPrice] = useState(0);
  const [cleaningTime, setCleaningTime] = useState(0);
  
  // Extra services checkboxes
  const [hasKylFrysDefrost, setHasKylFrysDefrost] = useState(false);
  const [hasPersienner, setHasPersienner] = useState(false);
  const [hasBalkonger, setHasBalkonger] = useState(false);
  const [hasBalkongerGlas, setHasBalkongerGlas] = useState(false);
  
  // Contact form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const bookingUrl = "/api/booking";

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

  // Calculate base price and time
  const calculateBasePrice = (area) => {
    if (!isNaN(area) && area > 0) {
      // Calculate time
      const time = 1.57 + 0.0167 * area;
      setCleaningTime(time.toFixed(2));

      // Calculate base price
      let price = 0;
      if (area >= 1 && area <= 50) {
        price = 3179;
      } else if (area > 50 && area <= 100) {
        price = area * 49;
      } else if (area > 100 && area <= 150) {
        price = area * 44;
      } else if (area > 150) {
        price = area * 39;
      }
      setBasePrice(price);
      return price;
    }
    setBasePrice(0);
    setCleaningTime(0);
    return 0;
  };

  // Calculate total price with extras
  useEffect(() => {
    let total = basePrice;
    
    // Add extra services
    if (hasKylFrysDefrost) total += 400;
    if (hasPersienner) total += 360;
    if (hasBalkonger) total += cleaningTime * 360; // 360 kr/timmen
    if (hasBalkongerGlas) total += 650;
    
    setPredictedPrice(total.toFixed(2));
  }, [basePrice, hasKylFrysDefrost, hasPersienner, hasBalkonger, hasBalkongerGlas, cleaningTime]);

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

  // Handle size input change
  const handleSizeChange = (e) => {
    const area = parseFloat(e.target.value);
    setSize(e.target.value);
    calculateBasePrice(area);
  };

  // Function to send booking data
  const sendToWebhook = async (e) => {
    e.preventDefault();

    const extras = [];
    if (hasKylFrysDefrost) extras.push("Kyl/Frys med avfrostning");
    if (hasPersienner) extras.push("Persienner (kan bokas som tillägg)");
    if (hasBalkonger) extras.push("Städning av biytor såsom förråd, garage och balkonger");
    if (hasBalkongerGlas) extras.push("Fönsterputsning av inglasade balkonger");

    const payload = {
      cleaningType: "Flyttstädning",
      area: size,
      hours: cleaningTime,
      dateTime,
      basePrice,
      extras: extras.join(", "),
      totalPrice: predictedPrice,
      name,
      email,
      phone,
      address,
    };

    try {
      const response = await fetch(bookingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  // Function to clear all form fields
  const clearFormFields = () => {
    setSize("");
    setDateTime("");
    setBasePrice(0);
    setCleaningTime(0);
    setPredictedPrice(0);
    setHasKylFrysDefrost(false);
    setHasPersienner(false);
    setHasBalkonger(false);
    setHasBalkongerGlas(false);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setShowContactForm(false);
  };

  // Function to handle popup close and refresh the page
  const handlePopupClose = () => {
    setShowPopup(false);
    window.location.reload();
  };

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Flyttstädning" bgImage="/images/moving.jpg" />

      <div className="container ptb-50">
        <div className="row">
          {/* First Form Section */}
          <div className="col-lg-6">
            <h2>Flyttstädning</h2>
            <form className="move-cleaning-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="size">Storlek i m²</label>
                <input
                  type="number"
                  id="size"
                  className="form-control"
                  placeholder="Ange storlek"
                  value={size}
                  onChange={handleSizeChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tilläggstjänster</label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrysdefrost"
                    checked={hasKylFrysDefrost}
                    onChange={(e) => setHasKylFrysDefrost(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kylfrysdefrost">
                    Kyl/Frys med avfrostning - 400 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="persienner"
                    checked={hasPersienner}
                    onChange={(e) => setHasPersienner(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="persienner">
                    Persienner (kan bokas som tillägg) - 360 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="balkonger"
                    checked={hasBalkonger}
                    onChange={(e) => setHasBalkonger(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="balkonger">
                    Städning av biytor såsom förråd, garage och balkonger - 360 kr/timmen
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="balkongerglas"
                    checked={hasBalkongerGlas}
                    onChange={(e) => setHasBalkongerGlas(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="balkongerglas">
                    Fönsterputsning av inglasade balkonger - 650 kr
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dateTime">Önskat datum och tid (Mellan 07:00-17:00)</label>
                <input
                  type="datetime-local"
                  id="dateTime"
                  className="form-control"
                  value={dateTime}
                  onChange={handleDateTimeChange}
                  min={minDateTime}
                  step="1800"
                  required
                />
              </div>
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <div className="summary-frame">
              <h3>Summering:</h3>
              <ul className="summary-list">
                <li>
                  <strong>Storlek:</strong> {size || "Ej angiven"} m²
                </li>
                <li>
                  <strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}
                </li>
                <li>
                  <strong>Beräknad tid:</strong> {cleaningTime || "0"} timmar
                </li>
                <li>
                  <strong>Baspris:</strong> {basePrice || "0"} kr
                </li>
                <li>
                  <strong>Tillägg:</strong>{" "}
                  {[
                    hasKylFrysDefrost && "Kyl/Frys",
                    hasPersienner && "Persienner",
                    hasBalkonger && "Biytor",
                    hasBalkongerGlas && "Fönsterputsning balkong"
                  ].filter(Boolean).join(", ") || "Inga"}
                </li>
                <li>
                  <strong>Uppskattat totalpris:</strong> {predictedPrice || "0"} kr
                </li>
              </ul>
              <button
                type="button"
                className="default-btn"
                onClick={() => setShowContactForm(true)}
                disabled={!size || !dateTime}
              >
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
                  <div className="form-group">
                    <label htmlFor="name">Namn</label>
                    <input
                      type="text"
                      id="name"
                      className="form-control"
                      placeholder="Ange ditt namn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Adress</label>
                    <input
                      type="text"
                      id="address"
                      className="form-control"
                      placeholder="Ange din adress"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="default-btn">
                    Skicka
                  </button>
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
            <button className="default-btn" onClick={handlePopupClose}>
              OK
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default MoveCleaning;