import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const SnowRemoval = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Snöröjning" bgImage="/images/banners/snorojning.webp" bgPosition="center 25%" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Snöröjning i Stockholm – Plogning och halkbekämpning</h2>
            <p>
              När vintern kommer är det viktigt att hålla ytor säkra och framkomliga. Aurel Städ &amp; Allservice erbjuder professionell snöröjning och plogning i Stockholm för företag, bostadsrättsföreningar och privatpersoner.
            </p>
            <p>
              Vi ser till att gångvägar, parkeringar och uppfarter hålls fria från snö och is.
            </p>

            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Snöröjning av gångvägar och entréer</li>
              <li>Plogning av parkeringar och uppfarter</li>
              <li>Halkbekämpning med sand eller salt</li>
              <li>Röjning vid snöfall och enligt avtal</li>
              <li>Akuta insatser vid behov</li>
            </ul>

            <h4>Fördelar</h4>
            <ul>
              <li>Säkra och framkomliga ytor</li>
              <li>Minskad risk för olyckor</li>
              <li>Pålitlig service under hela vintersäsongen</li>
              <li>Flexibla lösningar efter behov</li>
            </ul>

            <h4>RUT-avdrag</h4>
            <p>
              Privatpersoner kan i vissa fall använda RUT-avdrag för snöröjning av tomt och uppfart i direkt anslutning till bostaden. RUT-avdrag gäller inte för snöröjning av gemensamma ytor som tillhör bostadsrättsföreningar eller företag.
            </p>
            <p>Vi hanterar RUT-avdraget direkt på fakturan när det är tillämpligt.</p>

            <h4>Flexibla upplägg</h4>
            <p>Vi erbjuder både enstaka uppdrag och löpande snöröjning enligt avtal, anpassat efter fastighetens behov och väderförhållanden.</p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert baserad på yta och behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du boka snöröjning eller teckna avtal inför vintern? Kontakta oss idag för offert och planering.</p>
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
        service="Snöröjning"
      />

      <Footer />
    </>
  );
};

export default SnowRemoval;
