import React, { useState, useEffect } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const HomeCleaning = () => {
  // States from original HomeCleaning
  const [size, setSize] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(0);
  const [cleaningTime, setCleaningTime] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);

  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const bookingUrl = "/api/booking";

  // Calendar constraints (preserved)
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

  // Time validation (preserved)
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
    // Recalculate when date changes
    updateCalculations(size, frequency, selectedDateTime);
  };

  // Calculate hourly rate based on day and frequency
  const getHourlyRate = (selectedDateTime, selectedFrequency) => {
    // Special rates for monthly and one-time cleanings
    if (selectedFrequency === "1") return 220; // Once a month
    if (selectedFrequency === "onetime") return 250; // One-time cleaning

    // Day-based rates for regular cleanings
    if (selectedDateTime) {
      const dayOfWeek = new Date(selectedDateTime).getDay();
      // Monday (1), Tuesday (2), Wednesday (3) = 180 kr
      if (dayOfWeek >= 1 && dayOfWeek <= 3) return 180;
      // Thursday (4), Friday (5) = 195 kr
      if (dayOfWeek >= 4 && dayOfWeek <= 5) return 195;
    }
    return 0;
  };

  // Combined calculation logic
  const updateCalculations = (currentSize, currentFrequency, currentDateTime) => {
    if (currentSize && currentFrequency && currentDateTime) {
      const area = parseFloat(currentSize);
      const rate = getHourlyRate(currentDateTime, currentFrequency);
      const time = 1.57 + 0.0167 * area;
      
      setHourlyRate(rate);
      setCleaningTime(time.toFixed(2));

      // Calculate monthly price
      let monthlyPrice;
      if (currentFrequency === "onetime") {
        monthlyPrice = time * rate; // One-time only
      } else {
        const sessionsPerMonth = parseInt(currentFrequency, 10);
        monthlyPrice = time * rate * sessionsPerMonth;
      }
      
      setPredictedPrice(monthlyPrice.toFixed(2));
    }
  };

  const handleSizeChange = (e) => {
    setSize(e.target.value);
    updateCalculations(e.target.value, frequency, dateTime);
  };

  const handleFrequencyChange = (e) => {
    setFrequency(e.target.value);
    updateCalculations(size, e.target.value, dateTime);
  };

  // Webhook submission logic
  const sendToWebhook = async (e) => {
    e.preventDefault();

    const payload = {
      cleaningType: "Hemstädning",
      area: size,
      frequency: frequency === "onetime" ? "Enstaka hemstädning" : `${frequency} gång/gånger per månad`,
      dateTime,
      hourlyRate,
      totalPrice: predictedPrice,
      estimatedHours: cleaningTime,
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

  // Helper functions
  const clearFormFields = () => {
    setSize("");
    setFrequency("");
    setDateTime("");
    setPredictedPrice(0);
    setCleaningTime(0);
    setHourlyRate(0);
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

  // Get frequency label for display
  const getFrequencyLabel = () => {
    if (!frequency) return "Ej angiven";
    if (frequency === "onetime") return "Enstaka hemstädning";
    return `${frequency} gång${frequency !== "1" ? "er" : ""} per månad`;
  };

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Hemstädning" bgImage="/images/peaceful.jpg" />

      <div className="container ptb-50">
        <div className="row">
          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Beräkna hur mycket hemstädning kostar</h2>
            <p>
              Se ditt preliminära städpris och boka tjänsten. Vi räknar med att använda dina egna städprodukter och
              utrustning. Om du föredrar att Aurel Services ska stå för produkter med mera kommer dessa debiteras och
              finnas specificerade, på månadsfakturan.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="home-cleaning-form">
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
                <label htmlFor="frequency">Frekvens</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={handleFrequencyChange}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="onetime">Enstaka hemstädning (250 kr/h)</option>
                  <option value="1">1 gång/månad (220 kr/h)</option>
                  <option value="2">2 gånger/månad</option>
                  <option value="4">4 gånger/månad</option>
                </select>
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
                {dateTime && frequency !== "1" && frequency !== "onetime" && (
                  <small className="form-text text-muted">
                    Timtaxa för vald dag: {hourlyRate} kr/h
                    {hourlyRate === 180 && " (Måndag-Onsdag)"}
                    {hourlyRate === 195 && " (Torsdag-Fredag)"}
                  </small>
                )}
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
                  <strong>Frekvens:</strong> {getFrequencyLabel()}
                </li>
                <li>
                  <strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}
                </li>
                <li>
                  <strong>Beräknad tid per städning:</strong> {cleaningTime || "0"} timmar
                </li>
                {hourlyRate > 0 && (
                  <li>
                    <strong>Timtaxa:</strong> {hourlyRate} kr/h
                  </li>
                )}
                <li>
                  <strong>{frequency === "onetime" ? "Totalpris:" : "Totalpris för månaden:"}</strong> {predictedPrice || "0"} kr
                </li>
              </ul>
              <button
                type="button"
                className="default-btn"
                onClick={() => setShowContactForm(true)}
                disabled={!size || !frequency || !dateTime}
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

export default HomeCleaning;