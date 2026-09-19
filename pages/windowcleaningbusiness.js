import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const WindowCleaningBusiness = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Seo route="/windowcleaningbusiness" />

      <Navbar />
      <PageBanner pageTitle="Fönsterputsning för företag" bgImage="/images/Fönsterputs_kontor.png" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Fönsterputsning för företag i Stockholm – Rent och professionellt intryck</h2>
            <p>
              Rena fönster är en viktig del av ett professionellt intryck. Aurel Städ &amp; Allservice erbjuder fönsterputsning för företag i Stockholm, anpassad efter era lokaler och verksamhetens behov.
            </p>
            <p>
              Vi ser till att era fönster alltid håller hög standard och bidrar till en ljus och trivsam arbetsmiljö.
            </p>

            <h4>Vad ingår i vår fönsterputsning</h4>
            <ul>
              <li>Putsning av fönster invändigt och utvändigt</li>
              <li>Rengöring av glasytor för ett klart och fläckfritt resultat</li>
              <li>Avtorkning av karmar och kanter</li>
            </ul>

            <h4>Flexibla upplägg</h4>
            <p>
              Vi erbjuder både enstaka uppdrag och regelbunden fönsterputsning enligt schema, anpassat efter era behov.
            </p>

            <h4>Fördelar för företag</h4>
            <ul>
              <li>Ett professionellt och välskött intryck</li>
              <li>Ökat ljusinsläpp i lokalerna</li>
              <li>Flexibla tider för minimal störning</li>
              <li>Pålitlig och erfaren personal</li>
            </ul>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med er förfrågan</li>
              <li>Vi bokar ett kostnadsfritt platsbesök</li>
              <li>Ni får en skräddarsydd offert baserad på omfattning och behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill ni boka fönsterputsning för ert företag? Kontakta oss idag för ett kostnadsfritt platsbesök och offert.</p>
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
        service="Fönsterputsning för företag"
        addressPlaceholder="Ange lokalens adress"
      />

      <Footer />
    </>
  );
};

export default WindowCleaningBusiness;
