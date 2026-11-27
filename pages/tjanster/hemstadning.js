import React, { useRef, useState } from "react";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import QuoteModal from "../../components/Common/QuoteModal";
import { RutPrice, RutTag, RUT_LABEL } from "../../components/Common/RutTag";
import Footer from "../../components/Layouts/Footer";
import BookingSummary from "../../components/Booking/BookingSummary";
import BookingContactForm from "../../components/Booking/BookingContactForm";
import BookingConfirmation from "../../components/Booking/BookingConfirmation";
import DateTimeField from "../../components/Booking/DateTimeField";
import FieldError, { invalidClass } from "../../components/Booking/FieldError";
import useBookingFlow from "../../lib/booking/useBookingFlow";
import useBookingDate from "../../lib/booking/useBookingDate";
import Seo from "../../components/Common/Seo";
import { HowItWorks } from "../../components/ServiceContent/ServiceContent";
import { hemSteps, hemTrial, hemTravel, HOUSING_TYPES } from "../../content/services/hemstadning";
import {
  billableHours,
  bookingHint,
  isQuoteOnly,
  MIN_BILLABLE_HOURS,
  parseArea,
  QUOTE_ONLY_HINT,
} from "../../lib/booking/rules";
import {
  estimateHours,
  HOME_MONTHLY_RATE,
  HOME_ONETIME_RATES,
  HOME_TIME_ESTIMATE,
  HOME_WEEKDAY_RATES,
  homeCleaningHourlyRate,
} from "../../lib/pricing";
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
} from "../../lib/booking/format";

// Textosweb (2026-11-26): everything recurring is "löpande hemstädning", and
// it starts with a provstädning billed at the one-off rate.
const FREQUENCY_LABELS = {
  onetime: "Enstaka hemstädning",
  1: "Löpande hemstädning, 1 gång per månad",
  2: "Löpande hemstädning, 2 gånger per månad (varannan vecka)",
  4: "Löpande hemstädning, 4 gånger per månad (varje vecka)",
};

const INTERESTS = {
  lopande: "Löpande hemstädning med inledande provstädning",
  enstaka: "Endast enstaka städning",
};

const HomeCleaning = () => {
  const [size, setSize] = useState("");
  const [frequency, setFrequency] = useState("");
  const [interest, setInterest] = useState("");
  const [housingType, setHousingType] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const date = useBookingDate();

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Derived on every render, so the summary and the payload always follow the
  // current inputs and never keep a price from values that were cleared.
  const area = parseArea(size);
  const frequencyLabel = FREQUENCY_LABELS[frequency];
  const hourlyRate = frequencyLabel
    ? homeCleaningHourlyRate(frequency, date.isValid ? date.check.parts.weekday : null)
    : null;
  const estimatedTime = area.status === "ok" ? estimateHours(area.value, HOME_TIME_ESTIMATE) : null;
  // Q14 (client, confirmed): at least MIN_BILLABLE_HOURS are billed per cleaning.
  const cleaningTime = estimatedTime === null ? null : billableHours(estimatedTime);
  const sessionsPerMonth = frequency === "onetime" ? 1 : Number(frequency);
  const totalPrice =
    cleaningTime !== null && hourlyRate
      ? roundKronor(cleaningTime * hourlyRate * sessionsPerMonth)
      : null;
  // The provstädning that opens a löpande plan is billed as a one-off clean
  // on the chosen day, so it is priced at that day's one-off rate.
  const isRecurring = Boolean(frequencyLabel) && frequency !== "onetime";
  const trialRate =
    isRecurring && date.isValid ? homeCleaningHourlyRate("onetime", date.check.parts.weekday) : null;
  const trialPrice =
    isRecurring && cleaningTime !== null && trialRate ? roundKronor(cleaningTime * trialRate) : null;
  const isHouse = housingType === "Villa" || housingType === "Radhus";

  const chooseInterest = (value) => {
    setInterest(value);
    if (value === "enstaka") setFrequency("onetime");
    else if (frequency === "onetime") setFrequency("");
  };

  const hint = bookingHint([
    { label: "bostadstyp", status: housingType ? "ok" : "empty" },
    { label: "storlek", status: area.status },
    { label: "frekvens", status: frequencyLabel ? "ok" : "empty" },
    { label: "datum", status: date.check.status },
  ]);
  const needsQuote = isQuoteOnly({ outOfRange: area.status === "quote", hint, price: totalPrice });

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Hemstädning",
    interest: INTERESTS[interest],
    housingType,
    area: String(area.value),
    frequency: frequencyLabel,
    ...(trialPrice !== null && { trialPrice }),
    dateTime: date.dateTime,
    hourlyRate,
    totalPrice,
    estimatedHours: cleaningTime.toFixed(2),
  });

  const clearCalculator = () => {
    setSize("");
    setFrequency("");
    setInterest("");
    setHousingType("");
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
    ...(housingType && { Bostadstyp: housingType }),
    Storlek: formatArea(area.value),
    ...(frequencyLabel && { Frekvens: frequencyLabel }),
    ...(date.isValid && { "Önskat datum och tid": formatDateTime(date.dateTime) }),
  };

  return (
    <>
      <Seo route="/tjanster/hemstadning" />

      <Navbar associates />
      <PageBanner pageTitle="Hemstädning" bgImage="/images/banners/hemstadning.webp" />

      {/* Descriptive Section */}
      <div className="container ptb-50 svc-page">
        <div className="row">
          <div className="col-lg-7">
            <h2>Hemstädning i Stockholm – Professionell och pålitlig städservice</h2>
            <p>
              Letar du efter en pålitlig städfirma för hemstädning i Stockholm? Aurel Städ &amp; Allservice erbjuder noggrann och flexibel hemstädning anpassad efter dina behov, oavsett om du behöver regelbunden städning eller hjälp vid enstaka tillfällen.
            </p>
          </div>
          <div className="col-lg-5">
            <div className="brand-card">
              <h3>RUT-avdrag</h3>
              <p>Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden. Vi sköter hela ansökan direkt på fakturan.</p>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: "30px" }}>
          <div className="col-lg-6">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h3>Detta ingår i vår hemstädning</h3>
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
              <h3>Fördelar med vår hemstädning</h3>
              <ul>
                <li>Ett rent och hygieniskt hem</li>
                <li>Mer tid över till familj och fritid</li>
                <li>Professionell städning med hög kvalitet</li>
                <li>Trygg och pålitlig service varje gång</li>
              </ul>
            </div>
          </div>
        </div>

        <HowItWorks {...hemSteps} />

        <section className="glass-panel svc-trial">
          <h2 className="svc-block-title">{hemTrial.title}</h2>
          {hemTrial.paras.map((text) => (
            <p key={text.slice(0, 30)}>{text}</p>
          ))}
        </section>

        <div className="row svc-notices-row">
          <div className="col-lg-12 svc-notices">
            <div className="brand-card-warning">
              <strong>{hemTravel.title}</strong> {hemTravel.text}
            </div>
            <div className="brand-card-warning">
              <strong>OBS!</strong> Minsta debitering 2 timmar. Som kund ansvarar ni för att det ska finnas produkter och medel som Bolaget behöver för att utföra tjänsten. Om Kunden föredrar att Bolaget ska stå för produkter med mera kommer dessa debiteras och finnas specificerade på månadsfakturan.
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            {/* The heading lives inside the card, like "Summering" in the summary. */}
            <form onSubmit={(e) => e.preventDefault()} className="home-cleaning-form">
              <h3 id="berakna-pris">Beräkna pris</h3>
              <p className="form-text text-muted">Bokningsförfrågan – ej bindande</p>
              <fieldset className="form-group">
                <legend className="col-form-label pt-0">Vad är du intresserad av?</legend>
                {Object.entries(INTERESTS).map(([value, label]) => (
                  <div className="form-check" key={value}>
                    <input
                      type="radio"
                      className="form-check-input"
                      id={`interest-${value}`}
                      name="interest"
                      value={value}
                      checked={interest === value}
                      onChange={() => chooseInterest(value)}
                    />
                    <label className="form-check-label" htmlFor={`interest-${value}`}>
                      {label}
                    </label>
                  </div>
                ))}
                {interest === "lopande" && (
                  <small className="form-text text-muted">
                    <strong>Så fungerar provstädningen:</strong> Provstädningen debiteras först som
                    en enstaka städning. Tecknar du sedan avtal om löpande hemstädning justerar vi
                    priset enligt överenskommelsen.
                  </small>
                )}
              </fieldset>
              <div className="form-group">
                <label htmlFor="housingType">Bostadstyp</label>
                <select
                  id="housingType"
                  className="form-control"
                  value={housingType}
                  onChange={(e) => setHousingType(e.target.value)}
                  required
                >
                  <option value="">Välj bostadstyp</option>
                  {HOUSING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {isHouse && interest !== "enstaka" && (
                  <small className="form-text text-muted">
                    För villa och radhus bokar vi gärna ett kostnadsfritt hembesök innan
                    provstädningen.
                  </small>
                )}
              </div>
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
                  onChange={(e) => {
                    setFrequency(e.target.value);
                    setInterest(e.target.value === "onetime" ? "enstaka" : "lopande");
                  }}
                  required
                >
                  <option value="">Välj frekvens</option>
                  {/* "från", because a one-off clean costs more on a Saturday
                      (HOME_ONETIME_RATES.saturday) and the day is not known
                      until the date is picked. The monthly plan is one rate
                      for every bookable day, so it names its figure. */}
                  {interest !== "lopande" && (
                    <option value="onetime">{`Enstaka hemstädning (från ${HOME_ONETIME_RATES.weekday} kr/h ${RUT_LABEL})`}</option>
                  )}
                  {interest !== "enstaka" && (
                    <>
                      <option value="1">{`Löpande, 1 gång/månad (${HOME_MONTHLY_RATE} kr/h ${RUT_LABEL})`}</option>
                      <option value="2">Löpande, 2 gånger/månad (varannan vecka)</option>
                      <option value="4">Löpande, 4 gånger/månad (varje vecka)</option>
                    </>
                  )}
                </select>
              </div>
              <DateTimeField
                date={date}
                inputRef={dateInputRef}
                conflict={flow.isConflict(date.dateTime)}
              >
                {/* Every plan but the monthly one is priced by the day, so
                    the chosen day's rate is named. Saturday is included since
                    the 2027 list, at a higher rate than any weekday. */}
                {hourlyRate && frequency !== "1" && (
                  <small className="form-text text-muted">
                    Timtaxa för vald dag: {formatPrice(hourlyRate)}/h
                    {frequency === "onetime"
                      ? hourlyRate === HOME_ONETIME_RATES.saturday
                        ? " (Lördag)"
                        : " (Måndag-Fredag)"
                      : [
                          [HOME_WEEKDAY_RATES.mondayToWednesday, " (Måndag-Onsdag)"],
                          [HOME_WEEKDAY_RATES.thursdayToFriday, " (Torsdag-Fredag)"],
                          [HOME_WEEKDAY_RATES.saturday, " (Lördag)"],
                        ].find(([rate]) => rate === hourlyRate)?.[1]}{" "}
                    <RutTag />
                  </small>
                )}
              </DateTimeField>
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
              quoteNote="Så stora ytor prissätter vi med en offert. Skicka en förfrågan så återkommer vi."
            >
              <li>
                <strong>Bostadstyp:</strong> {housingType || NOT_SET}
              </li>
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
                  <strong>Timtaxa:</strong> <RutPrice amount={hourlyRate} suffix="/h" />
                </li>
              )}
              {isRecurring && !needsQuote && (
                <li>
                  <strong>Provstädning (enstaka pris):</strong> <RutPrice amount={trialPrice} />
                </li>
              )}
              <li>
                <strong>{frequency === "onetime" ? "Preliminärt pris:" : "Preliminärt pris per månad:"}</strong>{" "}
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
