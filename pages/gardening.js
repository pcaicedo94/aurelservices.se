import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const Gardening = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Seo route="/gardening" />

      <Navbar />
      <PageBanner pageTitle="Trädgårdsskötsel" bgImage="/images/banners/tradgardsskotsel.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Trädgårdsskötsel i Stockholm – Professionell hjälp med RUT-avdrag</h2>
            <p>
              Behöver du hjälp med din trädgård? Aurel Städ &amp; Allservice erbjuder professionell trädgårdsskötsel i Stockholm för privatpersoner. Vi hjälper dig att hålla din trädgård välskött, trivsam och i gott skick under hela säsongen.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Gräsklippning</li>
              <li>Ogräsrensning</li>
              <li>Beskärning av buskar och träd</li>
              <li>Lövkrattning och trädgårdsstädning</li>
              <li>Allmänt underhåll av trädgården</li>
            </ul>

            <h4>RUT-avdrag</h4>
            <p>
              Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden för trädgårdsskötsel.
            </p>
            <p>
              RUT-avdrag gäller för löpande underhåll av trädgården, till exempel gräsklippning, ogräsrensning och beskärning. Arbeten som innebär nyanläggning eller större förändringar av trädgården omfattas inte av RUT-avdrag.
            </p>
            <p>
              Vi hanterar hela RUT-avdraget direkt på fakturan så att det blir enkelt för dig.
            </p>

            <h4>Fördelar</h4>
            <ul>
              <li>En välskött och trivsam trädgård</li>
              <li>Mer tid över till annat</li>
              <li>Flexibla lösningar efter dina behov</li>
              <li>Pålitlig och noggrann service</li>
            </ul>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du får en offert baserad på arbetets omfattning</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du ha hjälp med trädgårdsskötsel? Kontakta oss idag för en kostnadsfri offert.</p>
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
        service="Trädgårdsskötsel"
      />

      <Footer />
    </>
  );
};

export default Gardening;
