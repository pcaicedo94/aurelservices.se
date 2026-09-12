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

const WindowCleaning = () => {
  // Form state
  const [rooms, setRooms] = useState("");
  const [hasSprojs, setHasSprojs] = useState(false);
  const [hasHighCeiling, setHasHighCeiling] = useState(false);
  const [hasTripleGlass, setHasTripleGlass] = useState(false);
  const [onlyBalcony, setOnlyBalcony] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [predictedPrice, setPredictedPrice] = useState(0);

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Calendar constraints
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

  // Price calculation logic
  useEffect(() => {
    let basePrice = 0;
    if (onlyBalcony) {
      basePrice = 450;
    } else {
      switch (rooms) {
        case "1": basePrice = 799; break;
        case "2": basePrice = 899; break;
        case "3": basePrice = 999; break;
        case "4": basePrice = 1099; break;
        default: basePrice = 0;
      }
    }

    if (basePrice > 0) {
      let finalPrice = basePrice;
      if (hasSprojs) finalPrice *= 1.25;
      if (hasHighCeiling) finalPrice *= 1.25;
      if (hasTripleGlass) finalPrice *= 1.25;
      setPredictedPrice(finalPrice.toFixed(2));
    } else if (rooms === "5") {
      setPredictedPrice("Offereras");
    } else {
      setPredictedPrice(0);
    }
  }, [rooms, hasSprojs, hasHighCeiling, hasTripleGlass, onlyBalcony]);

  // Time validation
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

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Fönsterputsning",
    rooms: onlyBalcony ? "Endast balkong" : `${rooms} rum och kök`,
    addOns: [
      hasSprojs && "Spröjs",
      hasHighCeiling && "Hög takhöjd",
      hasTripleGlass && "Treglasfönster"
    ].filter(Boolean).join(", "),
    totalPrice: predictedPrice,
    dateTime,
  });

  const clearCalculator = () => {
    setRooms("");
    setHasSprojs(false);
    setHasHighCeiling(false);
    setHasTripleGlass(false);
    setOnlyBalcony(false);
    setDateTime("");
    setPredictedPrice(0);
  };

  const handleBooked = (payload) => {
    flow.complete({ service: payload.cleaningType, when: payload.dateTime, email: payload.email });
    clearCalculator();
  };

  const hint =
    rooms === "5" && !onlyBalcony
      ? "Större bostäder offereras – kontakta oss."
      : bookingHint([
          { label: "antal rum", status: onlyBalcony || rooms ? "ok" : "empty" },
          { label: "datum", status: dateTime ? "ok" : "empty" },
        ]);

  return (
    <>
      <Navbar />
      <PageBanner pageTitle="Fönsterputsning" bgImage="/images/banners/fonsterputs.webp" />

      {/* Descriptive Section */}
      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-7">
            <h2>Fönsterputsning i Stockholm – Skinande rena fönster</h2>
            <p>
              Vill du ha rena fönster utan ränder och fläckar? Aurel Städ &amp; Allservice erbjuder professionell fönsterputsning i Stockholm för privatpersoner. Vi ser till att dina fönster blir skinande rena och ger ett bättre ljusinsläpp i ditt hem.
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
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Vad ingår</h4>
              <ul>
                <li>Rengöring av fönstrets in- och utsida</li>
                <li>Putsning av fönsterglas för klart och fläckfritt resultat</li>
                <li>Avtorkning av fönsterkarmar och kanter</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Fördelar</h4>
              <ul>
                <li>Klart och randfritt resultat</li>
                <li>Ökat ljusinsläpp i hemmet</li>
                <li>Professionell och noggrann service</li>
                <li>Sparar tid</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Prisinformation</h4>
              <p>Priser inkl. moms efter RUT-avdrag. I priserna ingår rengöring av fönstrets bågar och dammning av persienner.</p>
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            <h3>Beräkna pris</h3>
            <form onSubmit={(e) => e.preventDefault()} className="window-cleaning-form">
              <div className="form-group">
                <label htmlFor="rooms">Antal rum</label>
                <select id="rooms" className="form-control" value={rooms} onChange={(e) => { setRooms(e.target.value); setOnlyBalcony(false); }} required={!onlyBalcony}>
                  <option value="">Välj antal rum</option>
                  <option value="1">1 rum och kök</option>
                  <option value="2">2 rum och kök</option>
                  <option value="3">3 rum och kök</option>
                  <option value="4">4 rum och kök</option>
                  <option value="5">5 rum och kök eller större</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tillägg</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="sprojs" checked={hasSprojs} onChange={(e) => setHasSprojs(e.target.checked)} />
                  <label className="form-check-label" htmlFor="sprojs">Spröjs (+25%)</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="highCeiling" checked={hasHighCeiling} onChange={(e) => setHasHighCeiling(e.target.checked)} />
                  <label className="form-check-label" htmlFor="highCeiling">Takhöjd över 280 cm (+25%)</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="tripleGlass" checked={hasTripleGlass} onChange={(e) => setHasTripleGlass(e.target.checked)} />
                  <label className="form-check-label" htmlFor="tripleGlass">Treglasfönster eller mer (+25%)</label>
                </div>
              </div>

              <div className="form-group">
                <label>Endast Balkong</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="onlyBalcony" checked={onlyBalcony} onChange={(e) => { setOnlyBalcony(e.target.checked); if (e.target.checked) setRooms(""); }} />
                  <label className="form-check-label" htmlFor="onlyBalcony">Endast inglasad balkong (från 450 kr)</label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dateTime">Önskat datum och tid (Mellan 07:00-17:00)</label>
                <input ref={dateInputRef} type="datetime-local" id="dateTime" className="form-control" value={dateTime} onChange={handleDateTimeChange} min={minDateTime} step="1800" required />
                {flow.conflictDateTime !== "" && flow.conflictDateTime === dateTime && (
                  <FieldError id="dateTime-error">Tiden är tyvärr redan bokad. Välj en annan dag eller tid.</FieldError>
                )}
              </div>
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary hint={hint} onBook={flow.openContact}>
              <li><strong>Val:</strong> {onlyBalcony ? "Endast balkong" : rooms ? `${rooms} rum och kök` : "Ej angiven"}</li>
              <li><strong>Tillägg:</strong> {[hasSprojs && "Spröjs", hasHighCeiling && "Hög takhöjd", hasTripleGlass && "Treglasfönster"].filter(Boolean).join(", ") || "Inga"}</li>
              <li><strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}</li>
              <li><strong>Uppskattat pris:</strong> {predictedPrice === "Offereras" ? "Offereras" : `${predictedPrice} kr`}</li>
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

export default WindowCleaning;
