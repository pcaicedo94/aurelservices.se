import React, { useRef, useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import BookingSummary from "../components/Booking/BookingSummary";
import BookingContactForm from "../components/Booking/BookingContactForm";
import BookingConfirmation from "../components/Booking/BookingConfirmation";
import DateTimeField from "../components/Booking/DateTimeField";
import FieldError, { invalidClass } from "../components/Booking/FieldError";
import useBookingFlow from "../lib/booking/useBookingFlow";
import useBookingDate from "../lib/booking/useBookingDate";
import {
  billableHours,
  bookingHint,
  MIN_BILLABLE_HOURS,
  parseArea,
  QUOTE_ONLY_HINT,
} from "../lib/booking/rules";
import {
  describeArea,
  describeDate,
  formatArea,
  formatDateTime,
  formatHours,
  formatPrice,
  NO_PRICE,
  NOT_SET,
  roundKronor,
} from "../lib/booking/format";

const FREQUENCY_LABELS = {
  onetime: "Enstaka hemstädning",
  1: "1 gång per månad",
  2: "2 gånger per månad",
  4: "4 gånger per månad",
};

// Calculate hourly rate based on frequency and weekday
const getHourlyRate = (frequency, weekday) => {
  // Special rates for monthly and one-time cleanings
  if (frequency === "1") return 245; // Once a month
  if (frequency === "onetime") return 270; // One-time cleaning

  // Day-based rates for regular cleanings
  if (weekday >= 1 && weekday <= 3) return 200; // Monday-Wednesday
  if (weekday >= 4 && weekday <= 5) return 220; // Thursday-Friday
  return null; // No weekend rate: weekends cannot be booked online
};

const HomeCleaning = () => {
  const [size, setSize] = useState("");
  const [frequency, setFrequency] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const date = useBookingDate();

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Derived on every render, so the summary and the payload always follow the
  // current inputs and never keep a price from values that were cleared.
  const area = parseArea(size);
  const needsQuote = area.status === "quote";
  const frequencyLabel = FREQUENCY_LABELS[frequency];
  const hourlyRate = frequencyLabel
    ? getHourlyRate(frequency, date.isValid ? date.check.parts.weekday : null)
    : null;
  const estimatedTime = area.status === "ok" ? 1.57 + 0.0167 * area.value : null;
  // TODO(cliente Q14): at least MIN_BILLABLE_HOURS are billed per cleaning.
  const cleaningTime = estimatedTime === null ? null : billableHours(estimatedTime);
  const sessionsPerMonth = frequency === "onetime" ? 1 : Number(frequency);
  const totalPrice =
    cleaningTime !== null && hourlyRate
      ? roundKronor(cleaningTime * hourlyRate * sessionsPerMonth)
      : null;

  const hint = bookingHint([
    { label: "storlek", status: area.status },
    { label: "frekvens", status: frequencyLabel ? "ok" : "empty" },
    { label: "datum", status: date.check.status },
  ]);

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Hemstädning",
    area: String(area.value),
    frequency: frequencyLabel,
    dateTime: date.dateTime,
    hourlyRate,
    totalPrice,
    estimatedHours: cleaningTime.toFixed(2),
  });

  const clearCalculator = () => {
    setSize("");
    setFrequency("");
    date.setDateTime("");
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
    ...(frequencyLabel && { Frekvens: frequencyLabel }),
    ...(date.isValid && { "Önskat datum och tid": formatDateTime(date.dateTime) }),
  };

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Hemstädning" bgImage="/images/banners/hemstadning.webp" />

      {/* Descriptive Section */}
      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-7">
            <h2>Hemstädning i Stockholm – Professionell och pålitlig städservice</h2>
            <p>
              Letar du efter en pålitlig städfirma för hemstädning i Stockholm? Aurel Städ &amp; Allservice erbjuder noggrann och flexibel hemstädning anpassad efter dina behov, oavsett om du behöver regelbunden städning eller hjälp vid enstaka tillfällen.
            </p>
          </div>
          <div className="col-lg-5">
            <div className="brand-card">
              <h4>RUT-avdrag</h4>
              <p>Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden. Vi sköter hela ansökan direkt på fakturan.</p>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: "30px" }}>
          <div className="col-lg-6">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Detta ingår i vår hemstädning</h4>
              <ul>
                <li>Dammsugning av golv och mattor</li>
                <li>Våttorkning av golv</li>
                <li>Rengöring av kök, inklusive bänkar, spis och diskho</li>
                <li>Rengöring av badrum och toalett</li>
                <li>Avtorkning av ytor och möbler</li>
                <li>Tömning av sopor</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Fördelar med vår hemstädning</h4>
              <ul>
                <li>Ett rent och hygieniskt hem</li>
                <li>Mer tid över till familj och fritid</li>
                <li>Professionell städning med hög kvalitet</li>
                <li>Trygg och pålitlig service varje gång</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <div className="brand-card-warning">
              <strong>OBS!</strong> Minsta debitering 2 timmar. Som kund ansvarar ni för att det ska finnas produkter och medel som Bolaget behöver för att utföra tjänsten. Om Kunden föredrar att Bolaget ska stå för produkter med mera kommer dessa debiteras och finnas specificerade på månadsfakturan.
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            <h3>Beräkna pris</h3>
            <form onSubmit={(e) => e.preventDefault()} className="home-cleaning-form">
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
                  <option value="onetime">Enstaka hemstädning (270 kr/h)</option>
                  <option value="1">1 gång/månad (245 kr/h)</option>
                  <option value="2">2 gånger/månad</option>
                  <option value="4">4 gånger/månad</option>
                </select>
              </div>
              <DateTimeField
                date={date}
                inputRef={dateInputRef}
                conflict={flow.isConflict(date.dateTime)}
              >
                {hourlyRate && (frequency === "2" || frequency === "4") && (
                  <small className="form-text text-muted">
                    Timtaxa för vald dag: {formatPrice(hourlyRate)}/h
                    {hourlyRate === 200 && " (Måndag-Onsdag)"}
                    {hourlyRate === 220 && " (Torsdag-Fredag)"}
                  </small>
                )}
              </DateTimeField>
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary
              mode={needsQuote ? "quote" : "book"}
              hint={needsQuote ? "" : hint}
              onBook={flow.openContact}
              onQuote={() => setShowQuote(true)}
              quoteNote="Så stora ytor prissätter vi med en offert. Skicka en förfrågan så återkommer vi."
            >
              <li>
                <strong>Storlek:</strong> {describeArea(area)}
              </li>
              <li>
                <strong>Frekvens:</strong> {frequencyLabel || NOT_SET}
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {describeDate(date)}
              </li>
              <li>
                <strong>Beräknad tid per städning:</strong>{" "}
                {cleaningTime === null ? NO_PRICE : formatHours(cleaningTime)}
                {estimatedTime !== null && estimatedTime < MIN_BILLABLE_HOURS && " (minsta debitering)"}
              </li>
              {hourlyRate && !needsQuote && (
                <li>
                  <strong>Timtaxa:</strong> {formatPrice(hourlyRate)}/h
                </li>
              )}
              <li>
                <strong>{frequency === "onetime" ? "Totalpris:" : "Totalpris för månaden:"}</strong>{" "}
                {needsQuote ? "Offereras" : formatPrice(totalPrice)}
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
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Hemstädning"
        details={quoteDetails}
      />

      <Footer />
    </>
  );
};

export default HomeCleaning;
