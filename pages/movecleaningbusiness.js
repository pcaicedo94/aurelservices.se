import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";

const MoveCleaningBusiness = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Flyttstädning för företag" bgImage="/images/Flyttstädning-kontor.png" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Flyttstädning för företag i Stockholm – Professionell städning inför överlämning</h2>
            <p>
              Ska ert företag lämna en lokal? Aurel Städ &amp; Allservice erbjuder professionell flyttstädning för företag i Stockholm som uppfyller alla krav vid överlämning och besiktning.
            </p>
            <p>
              Vi ser till att lokalen lämnas i perfekt skick, vilket minskar risken för anmärkningar och sparar tid för er verksamhet.
            </p>

            <h4>Vad ingår i vår flyttstädning</h4>
            <ul>
              <li>Rengöring av alla ytor från golv till tak</li>
              <li>Dammsugning och våttorkning av golv</li>
              <li>Rengöring av dörrar, karmar, lister och kontaktpunkter</li>
              <li>Fönsterputsning invändigt och utvändigt</li>
              <li>Rengöring av kök och personalutrymmen</li>
              <li>Rengöring av toaletter och hygienutrymmen</li>
              <li>Avtorkning av skåp, hyllor och fasta installationer</li>
            </ul>

            <h4>Fördelar för företag</h4>
            <ul>
              <li>Säkerställer godkänd besiktning</li>
              <li>Professionellt resultat enligt krav</li>
              <li>Effektiv och strukturerad process</li>
              <li>Minimal påverkan på er verksamhet</li>
            </ul>

            <h4>Tilläggstjänst</h4>
            <p>Vi kan även hjälpa till med själva flytten vid behov, som en kompletterande tjänst.</p>

            <h4>Så fungerar det</h4>
            <ol>
              <li>Kontakta oss med er förfrågan</li>
              <li>Vi bokar ett kostnadsfritt platsbesök</li>
              <li>Ni får en skräddarsydd offert baserad på lokalens behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill du boka flyttstädning för ert företag? Kontakta oss idag för en kostnadsfri offert och platsbesök.</p>
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
        service="Flyttstädning för företag"
        addressPlaceholder="Ange lokalens adress"
      />

      <Footer />
    </>
  );
};

export default MoveCleaningBusiness;
