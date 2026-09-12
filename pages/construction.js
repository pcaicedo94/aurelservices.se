import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const Construction = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Byggtjänster" bgImage="/images/banners/byggtjanster.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Byggtjänster i Stockholm – För företag, BRF och privatpersoner</h2>
            <p>
              Behöver du hjälp med byggarbeten eller renovering? Aurel Städ &amp; Allservice erbjuder byggtjänster i Stockholm för företag, bostadsrättsföreningar och privatpersoner. Vi utför arbeten med fokus på kvalitet, noggrannhet och ett professionellt slutresultat.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Mindre byggarbeten och renoveringar</li>
              <li>Reparationer och underhåll</li>
              <li>Montering och demontering</li>
              <li>Snickeriarbeten</li>
              <li>Måleriarbeten, inklusive målning av väggar, tak och snickerier</li>
              <li>Anpassade lösningar efter behov</li>
            </ul>

            <h4>Fördelar</h4>
            <ul>
              <li>En pålitlig partner för bygg och service</li>
              <li>Noggrant utfört arbete med hög kvalitet</li>
              <li>Flexibla lösningar för olika typer av projekt</li>
              <li>Ett professionellt och hållbart resultat</li>
            </ul>

            <h4>ROT-avdrag</h4>
            <p>
              Privatpersoner kan i många fall använda ROT-avdrag och få upp till 30 procent avdrag på arbetskostnaden för bygg- och renoveringsarbeten. Vi hanterar hela ROT-avdraget direkt på fakturan så att det blir enkelt för dig.
            </p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert baserad på projektets omfattning</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Behöver du hjälp med byggtjänster i Stockholm? Kontakta oss idag för offert och rådgivning.</p>
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
        service="Byggtjänster"
      />

      <Footer />
    </>
  );
};

export default Construction;
