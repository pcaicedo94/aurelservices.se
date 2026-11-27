import React, { useState } from "react";
import Navbar from "../Layouts/Navbar";
import PageBanner from "../Common/PageBanner";
import QuoteModal from "../Common/QuoteModal";
import Footer from "../Layouts/Footer";
import Seo from "../Common/Seo";
import { QUOTE_FIELDS } from "../../config/quoteFields";
import {
  ServiceIntro,
  ServiceSections,
  IncludedAccordion,
  GoodToKnow,
  HowItWorks,
  QuoteCta,
} from "./ServiceContent";

// A service sold by quote only: intro beside a quote card, then the client's
// sections, the "Vad ingår" groups, "Bra att veta", the four steps and a
// closing call to action. Every block is optional except the intro, so the
// copy decides the page.
const QuoteServicePage = ({
  route,
  pageTitle,
  banner,
  bannerPosition,
  service,
  bannerProps,
  quoteProps,
  content,
  children,
}) => {
  const [showQuote, setShowQuote] = useState(false);
  const openQuote = () => setShowQuote(true);
  const { intro, aside, sections, included, includedFirst, goodToKnow, steps, cta } = content;

  return (
    <>
      <Seo route={route} />
      <Navbar />
      <PageBanner pageTitle={pageTitle} bgImage={banner} bgPosition={bannerPosition} {...bannerProps} />

      <div className="container ptb-50 svc-page">
        <div className="row">
          <div className="col-lg-8">
            <ServiceIntro {...intro} />
          </div>
          <div className="col-lg-4">
            <div className="summary-frame svc-aside">
              <h3>{aside?.title || "Begär offert"}</h3>
              <p>{aside?.text || "Kontakta oss för en kostnadsfri och förutsättningslös offert."}</p>
              <button type="button" className="default-btn" onClick={openQuote}>
                {aside?.button || "Begär offert"}
              </button>
            </div>
          </div>
        </div>

        {/* Pages whose copy is mostly "Vad ingår" show it first. */}
        {includedFirst && included && <IncludedAccordion {...included} />}
        {sections && <ServiceSections {...sections} />}
        {!includedFirst && included && <IncludedAccordion {...included} />}
        {children}
        {goodToKnow && <GoodToKnow {...goodToKnow} />}
        {steps && <HowItWorks steps={steps} />}
        {cta && <QuoteCta {...cta} onClick={openQuote} />}
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service={service}
        fields={QUOTE_FIELDS[route]}
        {...quoteProps}
      />

      <Footer />
    </>
  );
};

export default QuoteServicePage;
