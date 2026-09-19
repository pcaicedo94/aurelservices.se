import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import BookingSummary from "../components/Booking/BookingSummary";
import FieldError, { invalidClass } from "../components/Booking/FieldError";
import { billableHours, bookingHint, MIN_BILLABLE_HOURS, parseArea } from "../lib/booking/rules";
import { estimateHours, OFFICE_FREQUENCIES, OFFICE_TIME_ESTIMATE } from "../lib/pricing";
import {
  describeArea,
  formatArea,
  formatHours,
  formatPrice,
  NO_PRICE,
  NOT_SET,
  roundKronor,
} from "../lib/booking/format";

const OfficeCleaning = () => {
  const [size, setSize] = useState("");
  const [frequency, setFrequency] = useState("");
  const [showQuote, setShowQuote] = useState(false);

  // Derived on every render, so the summary follows the inputs as they change
  // instead of waiting for a "Beräkna pris" click.
  const area = parseArea(size);
  const plan = OFFICE_FREQUENCIES[frequency];
  const needsQuote = area.status === "quote";
  const estimatedTime =
    area.status === "ok" ? Number(estimateHours(area.value, OFFICE_TIME_ESTIMATE).toFixed(2)) : null;
  // Q14 (client, confirmed): at least MIN_BILLABLE_HOURS are billed per cleaning.
  const cleaningTime = estimatedTime === null ? null : billableHours(estimatedTime);
  const predictedPrice =
    cleaningTime !== null && plan ? roundKronor(plan.hourlyRate * cleaningTime * Number(frequency)) : null;

  const hint = bookingHint([
    { label: "storlek", status: area.status },
    { label: "frekvens", status: plan ? "ok" : "empty" },
  ]);

  let details = null;
  if (needsQuote) {
    details = { Storlek: formatArea(area.value), ...(plan && { Frekvens: plan.label }) };
  } else if (plan && cleaningTime !== null) {
    details = {
      Storlek: formatArea(area.value),
      Frekvens: plan.label,
      "Beräknad tid per städning": formatHours(cleaningTime),
      "Uppskattat pris per månad": formatPrice(predictedPrice),
    };
  }

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Kontorsstädning" bgImage="/images/banners/kontorsstadning.webp" />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-7">
            <h2>Kontorsstädning i Stockholm – Professionell städservice för företag</h2>
            <p>
              Vill ni ha en ren, trivsam och professionell arbetsmiljö? Aurel Städ &amp; Allservice erbjuder kontorsstädning i Stockholm anpassad efter ert företags behov. Vi hjälper er att skapa en ren och välskött arbetsplats för både personal och kunder.
            </p>
          </div>
          <div className="col-lg-5 mt-4 mt-lg-0">
            <div className="info-card">
              <h3>Vad ingår i kontorsstädning</h3>
              <ul>
                <li>Dammsugning och våttorkning av golv</li>
                <li>Tömning av papperskorgar</li>
                <li>Rengöring av kök och personalutrymmen</li>
                <li>Rengöring av toaletter och hygienutrymmen</li>
                <li>Avtorkning av skrivbord och ytor</li>
                <li>Påfyllning av förbrukningsmaterial vid behov</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row" style={{ marginTop: "30px" }}>
          <div className="col-lg-6 mb-4 mb-lg-0">
            {/* Heading lives inside the card so the card fills the height of the
                summary beside it instead of leaving an empty band. */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="home-cleaning-form"
              style={{ marginTop: 0, height: "100%" }}
            >
              <h3>Beräkna pris</h3>
              <p>
                Pris för kontorsstädning varierar beroende på antalet städtillfällen per månad. Se ditt preliminära städpris och boka tjänsten.
              </p>
              <div className="form-group">
                <label htmlFor="size">Storlek i m²</label>
                <input
                  type="number"
                  id="size"
                  className={`form-control${area.status === "invalid" ? ` ${invalidClass}` : ""}`}
                  placeholder="Ange storlek"
                  min="1"
                  step="any"
                  inputMode="decimal"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  aria-invalid={area.status === "invalid" || undefined}
                  aria-describedby={area.message ? "size-error" : undefined}
                  required
                />
                <FieldError id="size-error">{area.message}</FieldError>
              </div>
              <div className="form-group">
                <label htmlFor="frequency">Frekvens</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="1">
                    {`${OFFICE_FREQUENCIES[1].label} (${OFFICE_FREQUENCIES[1].hourlyRate} kr/h, minst ${MIN_BILLABLE_HOURS} timmar)`}
                  </option>
                  <option value="2">{`${OFFICE_FREQUENCIES[2].label} (${OFFICE_FREQUENCIES[2].hourlyRate} kr/h)`}</option>
                  <option value="4">{`${OFFICE_FREQUENCIES[4].label} (${OFFICE_FREQUENCIES[4].hourlyRate} kr/h)`}</option>
                </select>
                <small className="form-text text-muted">
                  Minsta debitering är {MIN_BILLABLE_HOURS} timmar per städtillfälle.
                </small>
              </div>
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary
              style={{ height: "100%" }}
              mode={needsQuote ? "quote" : "book"}
              hint={needsQuote ? "" : hint}
              onBook={() => setShowQuote(true)}
              onQuote={() => setShowQuote(true)}
              quoteNote="Så stora lokaler prissätter vi med en offert. Skicka en förfrågan så återkommer vi."
              footer={
                <p className="mt-3" style={{ fontSize: "13px", color: "#666" }}>
                  * Priserna är exklusive moms och en uppskattning. Slutpris sätter vi efter ett
                  kostnadsfritt platsbesök.
                </p>
              }
            >
              <li>
                <strong>Storlek:</strong> {describeArea(area)}
              </li>
              <li>
                <strong>Frekvens:</strong> {plan ? plan.label : NOT_SET}
              </li>
              <li>
                <strong>Beräknad tid per städning:</strong>{" "}
                {cleaningTime === null ? NO_PRICE : formatHours(cleaningTime)}
                {estimatedTime !== null && estimatedTime < MIN_BILLABLE_HOURS && " (minsta debitering)"}
              </li>
              {plan && !needsQuote && (
                <li>
                  <strong>Timtaxa:</strong> {formatPrice(plan.hourlyRate)}/h
                </li>
              )}
              <li>
                <strong>Totalpris för månaden:</strong>{" "}
                {needsQuote ? "Offereras" : formatPrice(predictedPrice)}
              </li>
            </BookingSummary>
          </div>
        </div>
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Kontorsstädning"
        title={needsQuote ? "Begär offert" : "Boka tjänsten"}
        subject={needsQuote ? "Offertförfrågan – Kontorsstädning" : "Bokningsförfrågan – Kontorsstädning"}
        addressPlaceholder="Ange kontorets adress"
        details={details}
      />

      <Footer />
    </>
  );
};

export default OfficeCleaning;
