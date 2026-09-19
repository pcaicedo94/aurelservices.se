import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const CarpetWashing = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Mattvätt" bgImage="/images/banners/mattvatt.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Mattvätt i Stockholm – Professionell rengöring av mattor</h2>
            <p>
              Har dina mattor blivit smutsiga eller slitna? Aurel Städ &amp; Allservice erbjuder professionell mattvätt i Stockholm för privatpersoner, företag och bostadsrättsföreningar. Vi rengör dina mattor på djupet och återställer deras fräschör.
            </p>

            <h3>Vad vi erbjuder</h3>
            <ul>
              <li>Djuprengöring av mattor</li>
              <li>Borttagning av fläckar och smuts</li>
              <li>Rengöring som förbättrar hygien och inomhusmiljö</li>
              <li>Anpassade metoder beroende på material</li>
            </ul>

            <h3>Fördelar</h3>
            <ul>
              <li>Fräschare och renare mattor</li>
              <li>Förlänger mattans livslängd</li>
              <li>Bättre inomhusmiljö</li>
              <li>Professionellt resultat</li>
            </ul>

            <h3>Flexibla upplägg</h3>
            <p>Vi erbjuder både enstaka tvättar och återkommande underhåll, anpassat efter behov.</p>

            <h3>Så fungerar det</h3>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert baserad på mattans storlek och skick</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du boka mattvätt i Stockholm? Kontakta oss idag för offert och rådgivning.</p>
              <button type="button" className="default-btn" onClick={() => setShowQuote(true)}>
                Begär offert
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Mattvätt"
      />

      <Footer />
    </>
  );
};

export default CarpetWashing;
