import React, { useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import BookingSummary from "../components/Booking/BookingSummary";
import DateTimeField from "../components/Booking/DateTimeField";
import FieldError, { invalidClass } from "../components/Booking/FieldError";
import useBookingDate from "../lib/booking/useBookingDate";
import { bookingHint, isQuoteOnly, parseCount } from "../lib/booking/rules";
import Seo from "../components/Common/Seo";
import {
  describeDate,
  formatDateTime,
  formatPrice,
  NO_PRICE,
  NOT_SET,
  roundKronor,
} from "../lib/booking/format";

// Above this many site huts the price is quoted ("Offereras").
const MAX_UNITS_ONLINE = 50;

const FREQUENCY_LABELS = {
  5: "5 gånger/vecka (Måndag till fredag)",
  3: "3 gånger/vecka (Måndag/onsdag/fredag)",
  2: "2 gånger/vecka (Tisdag/torsdag)",
  1: "1 gång/vecka",
};

const CONTACT_PREFERENCES = { call: "Bli uppringd", visit: "Få ett hembesök" };

// Pricing logic based on image: price per hut and cleaning
const getPricePerUnit = (numUnits, numFreq) => {
  // 1-10 units pricing
  if (numUnits >= 1 && numUnits <= 10) {
    if (numFreq === 5) return 100;
    if (numFreq === 3) return 110;
    if (numFreq === 2) return 120;
    if (numFreq === 1) return 130;
  }
  // 11-20 units pricing
  if (numUnits >= 11 && numUnits <= 20) {
    if (numFreq === 5) return 65;
    if (numFreq === 3) return 75;
    if (numFreq === 2) return 95;
    if (numFreq === 1) return 100;
  }
  // 21-30 units pricing
  if (numUnits >= 21 && numUnits <= 30) {
    if (numFreq === 5) return 60;
    if (numFreq === 3) return 70;
    if (numFreq === 2) return 90;
    if (numFreq === 1) return 95;
  }
  // 31-50 units pricing
  if (numUnits >= 31 && numUnits <= 50) {
    if (numFreq === 5) return 55;
    if (numFreq === 3) return 65;
    if (numFreq === 2) return 80;
    if (numFreq === 1) return 85;
  }
  return null;
};

const ContainerCleaning = () => {
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [frequency, setFrequency] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const date = useBookingDate();


  // Derived on every render, so the summary and the payload always follow the
  // current inputs and never keep a price from values that were cleared.
  const units = parseCount(numberOfUnits, { min: 1 });
  const frequencyLabel = FREQUENCY_LABELS[frequency];
  const pricePerUnit =
    units.status === "ok" && frequencyLabel ? getPricePerUnit(units.value, Number(frequency)) : null;
  // Monthly price (4 weeks)
  const totalPrice =
    pricePerUnit === null ? null : roundKronor(pricePerUnit * units.value * Number(frequency) * 4);

  // Q29 (client, confirmed): every business service is negotiated, so the page
  // only estimates a price and asks for a quote. Date and contact method are
  // optional extras for that request, not requirements.
  const hint = bookingHint([
    { label: "antal bodar", status: units.status },
    { label: "frekvens", status: frequencyLabel ? "ok" : "empty" },
  ]);
  const needsQuote = isQuoteOnly({
    outOfRange: units.status === "ok" && units.value > MAX_UNITS_ONLINE,
    hint,
    price: totalPrice,
  });

  const quoteDetails = {
    "Antal bodar": String(units.value),
    ...(frequencyLabel && { Städfrekvens: frequencyLabel }),
    ...(date.isValid && { "Önskat datum och tid": formatDateTime(date.dateTime) }),
    ...(CONTACT_PREFERENCES[contactPreference] && {
      Kontaktmetod: CONTACT_PREFERENCES[contactPreference],
    }),
  };

  let unitsSummary = units.value;
  if (units.status === "empty") unitsSummary = NOT_SET;
  else if (units.status === "invalid") unitsSummary = "Ogiltigt antal";

  let monthlySummary = NO_PRICE;
  if (needsQuote) monthlySummary = "Offereras";
  else if (totalPrice !== null) monthlySummary = `${formatPrice(totalPrice)} (exkl. moms)`;

  return (
    <>
      <Seo route="/containercleaning" />

      <Navbar />

      <PageBanner
        pageTitle="Bodstädning"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Bodstädning och etableringsstädning"
        breadcrumbUrl="/"
        bgImage="/images/Bodstädning.png"
      />

      <div className="container ptb-50">
        <div className="row">
          {/* Form Section */}
          <div className="col-lg-6">
            <h2>Byggstädning i Stockholm – Etableringsstädning, bodstädning och slutstädning vid renovering</h2>
            <p>
              Behöver ni professionell städning i samband med byggprojekt eller renovering? Aurel Städ &amp; Allservice erbjuder byggstädning i Stockholm, anpassad för entreprenörer, byggföretag och fastighetsägare. Vi ser till att arbetsplatsen hålls ren, säker och redo för nästa steg i projektet.
            </p>
            <h4>Vad vi erbjuder</h4>
            <ul>
              <li>Städning av bodar, baracker och personalutrymmen</li>
              <li>Löpande städning under byggprojekt</li>
              <li>Slutstädning inför överlämning</li>
              <li>Städning efter renoveringar</li>
              <li>Borttagning av byggdamm och smuts</li>
              <li>Dammsugning och våttorkning av golv och ytor</li>
              <li>Rengöring av dörrar, karmar och fasta installationer</li>
              <li>Rengöring av kök och hygienutrymmen</li>
              <li>Avfallshantering vid behov</li>
            </ul>
            <p>
              Vi erbjuder både löpande byggstädning under projektets gång samt slutstädning inför färdigställande. Priserna är exklusive moms och baserade på antal bodar och önskad städfrekvens.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="container-cleaning-form">
              <div className="form-group">
                <label htmlFor="numberOfUnits">Antal bodar</label>
                <input
                  type="number"
                  id="numberOfUnits"
                  className={`form-control${units.status === "invalid" ? ` ${invalidClass}` : ""}`}
                  placeholder="Ange antal bodar"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={numberOfUnits}
                  onChange={(e) => setNumberOfUnits(e.target.value)}
                  aria-invalid={units.status === "invalid" || undefined}
                  aria-describedby={units.status === "invalid" ? "numberOfUnits-error" : undefined}
                  required
                />
                <FieldError id="numberOfUnits-error">
                  {units.status === "invalid" && "Ange antal bodar som ett heltal, minst 1."}
                </FieldError>
                <small className="form-text text-muted">
                  Ange mellan 1-50 bodar för automatisk prisberäkning. För fler bodar lämnar vi offert.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Städfrekvens per vecka</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="5">5 gånger/vecka (Måndag till fredag)</option>
                  <option value="3">3 gånger/vecka (Måndag/onsdag/fredag)</option>
                  <option value="2">2 gånger/vecka (Tisdag/torsdag)</option>
                  <option value="1">1 gång/vecka</option>
                </select>
              </div>

              <DateTimeField date={date} label="Önskat startdatum och tid (frivilligt)" />

              <div className="form-group">
                <label htmlFor="contactPreference">Kontaktmetod</label>
                <select
                  id="contactPreference"
                  className="form-control"
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value)}
                  required
                >
                  <option value="">Välj kontaktmetod</option>
                  <option value="call">Bli uppringd</option>
                  <option value="visit">Få ett hembesök</option>
                </select>
              </div>
            </form>

            {pricePerUnit !== null && (
              <div className="alert alert-info mt-3">
                <strong>Pris per bod:</strong> {formatPrice(pricePerUnit)}/bod (exkl. moms)
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary
              mode="quote"
              onQuote={() => setShowQuote(true)}
              quoteNote="Priset är en uppskattning. Skicka en förfrågan så återkommer vi med en offert."
              footer={
                <p className="mt-3" style={{ fontSize: "13px", color: "#666" }}>
                  * Pris per bod och städtillfälle, exklusive moms.<br />
                  * Månadspriset är beräknat på 4 veckor och är en uppskattning.
                </p>
              }
            >
              <li>
                <strong>Antal bodar:</strong> {unitsSummary}
              </li>
              <li>
                <strong>Städfrekvens:</strong> {frequencyLabel || NOT_SET}
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {describeDate(date)}
              </li>
              <li>
                <strong>Kontaktmetod:</strong> {CONTACT_PREFERENCES[contactPreference] || NOT_SET}
              </li>
              {pricePerUnit !== null && (
                <li>
                  <strong>Pris per bod:</strong> {formatPrice(pricePerUnit)}
                </li>
              )}
              <li>
                <strong>Uppskattat månadspris:</strong> {monthlySummary}
              </li>
            </BookingSummary>
          </div>

        </div>
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Bodstädning"
        addressPlaceholder="Ange adressen för bodarna"
        details={quoteDetails}
      />

      <Footer />
    </>
  );
};

export default ContainerCleaning;
