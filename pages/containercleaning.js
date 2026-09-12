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

const ContainerCleaning = () => {
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(7, 0, 0, 0);
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    setMinDateTime(`${year}-${month}-${day}T07:00`);
  }, []);

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
  };

  // Pricing logic based on image
  const calculatePrice = (units, freq) => {
    const numUnits = parseInt(units);
    const numFreq = parseInt(freq);

    if (!numUnits || !numFreq) {
      setPredictedPrice(0);
      setPricePerUnit(0);
      return;
    }

    let pricePerBodar = 0;

    // 1-10 units pricing
    if (numUnits >= 1 && numUnits <= 10) {
      if (numFreq === 5) pricePerBodar = 100;
      else if (numFreq === 3) pricePerBodar = 110;
      else if (numFreq === 2) pricePerBodar = 120;
      else if (numFreq === 1) pricePerBodar = 130;
    }
    // 11-20 units pricing
    else if (numUnits >= 11 && numUnits <= 20) {
      if (numFreq === 5) pricePerBodar = 65;
      else if (numFreq === 3) pricePerBodar = 75;
      else if (numFreq === 2) pricePerBodar = 95;
      else if (numFreq === 1) pricePerBodar = 100;
    }
    // 21-30 units pricing
    else if (numUnits >= 21 && numUnits <= 30) {
      if (numFreq === 5) pricePerBodar = 60;
      else if (numFreq === 3) pricePerBodar = 70;
      else if (numFreq === 2) pricePerBodar = 90;
      else if (numFreq === 1) pricePerBodar = 95;
    }
    // 31-50 units pricing
    else if (numUnits >= 31 && numUnits <= 50) {
      if (numFreq === 5) pricePerBodar = 55;
      else if (numFreq === 3) pricePerBodar = 65;
      else if (numFreq === 2) pricePerBodar = 80;
      else if (numFreq === 1) pricePerBodar = 85;
    }

    setPricePerUnit(pricePerBodar);
    const totalPrice = pricePerBodar * numUnits * numFreq * 4; // Monthly price (4 weeks)
    setPredictedPrice(totalPrice.toFixed(2));
  };

  const handleUnitsChange = (e) => {
    const value = e.target.value;
    setNumberOfUnits(value);
    calculatePrice(value, frequency);
  };

  const handleFrequencyChange = (e) => {
    const value = e.target.value;
    setFrequency(value);
    calculatePrice(numberOfUnits, value);
  };

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Bodstädning",
    numberOfUnits: numberOfUnits,
    frequency: `${frequency} gånger/vecka`,
    pricePerUnit: pricePerUnit,
    totalPrice: predictedPrice,
    dateTime,
    contactPreference,
  });

  const clearCalculator = () => {
    setNumberOfUnits("");
    setFrequency("");
    setDateTime("");
    setContactPreference("");
    setPredictedPrice(0);
    setPricePerUnit(0);
  };

  const handleBooked = (payload) => {
    flow.complete({ service: payload.cleaningType, when: payload.dateTime, email: payload.email });
    clearCalculator();
  };

  const hint = bookingHint([
    { label: "antal bodar", status: numberOfUnits ? "ok" : "empty" },
    { label: "frekvens", status: frequency ? "ok" : "empty" },
    { label: "datum", status: dateTime ? "ok" : "empty" },
    { label: "kontaktmetod", status: contactPreference ? "ok" : "empty" },
  ]);

  const getFrequencyLabel = () => {
    if (!frequency) return "Ej angiven";
    if (frequency === "5") return "5 gånger/vecka (Måndag till fredag)";
    if (frequency === "3") return "3 gånger/vecka (Måndag/onsdag/fredag)";
    if (frequency === "2") return "2 gånger/vecka (Tisdag/torsdag)";
    if (frequency === "1") return "1 gång/vecka";
    return "Ej angiven";
  };

  return (
    <>
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
                  className="form-control"
                  placeholder="Ange antal bodar"
                  min="1"
                  max="50"
                  value={numberOfUnits}
                  onChange={handleUnitsChange}
                  required
                />
                <small className="form-text text-muted">
                  Ange mellan 1-50 bodar för automatisk prisberäkning
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Städfrekvens per vecka</label>
                <select
                  id="frequency"
                  className="form-control"
                  value={frequency}
                  onChange={handleFrequencyChange}
                  required
                >
                  <option value="">Välj frekvens</option>
                  <option value="5">5 gånger/vecka (Måndag till fredag)</option>
                  <option value="3">3 gånger/vecka (Måndag/onsdag/fredag)</option>
                  <option value="2">2 gånger/vecka (Tisdag/torsdag)</option>
                  <option value="1">1 gång/vecka</option>
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
              </div>

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

            {pricePerUnit > 0 && (
              <div className="alert alert-info mt-3">
                <strong>Pris per bod:</strong> {pricePerUnit} kr/bod (exkl. moms)
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary
              hint={hint}
              onBook={flow.openContact}
              footer={
                <p className="mt-3" style={{ fontSize: "13px", color: "#666" }}>
                  * Priser per timme exklusive moms.<br />
                  * Månadspriset är beräknat på 4 veckor.
                </p>
              }
            >
              <li>
                <strong>Antal bodar:</strong> {numberOfUnits || "Ej angiven"}
              </li>
              <li>
                <strong>Städfrekvens:</strong> {getFrequencyLabel()}
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}
              </li>
              <li>
                <strong>Kontaktmetod:</strong>{" "}
                {contactPreference === "call"
                  ? "Bli uppringd"
                  : contactPreference === "visit"
                  ? "Få ett hembesök"
                  : "Ej angiven"}
              </li>
              {pricePerUnit > 0 && (
                <li>
                  <strong>Pris per bod:</strong> {pricePerUnit} kr
                </li>
              )}
              <li>
                <strong>Uppskattat månadspris:</strong> {predictedPrice || "0"} kr (exkl. moms)
              </li>
            </BookingSummary>
          </div>

          {flow.contactOpen && (
            <div className="col-lg-12">
              <BookingContactForm
                buildPayload={buildPayload}
                blockedHint={hint}
                addressPlaceholder="Ange adressen för bodarna"
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

export default ContainerCleaning;