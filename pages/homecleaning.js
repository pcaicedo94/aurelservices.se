import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const HomeCleaning = () => {
  const [size, setSize] = useState(""); // State for size input
  const [frequency, setFrequency] = useState(""); // State for cleaning frequency
  const [predictedPrice, setPredictedPrice] = useState(0); // State for predicted price
  const [cleaningTime, setCleaningTime] = useState(0); // State for cleaning time

  // Function to calculate cleaning time
  const calculateCleaningTime = (size) => {
    return 1.57 + 0.0167 * size; // Formula: Time (h) = 1.57 + 0.0167 * Area (m²)
  };

  // Function to calculate price based on frequency
  const calculatePrice = (size, hourlyRate, frequency) => {
    const cleaningTime = calculateCleaningTime(size);
    return (cleaningTime * hourlyRate * frequency).toFixed(2); // Total price
  };

  // Pricing table data
  const pricingTable = [
    {
      frequency: "Enstaka hemstädning",
      size: 45,
      price: calculatePrice(45, 200, 1), // Individual cleaning has 200kr/h
    },
    {
      frequency: "1 gång/månad",
      size: 45,
      price: calculatePrice(45, 195, 1), // 195kr/h for 1 cleaning per month
    },
    {
      frequency: "2 gånger/månad",
      size: 45,
      price: calculatePrice(45, 190, 2), // 190kr/h for 2 cleanings per month
    },
    {
      frequency: "4 gånger/månad",
      size: 45,
      price: calculatePrice(45, 180, 4), // 180kr/h for 4 cleanings per month
    },
    {
      frequency: "Enstaka hemstädning",
      size: 60,
      price: calculatePrice(60, 200, 1), // Individual cleaning has 200kr/h
    },
    {
      frequency: "1 gång/månad",
      size: 60,
      price: calculatePrice(60, 195, 1), // 195kr/h for 1 cleaning per month
    },
    {
      frequency: "2 gånger/månad",
      size: 60,
      price: calculatePrice(60, 190, 2), // 190kr/h for 2 cleanings per month
    },
    {
      frequency: "4 gånger/månad",
      size: 60,
      price: calculatePrice(60, 180, 4), // 180kr/h for 4 cleanings per month
    },
    {
      frequency: "Enstaka hemstädning",
      size: 100,
      price: calculatePrice(100, 200, 1), // Individual cleaning has 200kr/h
    },
    {
      frequency: "1 gång/månad",
      size: 100,
      price: calculatePrice(100, 195, 1), // 195kr/h for 1 cleaning per month
    },
    {
      frequency: "2 gånger/månad",
      size: 100,
      price: calculatePrice(100, 190, 2), // 190kr/h for 2 cleanings per month
    },
    {
      frequency: "4 gånger/månad",
      size: 100,
      price: calculatePrice(100, 180, 4), // 180kr/h for 4 cleanings per month
    },
  ];

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const area = parseFloat(size);
    const hourlyRate = frequency === "1" ? 195 : frequency === "2" ? 190 : frequency === "4" ? 180 : 0;
    const sessionsPerMonth = parseInt(frequency, 10);
    const cleaningTime = calculateCleaningTime(area);
    const calculatedPrice = cleaningTime * hourlyRate * sessionsPerMonth;
    setCleaningTime(cleaningTime.toFixed(2));
    setPredictedPrice(calculatedPrice.toFixed(2));
  };

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Hemstädning" bgImage="/images/peaceful.jpg" />

      <div className="container ptb-50">
        <div className="row">
          {/* Pricing Table Section */}
          <div className="col-lg-12">
            <h2>Vad kostar hemstädning?</h2>
            <p>
              Pris för hemstädning varierar beroende på antalet städtillfällen per månad
               och storleken på bostaden, som påverkar antal timmar det tar per städtillfälle.
              Minsta antal timmar för städtillfälle är 2 timmar. Här är några exempel på 
              vad hemstädning kan kosta:
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th>Frekvens</th>
                  <th>Kvadratmeter</th>
                  <th>Pris</th>
                </tr>
              </thead>
              <tbody>
                {pricingTable.map((row, index) => (
                  <tr key={index}>
                    <td>{row.frequency}</td>
                    <td>{row.size}</td>
                    <td>{row.price} kr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Beräkna hur mycket hemstädning kostar</h2>
            <p>
              Se ditt preliminära städpris och boka tjänsten. Vi räknar med att använda dina egna städprodukter och
              utrustning. Om du föredrar att Aurel Services ska stå för produkter med mera kommer dessa debiteras och 
              finnas specificerade, på månadsfakturan. 
            </p>
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
                  <option value="1">1 gång/månad (195 kr/h)</option>
                  <option value="2">2 gånger/månad (190 kr/h)</option>
                  <option value="4">4 gånger/månad (180 kr/h)</option>
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
              <button className="default-btn">Kontakta oss</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default HomeCleaning;
