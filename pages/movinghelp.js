import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const MovingHelp = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Flytthjälp" bgImage="/images/banners/flytthjalp.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Flytthjälp i Stockholm – Smidig och säker flytt</h2>
            <p>
              Behöver du hjälp med flytt? Aurel Städ &amp; Allservice erbjuder professionell flytthjälp i Stockholm för privatpersoner, företag och bostadsrättsföreningar. Vi ser till att din flytt sker smidigt, säkert och effektivt.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Hjälp med packning vid behov</li>
              <li>Transport av möbler och tillhörigheter</li>
              <li>Bärhjälp och lastning</li>
              <li>Montering och demontering av möbler</li>
              <li>Flexibla lösningar efter behov</li>
            </ul>

            <h4>Fördelar</h4>
            <ul>
              <li>Trygg och säker hantering av dina tillhörigheter</li>
              <li>Effektiv flyttprocess</li>
              <li>Flexibla upplägg</li>
              <li>En smidig helhetslösning tillsammans med flyttstädning</li>
            </ul>

            <h4>Flexibla upplägg</h4>
            <p>Vi erbjuder både mindre flyttar och större uppdrag, anpassade efter dina eller era behov.</p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert baserad på omfattning och behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du ha hjälp med flytt i Stockholm? Kontakta oss idag för offert och planering.</p>
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
        service="Flytthjälp"
      />

      <Footer />
    </>
  );
};

export default MovingHelp;
