import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const ContainerCleaning = () => {
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);

  // Contact form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const bookingUrl = "/api/booking";

  // Pricing logic based on image
  const calculatePrice = (units, freq) => {
    const numUnits = parseInt(units);
    const numFreq = parseInt(freq);

    if (!numUnits || !numFreq) {
      setPredictedPrice(0);
      setPricePerUnit(0);
      return;
    }

    let pricePerBodar = 0;

    // 1-10 units pricing
    if (numUnits >= 1 && numUnits <= 10) {
      if (numFreq === 5) pricePerBodar = 100;
      else if (numFreq === 3) pricePerBodar = 110;
      else if (numFreq === 2) pricePerBodar = 120;
      else if (numFreq === 1) pricePerBodar = 130;
    }
    // 11-20 units pricing
    else if (numUnits >= 11 && numUnits <= 20) {
      if (numFreq === 5) pricePerBodar = 65;
      else if (numFreq === 3) pricePerBodar = 75;
      else if (numFreq === 2) pricePerBodar = 95;
      else if (numFreq === 1) pricePerBodar = 100;
    }
    // 21-30 units pricing
    else if (numUnits >= 21 && numUnits <= 30) {
      if (numFreq === 5) pricePerBodar = 60;
      else if (numFreq === 3) pricePerBodar = 70;
      else if (numFreq === 2) pricePerBodar = 90;
      else if (numFreq === 1) pricePerBodar = 95;
    }
    // 31-50 units pricing
    else if (numUnits >= 31 && numUnits <= 50) {
      if (numFreq === 5) pricePerBodar = 55;
      else if (numFreq === 3) pricePerBodar = 65;
      else if (numFreq === 2) pricePerBodar = 80;
      else if (numFreq === 1) pricePerBodar = 85;
    }

    setPricePerUnit(pricePerBodar);
    const totalPrice = pricePerBodar * numUnits * numFreq * 4; // Monthly price (4 weeks)
    setPredictedPrice(totalPrice.toFixed(2));
  };

  const handleUnitsChange = (e) => {
    const value = e.target.value;
    setNumberOfUnits(value);
    calculatePrice(value, frequency);
  };

  const handleFrequencyChange = (e) => {
    const value = e.target.value;
    setFrequency(value);
    calculatePrice(numberOfUnits, value);
  };

  const sendToWebhook = async (e) => {
    e.preventDefault();

    const payload = {
      cleaningType: "Bodstädning",
      numberOfUnits: numberOfUnits,
      frequency: `${frequency} gånger/vecka`,
      pricePerUnit: pricePerUnit,
      totalPrice: predictedPrice,
      dateTime,
      contactPreference,
      name,
      email,
      phone,
      address,
    };

    try {
      const response = await fetch(bookingUrl, {
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

  const clearFormFields = () => {
    setNumberOfUnits("");
    setFrequency("");
    setDateTime("");
    setContactPreference("");
    setPredictedPrice(0);
    setPricePerUnit(0);
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

  const getFrequencyLabel = () => {
    if (!frequency) return "Ej angiven";
    if (frequency === "5") return "5 gånger/vecka (Måndag till fredag)";
    if (frequency === "3") return "3 gånger/vecka (Måndag/onsdag/fredag)";
    if (frequency === "2") return "2 gånger/vecka (Tisdag/torsdag)";
    if (frequency === "1") return "1 gång/vecka";
    return "Ej angiven";
  };

  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Bodstädning"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Bodstädning och etableringsstädning"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-5.jpg"
      />

      <div className="container ptb-50">
        <div className="row">
          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Beräkna pris för bodstädning</h2>
            <p>
              Vi erbjuder flexibla lösningar för bodstädning och etableringsstädning. 
              Priserna är exklusive moms och baserade på antal bodar och önskad städfrekvens.
              Välj ett datum för ett samtal eller besök så hjälper vi dig att skräddarsy 
              en lösning som passar dina behov.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="container-cleaning-form">
              <div className="form-group">
                <label htmlFor="numberOfUnits">Antal bodar</label>
                <input
                  type="number"
                  id="numberOfUnits"
                  className="form-control"
                  placeholder="Ange antal bodar"
                  min="1"
                  max="50"
                  value={numberOfUnits}
                  onChange={handleUnitsChange}
                  required
                />
                <small className="form-text text-muted">
                  Ange mellan 1-50 bodar för automatisk prisberäkning
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Städfrekvens per vecka</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={handleFrequencyChange}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="5">5 gånger/vecka (Måndag till fredag)</option>
                  <option value="3">3 gånger/vecka (Måndag/onsdag/fredag)</option>
                  <option value="2">2 gånger/vecka (Tisdag/torsdag)</option>
                  <option value="1">1 gång/vecka</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateTime">Önskat datum och tid</label>
                <input
                  type="datetime-local"
                  id="dateTime"
                  className="form-control"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactPreference">Kontaktmetod</label>
                <select
                  id="contactPreference"
                  className="form-control"
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  required
                >
                  <option value="">Välj kontaktmetod</option>
                  <option value="call">Bli uppringd</option>
                  <option value="visit">Få ett hembesök</option>
                </select>
              </div>
            </form>

            {pricePerUnit > 0 && (
              <div className="alert alert-info mt-3">
                <strong>Pris per bod:</strong> {pricePerUnit} kr/bod (exkl. moms)
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <div className="summary-frame">
              <h3>Summering:</h3>
              <ul className="summary-list">
                <li>
                  <strong>Antal bodar:</strong> {numberOfUnits || "Ej angiven"}
                </li>
                <li>
                  <strong>Städfrekvens:</strong> {getFrequencyLabel()}
                </li>
                <li>
                  <strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}
                </li>
                <li>
                  <strong>Kontaktmetod:</strong>{" "}
                  {contactPreference === "call"
                    ? "Bli uppringd"
                    : contactPreference === "visit"
                    ? "Få ett hembesök"
                    : "Ej angiven"}
                </li>
                {pricePerUnit > 0 && (
                  <li>
                    <strong>Pris per bod:</strong> {pricePerUnit} kr
                  </li>
                )}
                <li>
                  <strong>Uppskattat månadspris:</strong> {predictedPrice || "0"} kr (exkl. moms)
                </li>
              </ul>
              <button
                type="button"
                className="default-btn"
                onClick={() => setShowContactForm(true)}
                disabled={!numberOfUnits || !frequency || !dateTime || !contactPreference}
              >
                Boka tjänsten
              </button>
              <p className="mt-3" style={{ fontSize: "13px", color: "#666" }}>
                * Priser per timme exklusive moms.<br />
                * Månadspriset är beräknat på 4 veckor.
              </p>
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
                      placeholder="Ange adressen för bodarna"
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

export default ContainerCleaning;