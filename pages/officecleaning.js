import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const HomeCleaning = () => {
  const [size, setSize] = useState(""); // State for size input
  const [frequency, setFrequency] = useState(""); // State for cleaning frequency
  const [predictedPrice, setPredictedPrice] = useState(0); // State for predicted price
  const [cleaningTime, setCleaningTime] = useState(0); // State for cleaning time

  // Function to calculate both cleaning time and price
  const calculateResults = () => {
    const area = parseFloat(size); // Convert size to a number
    let hourlyRate = 0;
    let sessionsPerMonth = 0;

    // Determine hourly rate and sessions per month based on frequency
    switch (frequency) {
      case "1":
        hourlyRate = 350; // 1 gång per månad
        sessionsPerMonth = 1;
        break;
      case "2":
        hourlyRate = 163; // 2 gånger per månad
        sessionsPerMonth = 2;
        break;
      case "4":
        hourlyRate = 150; // 4 gånger per månad
        sessionsPerMonth = 4;
        break;
      default:
        hourlyRate = 0; // Default to 0 if no frequency is selected
        sessionsPerMonth = 0;
    }

    if (!isNaN(area)) {
      // Calculate cleaning time
      const time = 1.57 + 0.0167 * area; // Formula: Time (h) = 1.57 + 0.0167 * Area (m²)
      setCleaningTime(time.toFixed(2)); // Format time to 2 decimal places

      // Calculate total price for the month
      if (hourlyRate > 0 && sessionsPerMonth > 0) {
        const calculatedPrice = hourlyRate * time * sessionsPerMonth; // Total price for the month
        setPredictedPrice(calculatedPrice.toFixed(2)); // Format price to 2 decimal places
      } else {
        setPredictedPrice(0); // Default to 0 if frequency is invalid
      }
    } else {
      setCleaningTime(0); // Default to 0 if size is invalid
      setPredictedPrice(0); // Default to 0 if size is invalid
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    calculateResults(); // Calculate both cleaning time and price
  };

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="kontorsstädning" bgImage="/images/page-title-bg-5.jpg" />

      <div className="container ptb-50">
        <div className="row">
          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Kontorsstädning</h2>
            <h5>
              Pris för kontorsstädning varierar beroende på antalet städtillfällen per månad.
              Se ditt preliminära städpris och boka tjänsten.
            </h5>
            <form onSubmit={handleSubmit} className="home-cleaning-form">
              <div className="form-group">
                <label htmlFor="size">Storlek i m²</label>
                <input
                  type="number"
                  id="size"
                  className="form-control"
                  placeholder="Ange storlek"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="frequency">Frekvens</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="1">1 gång per månad (350 kr/h, minst 2 timmar)</option>
                  <option value="2">2 gånger per månad (163 kr/h)</option>
                  <option value="4">4 gånger per månad (150 kr/h)</option>
                </select>
              </div>
              <button type="submit" className="default-btn">
                Beräkna pris
              </button>
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
                  <strong>Frekvens:</strong>{" "}
                  {frequency === "1"
                    ? "1 gång per månad"
                    : frequency === "2"
                    ? "2 gånger per månad"
                    : frequency === "4"
                    ? "4 gånger per månad"
                    : "Ej angiven"}
                </li>
                <li>
                  <strong>Beräknad tid:</strong> {cleaningTime || "0"} timmar
                </li>
                <li>
                  <strong>Totalpris för månaden:</strong> {predictedPrice || "0"} kr
                </li>
              </ul>
              <button className="default-btn">Boka tjänsten</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default HomeCleaning;