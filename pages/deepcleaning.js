import React, { useState, useEffect } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const DeepCleaning = () => {
  const [size, setSize] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [predictedPrice, setPredictedPrice] = useState(0);
  
  // Extra services checkboxes
  const [hasKylFrys, setHasKylFrys] = useState(false);
  const [hasKylFrysDefrost, setHasKylFrysDefrost] = useState(false);
  const [hasDiskmaskin, setHasDiskmaskin] = useState(false);
  const [hasKapGarderob, setHasKapGarderob] = useState(false);
  const [hasForrad, setHasForrad] = useState(false);
  const [hasTvattmaskin, setHasTvattmaskin] = useState(false);
  const [vaggtvattCount, setVaggtvattCount] = useState(0);
  
  // Contact form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const bookingUrl = "/api/booking";

  // Calculate base price based on area
  const calculateBasePrice = (area) => {
    if (!isNaN(area) && area > 0) {
      let price = 0;
      if (area >= 1 && area <= 50) price = 2650;
      else if (area > 50 && area <= 70) price = 3290;
      else if (area > 70 && area <= 100) price = 3950;
      else if (area > 100 && area <= 150) price = 4750;
      else if (area > 150) price = 4800;
      setBasePrice(price);
      return price;
    }
    setBasePrice(0);
    return 0;
  };

  // Calculate total price with extras
  useEffect(() => {
    let total = basePrice;
    
    // Add extra services
    if (hasKylFrys) total += 250;
    if (hasKylFrysDefrost) total += 360;
    if (hasDiskmaskin) total += 250;
    if (hasKapGarderob) total += 360;
    if (hasForrad) total += 360;
    if (hasTvattmaskin) total += 390;
    total += vaggtvattCount * 250;
    
    setPredictedPrice(total.toFixed(2));
  }, [basePrice, hasKylFrys, hasKylFrysDefrost, hasDiskmaskin, hasKapGarderob, hasForrad, hasTvattmaskin, vaggtvattCount]);

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
    if (hasKylFrys) extras.push("Kyl/Frys invändigt (ej avfrostning)");
    if (hasKylFrysDefrost) extras.push("Kyl/Frys med avfrostning");
    if (hasDiskmaskin) extras.push("Diskmaskin invändigt");
    if (hasKapGarderob) extras.push("Skåp och garderober invändigt");
    if (hasForrad) extras.push("Förråd");
    if (hasTvattmaskin) extras.push("Tvättmaskin/torktumlare invändigt");
    if (vaggtvattCount > 0) extras.push(`Väggtvätt (${vaggtvattCount} vägg${vaggtvattCount > 1 ? 'ar' : ''})`);

    const payload = {
      cleaningType: "Storstädning",
      area: size,
      dateTime,
      contactPreference,
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

  // Function to clear all form fields
  const clearFormFields = () => {
    setSize("");
    setDateTime("");
    setContactPreference("");
    setBasePrice(0);
    setPredictedPrice(0);
    setHasKylFrys(false);
    setHasKylFrysDefrost(false);
    setHasDiskmaskin(false);
    setHasKapGarderob(false);
    setHasForrad(false);
    setHasTvattmaskin(false);
    setVaggtvattCount(0);
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

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Storstädning" bgImage="/images/deepcleaning.jpg" />

      <div className="container ptb-50">
        <div className="row">
          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Storstädning</h2>
            <p>
              Vi bryr oss om kvaliteten på vårt arbete och strävar alltid efter att överträffa våra kunders förväntningar.
              Använd formuläret nedan för att beräkna ett preliminärt pris på tjänsten och boka ett möte hos oss via telefon
              eller ett direkt hembesök.
            </p>
            <form className="deep-cleaning-form" onSubmit={(e) => e.preventDefault()}>
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
                <label>Tillvalstjänster</label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrys"
                    checked={hasKylFrys}
                    onChange={(e) => setHasKylFrys(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kylfrys">
                    Kyl/Frys invändigt (ej avfrostning) - 250 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrysdefrost"
                    checked={hasKylFrysDefrost}
                    onChange={(e) => setHasKylFrysDefrost(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kylfrysdefrost">
                    Kyl/Frys med avfrostning - 360 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="diskmaskin"
                    checked={hasDiskmaskin}
                    onChange={(e) => setHasDiskmaskin(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="diskmaskin">
                    Diskmaskin invändigt - 250 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kapgarderob"
                    checked={hasKapGarderob}
                    onChange={(e) => setHasKapGarderob(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kapgarderob">
                    Skåp och garderober invändigt - 360 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="forrad"
                    checked={hasForrad}
                    onChange={(e) => setHasForrad(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="forrad">
                    Förråd - 360 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="tvattmaskin"
                    checked={hasTvattmaskin}
                    onChange={(e) => setHasTvattmaskin(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="tvattmaskin">
                    Tvättmaskin/torktumlare invändigt - 390 kr
                  </label>
                </div>
                <div className="form-group mt-3">
                  <label htmlFor="vaggtvatt">Väggtvätt (250 kr per vägg)</label>
                  <input
                    type="number"
                    id="vaggtvatt"
                    className="form-control"
                    placeholder="Antal väggar"
                    min="0"
                    value={vaggtvattCount}
                    onChange={(e) => setVaggtvattCount(parseInt(e.target.value) || 0)}
                  />
                </div>
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
                  <strong>Baspris:</strong> {basePrice || "0"} kr
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
                <li>
                  <strong>Uppskattat totalpris:</strong> {predictedPrice || "0"} kr
                </li>
              </ul>
              <button
                type="button"
                className="default-btn"
                onClick={() => setShowContactForm(true)}
                disabled={!size || !dateTime || !contactPreference}
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

export default DeepCleaning;
