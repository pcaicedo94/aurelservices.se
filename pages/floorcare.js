import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const FloorCare = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Golvvård" bgImage="/images/banners/storstadning.webp" bgPosition="center 25%" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Golvvård i Stockholm – Professionell behandling och underhåll av golv</h2>
            <p>
              Behöver dina golv en professionell behandling? Aurel Städ &amp; Allservice erbjuder golvvård i Stockholm för både företag och privatpersoner. Vi hjälper dig att förlänga livslängden på dina golv och återställa deras utseende med rätt behandling och underhåll.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Maskinell rengöring av golv</li>
              <li>Polering och ytbehandling</li>
              <li>Vaxning och boning</li>
              <li>Djuprengöring av slitna golv</li>
              <li>Underhåll av olika golvtyper</li>
            </ul>

            <h4>Golvtyper vi arbetar med</h4>
            <ul>
              <li>Plastgolv</li>
              <li>Laminatgolv</li>
              <li>Trägolv</li>
              <li>Stengolv och klinker</li>
            </ul>

            <h4>Fördelar med golvvård</h4>
            <ul>
              <li>Förlänger golvets livslängd</li>
              <li>Återställer glans och utseende</li>
              <li>Skyddar mot slitage och smuts</li>
              <li>Ger ett professionellt och välskött intryck</li>
            </ul>

            <h4>Flexibla upplägg</h4>
            <p>Vi erbjuder både enstaka behandlingar och löpande underhåll, anpassat efter behov och slitage.</p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert baserad på golvtyp och omfattning</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du ha professionell golvvård i Stockholm? Kontakta oss idag för offert och rådgivning.</p>
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
        service="Golvvård"
      />

      <Footer />
    </>
  );
};

export default FloorCare;
