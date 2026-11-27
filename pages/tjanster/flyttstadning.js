import React, { useRef, useState } from "react";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import QuoteModal from "../../components/Common/QuoteModal";
import { RutPrice, RutTag } from "../../components/Common/RutTag";
import Footer from "../../components/Layouts/Footer";
import BookingSummary from "../../components/Booking/BookingSummary";
import BookingContactForm from "../../components/Booking/BookingContactForm";
import BookingConfirmation from "../../components/Booking/BookingConfirmation";
import DateTimeField from "../../components/Booking/DateTimeField";
import FieldError, { invalidClass } from "../../components/Booking/FieldError";
import useBookingFlow from "../../lib/booking/useBookingFlow";
import useBookingDate from "../../lib/booking/useBookingDate";
import { bookingHint, isQuoteOnly, parseArea, QUOTE_ONLY_HINT } from "../../lib/booking/rules";
import Seo from "../../components/Common/Seo";
import { IncludedAccordion, NumberedTips } from "../../components/ServiceContent/ServiceContent";
import { flyttIncluded, flyttPrepare, flyttWalls } from "../../content/services/flyttstadning";
import {
  estimateHours,
  moveCleaningBasePrice,
  MOVE_CLEANING_EXTRAS,
  MOVE_CLEANING_QUOTE_ABOVE_AREA,
  MOVE_TIME_ESTIMATE,
  SOILING_SURCHARGE_MAX_PERCENT,
} from "../../lib/pricing";
import {
  describeArea,
  describeDate,
  formatArea,
  formatDateTime,
  formatHours,
  NO_PRICE,
  roundKronor,
} from "../../lib/booking/format";

const MoveCleaning = () => {
  const [size, setSize] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const date = useBookingDate();

  // Extra services checkboxes
  const [hasKylFrysDefrost, setHasKylFrysDefrost] = useState(false);
  const [hasPersienner, setHasPersienner] = useState(false);
  const [hasBalkonger, setHasBalkonger] = useState(false);
  const [hasBalkongerGlas, setHasBalkongerGlas] = useState(false);

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Derived on every render, so the summary and the payload always follow the
  // current inputs and never keep a price from values that were cleared.
  // New in the 2027 list: over 150 m² flyttstädning is quoted, not priced
  // online. The 2026 list went on at 42 kr/m² with no upper limit, so without
  // this the page would keep pricing sizes the client no longer prices.
  const area = parseArea(size, { max: MOVE_CLEANING_QUOTE_ABOVE_AREA });
  // Rounded to two decimals as before: side areas are billed per estimated hour.
  const cleaningTime =
    area.status === "ok" ? Number(estimateHours(area.value, MOVE_TIME_ESTIMATE).toFixed(2)) : null;
  const basePrice = area.status === "ok" ? roundKronor(moveCleaningBasePrice(area.value)) : null;

  const extras = [
    {
      selected: hasKylFrysDefrost,
      label: "Kyl/Frys med avfrostning",
      short: "Kyl/Frys",
      price: MOVE_CLEANING_EXTRAS.kylFrysDefrost,
    },
    {
      selected: hasPersienner,
      label: "Persienner (kan bokas som tillägg)",
      short: "Persienner",
      price: MOVE_CLEANING_EXTRAS.persienner,
    },
    {
      selected: hasBalkonger,
      label: "Städning av biytor såsom förråd, garage och balkonger",
      short: "Biytor",
      price: roundKronor((cleaningTime || 0) * MOVE_CLEANING_EXTRAS.biytor),
    },
    {
      selected: hasBalkongerGlas,
      label: "Fönsterputsning av inglasade balkonger",
      short: "Fönsterputsning balkong",
      price: MOVE_CLEANING_EXTRAS.inglasadBalkong,
    },
  ].filter((extra) => extra.selected);
  const extrasLabel = extras.map((extra) => extra.label).join(", ");

  const totalPrice =
    basePrice === null ? null : extras.reduce((sum, extra) => sum + extra.price, basePrice);

  const hint = bookingHint([
    { label: "storlek", status: area.status },
    { label: "datum", status: date.check.status },
  ]);
  const needsQuote = isQuoteOnly({ outOfRange: area.status === "quote", hint, price: totalPrice });

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Flyttstädning",
    area: String(area.value),
    hours: cleaningTime.toFixed(2),
    dateTime: date.dateTime,
    basePrice,
    extras: extrasLabel,
    totalPrice,
  });

  const clearCalculator = () => {
    setSize("");
    date.setDateTime("");
    setHasKylFrysDefrost(false);
    setHasPersienner(false);
    setHasBalkonger(false);
    setHasBalkongerGlas(false);
  };

  const handleBooked = (payload) => {
    flow.complete({
      service: payload.cleaningType,
      when: formatDateTime(payload.dateTime),
      email: payload.email,
    });
    clearCalculator();
  };

  const quoteDetails = {
    Storlek: formatArea(area.value),
    ...(extrasLabel && { Tillägg: extrasLabel }),
    ...(date.isValid && { "Önskat datum och tid": formatDateTime(date.dateTime) }),
  };

  return (
    <>
      <Seo route="/tjanster/flyttstadning" />

      <Navbar associates />
      <PageBanner pageTitle="Flyttstädning" bgImage="/images/banners/flyttstadning.webp" />

      {/* Descriptive Section */}
      <div className="container ptb-50 svc-page">
        <div className="row">
          <div className="col-lg-7">
            <h2>Flyttstädning i Stockholm – Noggrann städning inför besiktning</h2>
            <p>
              Ska du flytta och behöver en professionell flyttstädning i Stockholm? Aurel Städ &amp; Allservice erbjuder noggrann och komplett flyttstädning som uppfyller alla krav inför besiktning. Vi ser till att bostaden lämnas i perfekt skick, vilket minskar risken för anmärkningar och gör flytten enklare för dig.
            </p>
          </div>
          <div className="col-lg-5">
            <div className="brand-card">
              <h3>RUT-avdrag</h3>
              <p>Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden. Vi sköter hela ansökan direkt på fakturan.</p>
              <p><strong>OBS!</strong> Fönsterputs ingår. Gäller ej spröjsade fönster.</p>
            </div>
          </div>
        </div>

        <IncludedAccordion {...flyttIncluded} />

        <div className="svc-notices">
          <div className="brand-card-warning">
            <strong>OBS!</strong> {flyttWalls}
          </div>
          <div className="brand-card-warning">
            {/* Q104 and the 2027 list: a ceiling of 25 % for flyttstädning,
                approved by the customer before any extra work. */}
            <strong>Viktig information om pris:</strong> Priset baseras på att bostaden är i
            normalt skick. Vid kraftig nedsmutsning kan ett pristillägg på upp till{" "}
            {SOILING_SURCHARGE_MAX_PERCENT.movecleaning} procent tillkomma. Du informeras alltid på
            plats och ska godkänna pristillägget innan vi utför något extra arbete.
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            {/* The heading lives inside the card, like "Summering" in the summary. */}
            <form className="move-cleaning-form" onSubmit={(e) => e.preventDefault()}>
              <h3 id="berakna-pris">Beräkna pris</h3>
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
                <label>Tilläggstjänster</label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrysdefrost"
                    checked={hasKylFrysDefrost}
                    onChange={(e) => setHasKylFrysDefrost(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kylfrysdefrost">
                    {`Kyl/Frys med avfrostning - ${MOVE_CLEANING_EXTRAS.kylFrysDefrost} kr`} <RutTag />
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="persienner"
                    checked={hasPersienner}
                    onChange={(e) => setHasPersienner(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="persienner">
                    {`Persienner (kan bokas som tillägg) - ${MOVE_CLEANING_EXTRAS.persienner} kr`} <RutTag />
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="balkonger"
                    checked={hasBalkonger}
                    onChange={(e) => setHasBalkonger(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="balkonger">
                    {`Städning av biytor såsom förråd, garage och balkonger - ${MOVE_CLEANING_EXTRAS.biytor} kr/timmen`} <RutTag />
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="balkongerglas"
                    checked={hasBalkongerGlas}
                    onChange={(e) => setHasBalkongerGlas(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="balkongerglas">
                    {`Fönsterputsning av inglasade balkonger - ${MOVE_CLEANING_EXTRAS.inglasadBalkong} kr`} <RutTag />
                  </label>
                </div>
              </div>

              <DateTimeField
                date={date}
                inputRef={dateInputRef}
                conflict={flow.isConflict(date.dateTime)}
              />
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary
              privateCustomer
              mode={needsQuote ? "quote" : "book"}
              hint={needsQuote ? "" : hint}
              onBook={flow.openContact}
              onQuote={() => setShowQuote(true)}
              quoteNote={`Över ${MOVE_CLEANING_QUOTE_ABOVE_AREA} m² prissätter vi med en offert. Skicka en förfrågan så återkommer vi.`}
            >
              <li>
                <strong>Storlek:</strong> {describeArea(area)}
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {describeDate(date)}
              </li>
              <li>
                <strong>Beräknad tid:</strong> {cleaningTime === null ? NO_PRICE : formatHours(cleaningTime)}
              </li>
              <li>
                <strong>Baspris:</strong> {needsQuote ? "Offereras" : <RutPrice amount={basePrice} />}
              </li>
              <li>
                <strong>Tillägg:</strong> {extras.map((extra) => extra.short).join(", ") || "Inga"}
              </li>
              <li>
                <strong>Preliminärt totalpris:</strong>{" "}
                {needsQuote ? "Offereras" : <RutPrice amount={totalPrice} />}
              </li>
            </BookingSummary>
          </div>

          {flow.contactOpen && (
            <div className="col-lg-12">
              <BookingContactForm
                buildPayload={buildPayload}
                blockedHint={needsQuote ? QUOTE_ONLY_HINT : hint}
                focusSignal={flow.focusSignal}
                dateInputRef={dateInputRef}
                onConflict={flow.markConflict}
                onSuccess={handleBooked}
              />
            </div>
          )}

          {flow.confirmation && (
            <div className="col-lg-12">
              <BookingConfirmation {...flow.confirmation} onDismiss={flow.dismissConfirmation} />
            </div>
          )}
        </div>

        <NumberedTips {...flyttPrepare} />
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Flyttstädning"
        details={quoteDetails}
      />

      <Footer />
    </>
  );
};

export default MoveCleaning;
