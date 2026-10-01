import React from "react";
import Link from "next/link";
import Banner from "./Banner.js";
import QuoteModal from "../Common/QuoteModal";

// The four private services that have a price calculator of their own. The
// primary CTA points at the hub page that lists them; these links are the
// shortcut for a visitor who already knows what they need.
const CALCULATORS = [
  { href: "/tjanster/hemstadning", label: "Hemstädning" },
  { href: "/tjanster/storstadning", label: "Storstädning" },
  { href: "/tjanster/flyttstadning", label: "Flyttstädning" },
  { href: "/tjanster/fonsterputs", label: "Fönsterputsning" },
];

const MainBanner = () => {
  const [showQuote, setShowQuote] = React.useState(false);

  return (
    <>
      {/* Split hero: the copy panel is first in the DOM and in the grid, so
          the H1 is the first thing on screen at every width — the left half
          on desktop, the top band on a phone. The slideshow follows and
          bleeds to the edge of its own half. */}
      <div className="main-banner-two">
        <div className="hero-copy">
          <h1>Städfirma i Stockholm – hemstädning, flyttstädning och storstädning</h1>
          <p className="hero-lead">
            Aurel Städ &amp; Allservice sköter städningen i ditt hem, på kontoret och i
            föreningen. Räkna ut priset själv på webben och boka en tid direkt.
          </p>
          <ul className="hero-trust">
            <li>18 år i branschen</li>
            <li>RUT-avdrag på fakturan</li>
            <li>Org.nr 556725-2340</li>
          </ul>
          <div className="hero-actions">
            <Link href="/tjanster" className="default-btn hero-btn-primary">
              Boka städning – se priset direkt
            </Link>
            <button
              type="button"
              className="hero-btn-secondary"
              onClick={() => setShowQuote(true)}
            >
              Begär offert
            </button>
          </div>
          <p className="hero-links">
            Räkna ut ditt pris:{" "}
            {CALCULATORS.map((service, index) => (
              <React.Fragment key={service.href}>
                {index > 0 && " · "}
                <Link href={service.href}>{service.label}</Link>
              </React.Fragment>
            ))}
          </p>
        </div>

        <Banner />
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Städning i Stockholm"
      />
    </>
  );
};

export default MainBanner;
