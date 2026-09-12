import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import BookingSummary from "../components/Booking/BookingSummary";
import BookingContactForm from "../components/Booking/BookingContactForm";
import BookingConfirmation from "../components/Booking/BookingConfirmation";
import FieldError from "../components/Booking/FieldError";
import useBookingFlow from "../lib/booking/useBookingFlow";
import { bookingHint } from "../lib/booking/rules";

const HomeCleaning = () => {
  // States from original HomeCleaning
  const [size, setSize] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(0);
  const [cleaningTime, setCleaningTime] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Calendar constraints (preserved)
  useEffect(() => {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(7, 0, 0, 0);

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    setMinDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  // Time validation (preserved)
  const handleDateTimeChange = (e) => {
    const selectedDateTime = e.target.value;
    if (selectedDateTime) {
      const selectedHour = new Date(selectedDateTime).getHours();
      if (selectedHour < 7 || selectedHour >= 17) {
        alert("Vänligen välj en tid mellan 07:00 och 17:00.");
        setDateTime("");
        return;
      }
    }
    setDateTime(selectedDateTime);
    // Recalculate when date changes
    updateCalculations(size, frequency, selectedDateTime);
  };

  // Calculate hourly rate based on day and frequency
  const getHourlyRate = (selectedDateTime, selectedFrequency) => {
    // Special rates for monthly and one-time cleanings
    if (selectedFrequency === "1") return 245; // Once a month
    if (selectedFrequency === "onetime") return 270; // One-time cleaning

    // Day-based rates for regular cleanings
    if (selectedDateTime) {
      const dayOfWeek = new Date(selectedDateTime).getDay();
      // Monday (1), Tuesday (2), Wednesday (3) = 200 kr
      if (dayOfWeek >= 1 && dayOfWeek <= 3) return 200;
      // Thursday (4), Friday (5) = 220 kr
      if (dayOfWeek >= 4 && dayOfWeek <= 5) return 220;
    }
    return 0;
  };

  // Combined calculation logic
  const updateCalculations = (currentSize, currentFrequency, currentDateTime) => {
    if (currentSize && currentFrequency && currentDateTime) {
      const area = parseFloat(currentSize);
      const rate = getHourlyRate(currentDateTime, currentFrequency);
      const time = 1.57 + 0.0167 * area;
      
      setHourlyRate(rate);
      setCleaningTime(time.toFixed(2));

      // Calculate monthly price
      let monthlyPrice;
      if (currentFrequency === "onetime") {
        monthlyPrice = time * rate; // One-time only
      } else {
        const sessionsPerMonth = parseInt(currentFrequency, 10);
        monthlyPrice = time * rate * sessionsPerMonth;
      }
      
      setPredictedPrice(monthlyPrice.toFixed(2));
    }
  };

  const handleSizeChange = (e) => {
    setSize(e.target.value);
    updateCalculations(e.target.value, frequency, dateTime);
  };

  const handleFrequencyChange = (e) => {
    setFrequency(e.target.value);
    updateCalculations(size, e.target.value, dateTime);
  };

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Hemstädning",
    area: size,
    frequency: frequency === "onetime" ? "Enstaka hemstädning" : `${frequency} gång/gånger per månad`,
    dateTime,
    hourlyRate,
    totalPrice: predictedPrice,
    estimatedHours: cleaningTime,
  });

  const clearCalculator = () => {
    setSize("");
    setFrequency("");
    setDateTime("");
    setPredictedPrice(0);
    setCleaningTime(0);
    setHourlyRate(0);
  };

  const handleBooked = (payload) => {
    flow.complete({ service: payload.cleaningType, when: payload.dateTime, email: payload.email });
    clearCalculator();
  };

  const hint = bookingHint([
    { label: "storlek", status: size ? "ok" : "empty" },
    { label: "frekvens", status: frequency ? "ok" : "empty" },
    { label: "datum", status: dateTime ? "ok" : "empty" },
  ]);

  // Get frequency label for display
  const getFrequencyLabel = () => {
    if (!frequency) return "Ej angiven";
    if (frequency === "onetime") return "Enstaka hemstädning";
    return `${frequency} gång${frequency !== "1" ? "er" : ""} per månad`;
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
                  className="form-control"
                  placeholder="Ange storlek"
                  value={size}
                  onChange={handleSizeChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="frequency">Frekvens</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={handleFrequencyChange}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="onetime">Enstaka hemstädning (270 kr/h)</option>
                  <option value="1">1 gång/månad (245 kr/h)</option>
                  <option value="2">2 gånger/månad</option>
                  <option value="4">4 gånger/månad</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="dateTime">Önskat datum och tid (Mellan 07:00-17:00)</label>
                <input
                  ref={dateInputRef}
                  type="datetime-local"
                  id="dateTime"
                  className="form-control"
                  value={dateTime}
                  onChange={handleDateTimeChange}
                  min={minDateTime}
                  step="1800"
                  required
                />
                {flow.conflictDateTime !== "" && flow.conflictDateTime === dateTime && (
                  <FieldError id="dateTime-error">
                    Tiden är tyvärr redan bokad. Välj en annan dag eller tid.
                  </FieldError>
                )}
                {dateTime && frequency !== "1" && frequency !== "onetime" && (
                  <small className="form-text text-muted">
                    Timtaxa för vald dag: {hourlyRate} kr/h
                    {hourlyRate === 200 && " (Måndag-Onsdag)"}
                    {hourlyRate === 220 && " (Torsdag-Fredag)"}
                  </small>
                )}
              </div>
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary hint={hint} onBook={flow.openContact}>
              <li>
                <strong>Storlek:</strong> {size || "Ej angiven"} m²
              </li>
              <li>
                <strong>Frekvens:</strong> {getFrequencyLabel()}
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}
              </li>
              <li>
                <strong>Beräknad tid per städning:</strong> {cleaningTime || "0"} timmar
              </li>
              {hourlyRate > 0 && (
                <li>
                  <strong>Timtaxa:</strong> {hourlyRate} kr/h
                </li>
              )}
              <li>
                <strong>{frequency === "onetime" ? "Totalpris:" : "Totalpris för månaden:"}</strong> {predictedPrice || "0"} kr
              </li>
            </BookingSummary>
          </div>

          {flow.contactOpen && (
            <div className="col-lg-12">
              <BookingContactForm
                buildPayload={buildPayload}
                blockedHint={hint}
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

      <Footer />
    </>
  );
};

export default HomeCleaning;