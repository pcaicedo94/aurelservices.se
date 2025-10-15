import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const DeepCleaning = () => {
  const [size, setSize] = useState(""); // State for size input
  const [dateTime, setDateTime] = useState(""); // State for date and time input
  const [contactPreference, setContactPreference] = useState(""); // State for contact preference
  const [predictedPrice, setPredictedPrice] = useState(0); // State for predicted price
  const [showContactForm, setShowContactForm] = useState(false); // State for toggling contact form
  const [name, setName] = useState(""); // State for name input
  const [email, setEmail] = useState(""); // State for email input
  const [phone, setPhone] = useState(""); // State for phone input
  const [address, setAddress] = useState(""); // State for address input
  const [showPopup, setShowPopup] = useState(false); // State for showing popup
  const [popupMessage, setPopupMessage] = useState(""); // State for popup message

  const webhookUrl = "http://localhost:5678/webhook/b2595e41-0fff-46b9-aeff-4b54e879b2d8"; // Replace with your n8n webhook URL

  // Function to calculate the predicted price based on area
  const calculatePrice = (area) => {
    if (!isNaN(area)) {
      let calculatedPrice = 0;

      if (area >= 1 && area <= 50) {
        calculatedPrice = 2520; // Fixed price for area between 1-50 sqm
      } else if (area > 50 && area <= 70) {
        calculatedPrice = 3045; // Fixed price for area between 51-70 sqm
      } else if (area > 70 && area <= 100) {
        calculatedPrice = 3570; // Fixed price for area between 71-100 sqm
      } else if (area > 100 && area <= 150) {
        calculatedPrice = 4200; // Fixed price for area between 101-150 sqm
      } else if (area > 150) {
        calculatedPrice = 4800; // Fixed price for area 151 sqm or more
      }

      setPredictedPrice(calculatedPrice.toFixed(2)); // Format price to 2 decimal places
    } else {
      setPredictedPrice(0); // Default to 0 if size is invalid
    }
  };

  // Handle size input change
  const handleSizeChange = (e) => {
    const area = parseFloat(e.target.value); // Convert input value to a number
    setSize(e.target.value); // Update size state
    calculatePrice(area); // Automatically calculate price
  };

  // Function to send data to the webhook
  const sendToWebhook = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const payload = {
      cleaningType: "Storstädning", // Cleaning type
      area: size,
      dateTime,
      contactPreference,
      name,
      email,
      phone,
      address,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json(); // Parse the JSON response
      setPopupMessage(data.message || "Event created successfully!"); // Update the popup message
    } catch (error) {
      setPopupMessage("Error connecting to the server. Please try again."); // Handle network errors
    } finally {
      setShowPopup(true); // Show the popup
      clearFormFields(); // Clear all form fields
    }
  };

  // Function to clear all form fields
  const clearFormFields = () => {
    setSize("");
    setDateTime("");
    setContactPreference("");
    setPredictedPrice(0);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setShowContactForm(false); // Hide the contact form
  };

  // Function to handle popup close and refresh the page
  const handlePopupClose = () => {
    setShowPopup(false); // Hide the popup
    window.location.reload(); // Refresh the page
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
              Använd formuläret nedan för att beräkna ett preliminärt pris på tjänsten och boka ett möte med oss via telefon
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
                  <strong>Uppskattat pris:</strong> {predictedPrice || "0"} kr
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
