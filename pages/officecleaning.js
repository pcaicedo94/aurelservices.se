import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const FREQUENCIES = {
  1: { label: "1 gång per månad", hourlyRate: 350 },
  2: { label: "2 gånger per månad", hourlyRate: 163 },
  4: { label: "4 gånger per månad", hourlyRate: 150 },
};

const OfficeCleaning = () => {
  const [size, setSize] = useState("");
  const [frequency, setFrequency] = useState("");
  const [showQuote, setShowQuote] = useState(false);

  // Derived on every render, so the summary follows the inputs as they change
  // instead of waiting for a "Beräkna pris" click.
  const area = parseFloat(size);
  const plan = FREQUENCIES[frequency];
  const hasArea = !isNaN(area) && area > 0;
  const cleaningTime = hasArea ? (1.57 + 0.0167 * area).toFixed(2) : 0;
  const predictedPrice = hasArea && plan ? (plan.hourlyRate * cleaningTime * Number(frequency)).toFixed(2) : 0;

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Kontorsstädning" bgImage="/images/banners/kontorsstadning.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-7">
            <h2>Kontorsstädning i Stockholm – Professionell städservice för företag</h2>
            <p>
              Vill ni ha en ren, trivsam och professionell arbetsmiljö? Aurel Städ &amp; Allservice erbjuder kontorsstädning i Stockholm anpassad efter ert företags behov. Vi hjälper er att skapa en ren och välskött arbetsplats för både personal och kunder.
            </p>
          </div>
          <div className="col-lg-5 mt-4 mt-lg-0">
            <div className="info-card">
              <h4>Vad ingår i kontorsstädning</h4>
              <ul>
                <li>Dammsugning och våttorkning av golv</li>
                <li>Tömning av papperskorgar</li>
                <li>Rengöring av kök och personalutrymmen</li>
                <li>Rengöring av toaletter och hygienutrymmen</li>
                <li>Avtorkning av skrivbord och ytor</li>
                <li>Påfyllning av förbrukningsmaterial vid behov</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row" style={{ marginTop: "30px" }}>
          <div className="col-lg-6 mb-4 mb-lg-0">
            {/* Heading lives inside the card so the card fills the height of the
                summary beside it instead of leaving an empty band. */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="home-cleaning-form"
              style={{ marginTop: 0, height: "100%" }}
            >
              <h3>Beräkna pris</h3>
              <p>
                Pris för kontorsstädning varierar beroende på antalet städtillfällen per månad. Se ditt preliminära städpris och boka tjänsten.
              </p>
              <div className="form-group">
                <label htmlFor="size">Storlek i m²</label>
                <input
                  type="number"
                  id="size"
                  className="form-control"
                  placeholder="Ange storlek"
                  min="1"
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
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <div className="summary-frame" style={{ height: "100%" }}>
              <h3>Summering:</h3>
              <ul className="summary-list">
                <li>
                  <strong>Storlek:</strong> {size || "Ej angiven"} m²
                </li>
                <li>
                  <strong>Frekvens:</strong> {plan ? plan.label : "Ej angiven"}
                </li>
                <li>
                  <strong>Beräknad tid per städning:</strong> {cleaningTime || "0"} timmar
                </li>
                {plan && (
                  <li>
                    <strong>Timtaxa:</strong> {plan.hourlyRate} kr/h
                  </li>
                )}
                <li>
                  <strong>Totalpris för månaden:</strong> {predictedPrice || "0"} kr
                </li>
              </ul>
              <button
                type="button"
                className="default-btn"
                onClick={() => setShowQuote(true)}
                disabled={!hasArea || !plan}
              >
                Boka tjänsten
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Kontorsstädning"
        title="Boka tjänsten"
        subject="Bokningsförfrågan – Kontorsstädning"
        addressPlaceholder="Ange kontorets adress"
        details={
          plan
            ? {
                Storlek: `${size} m²`,
                Frekvens: plan.label,
                "Beräknad tid per städning": `${cleaningTime} timmar`,
                "Uppskattat pris per månad": `${predictedPrice} kr`,
              }
            : null
        }
      />

      <Footer />
    </>
  );
};

export default OfficeCleaning;
