import React, { useState } from "react";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import QuoteModal from "../../components/Common/QuoteModal";
import Footer from "../../components/Layouts/Footer";
import Link from "next/link";
import Seo from "../../components/Common/Seo";

// Client Q78: the building work itself is not done by Aurel's own staff. Aurel
// works with established construction and renovation companies and the partner
// carries out the job. The page used to read as if Aurel held the tools, which
// is not what the client confirmed, so the copy now says who does what: Aurel
// takes the order, coordinates the project and answers to the customer; the
// partner performs the work. ROT is unchanged — the client confirmed it still
// applies and Aurel still handles it on the invoice.
const Construction = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Seo route="/foretag/byggtjanster" />

      <Navbar />
      <PageBanner pageTitle="Byggtjänster" bgImage="/images/banners/byggtjanster.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Byggtjänster i Stockholm – För företag, BRF och privatpersoner</h2>
            <p>
              Behöver du hjälp med byggarbeten eller renovering? Aurel Städ &amp; Allservice samarbetar med etablerade företag inom bygg och renovering i Stockholm. Genom våra samarbetspartners kan vi erbjuda byggtjänster till företag, bostadsrättsföreningar och privatpersoner – du har kvar oss som kontakt och vi håller ihop projektet från förfrågan till färdigt arbete.
            </p>

            <h3>Vad vi kan erbjuda genom våra samarbetspartners</h3>
            <ul>
              <li>Renovering och mindre byggarbeten</li>
              <li>Reparationer och underhåll</li>
              <li>Montering och demontering</li>
              <li>Snickeriarbeten</li>
              <li>Måleriarbeten, inklusive målning av väggar, tak och snickerier</li>
              <li>Andra byggrelaterade arbeten efter behov</li>
            </ul>

            <h3>Vem gör vad</h3>
            <p>
              Själva bygg- och renoveringsarbetet utförs av våra samarbetspartners inom respektive område – företag som är etablerade i sin bransch och arbetar med det här varje dag. Vi tar emot förfrågan, samordnar arbetet och är den du har avtal med och vänder dig till under hela projektet. Det gör att du får en smidig helhetslösning med ett enda kontaktnummer, i stället för att själv leta upp och hålla ihop flera hantverkare.
            </p>

            <h3>ROT-avdrag</h3>
            <p>
              Privatpersoner kan i många fall använda ROT-avdrag och få upp till 30 procent avdrag på arbetskostnaden för bygg- och renoveringsarbeten. Vi hanterar hela ROT-avdraget direkt på fakturan så att det blir enkelt för dig.
            </p>

            <h3>Så fungerar det</h3>
            <ol>
              <li>Kontakta oss med din eller er förfrågan</li>
              <li>Vi tar in rätt samarbetspartner för arbetet och bokar vid behov ett kostnadsfritt platsbesök</li>
              <li>Du eller ni får en offert från oss, baserad på projektets omfattning</li>
            </ol>

            <p>
              Ska lokalen eller bostaden städas när bygget är klart är det en egen tjänst:{" "}
              <Link href="/foretag/byggstadning">byggstädning och slutstädning</Link>.
            </p>
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
