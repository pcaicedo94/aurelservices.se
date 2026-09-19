import React, { useState, useEffect } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const StairCleaning = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Seo route="/staircleaning" />

      <Navbar />
      <PageBanner
        pageTitle="Trappstädning"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Trappstädning"
        breadcrumbUrl="/"
        bgImage="/images/banners/trappstadning.webp"
        bgPosition="center 25%"
      />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Trappstädning i Stockholm – Ren och välskött entré</h2>
            <p>
              Första intrycket börjar redan i entrén. Aurel Städ &amp; Allservice erbjuder professionell trappstädning i Stockholm för fastighetsägare, bostadsrättsföreningar och företag.
            </p>
            <p>
              Vi ser till att trapphus och gemensamma utrymmen alltid är rena, fräscha och välskötta.
            </p>

            <h3>Vad ingår i trappstädning</h3>
            <ul>
              <li>Sopning och våttorkning av trappor och golv</li>
              <li>Rengöring av entréer och hissar</li>
              <li>Avtorkning av räcken, dörrar och handtag</li>
              <li>Rengöring av lister, fönsterbrädor och andra ytor</li>
              <li>Tömning av papperskorgar vid behov</li>
            </ul>

            <h3>Flexibla upplägg</h3>
            <p>
              Vi erbjuder trappstädning enligt schema, till exempel en eller flera gånger per vecka, anpassat efter fastighetens behov.
            </p>

            <h3>Fördelar</h3>
            <ul>
              <li>Rent och välkomnande intryck</li>
              <li>Ökad trivsel för boende och besökare</li>
              <li>Regelbunden och pålitlig service</li>
              <li>Anpassade lösningar för varje fastighet</li>
            </ul>

            <h3>Så fungerar det</h3>
            <ol>
              <li>Kontakta oss med er förfrågan</li>
              <li>Vi bokar ett kostnadsfritt platsbesök</li>
              <li>Ni får en skräddarsydd offert baserad på fastighetens behov</li>
            </ol>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Kontakta oss</h3>
              <p>Vill ni boka trappstädning eller få en offert? Kontakta oss idag för ett kostnadsfritt platsbesök.</p>
              <button
                type="button"
                className="default-btn"
                onClick={() => setShowQuote(true)}
              >
                Begär offert
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Trappstädning"
        addressPlaceholder="Ange fastighetens adress"
      />

      <Footer />
    </>
  );
};

export default StairCleaning;
