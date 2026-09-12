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

const MoveCleaning = () => {
  const [size, setSize] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [predictedPrice, setPredictedPrice] = useState(0);
  const [cleaningTime, setCleaningTime] = useState(0);
  
  // Extra services checkboxes
  const [hasKylFrysDefrost, setHasKylFrysDefrost] = useState(false);
  const [hasPersienner, setHasPersienner] = useState(false);
  const [hasBalkonger, setHasBalkonger] = useState(false);
  const [hasBalkongerGlas, setHasBalkongerGlas] = useState(false);
  
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

  // Calculate base price and time
  const calculateBasePrice = (area) => {
    if (!isNaN(area) && area > 0) {
      // Calculate time
      const time = 1.57 + 0.0167 * area;
      setCleaningTime(time.toFixed(2));

      // Calculate base price
      let price = 0;
      if (area >= 1 && area <= 50) {
        price = 2890;
      } else if (area > 50 && area <= 100) {
        price = area * 51;
      } else if (area > 100 && area <= 150) {
        price = area * 47;
      } else if (area > 150) {
        price = area * 42;
      }
      setBasePrice(price);
      return price;
    }
    setBasePrice(0);
    setCleaningTime(0);
    return 0;
  };

  // Calculate total price with extras
  useEffect(() => {
    let total = basePrice;
    
    // Add extra services
    if (hasKylFrysDefrost) total += 400;
    if (hasPersienner) total += 360;
    if (hasBalkonger) total += cleaningTime * 360; // 360 kr/timmen
    if (hasBalkongerGlas) total += 650;
    
    setPredictedPrice(total.toFixed(2));
  }, [basePrice, hasKylFrysDefrost, hasPersienner, hasBalkonger, hasBalkongerGlas, cleaningTime]);

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

  // Handle size input change
  const handleSizeChange = (e) => {
    const area = parseFloat(e.target.value);
    setSize(e.target.value);
    calculateBasePrice(area);
  };

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => {
    const extras = [];
    if (hasKylFrysDefrost) extras.push("Kyl/Frys med avfrostning");
    if (hasPersienner) extras.push("Persienner (kan bokas som tillägg)");
    if (hasBalkonger) extras.push("Städning av biytor såsom förråd, garage och balkonger");
    if (hasBalkongerGlas) extras.push("Fönsterputsning av inglasade balkonger");

    return {
      cleaningType: "Flyttstädning",
      area: size,
      hours: cleaningTime,
      dateTime,
      basePrice,
      extras: extras.join(", "),
      totalPrice: predictedPrice,
    };
  };

  const clearCalculator = () => {
    setSize("");
    setDateTime("");
    setBasePrice(0);
    setCleaningTime(0);
    setPredictedPrice(0);
    setHasKylFrysDefrost(false);
    setHasPersienner(false);
    setHasBalkonger(false);
    setHasBalkongerGlas(false);
  };

  const handleBooked = (payload) => {
    flow.complete({ service: payload.cleaningType, when: payload.dateTime, email: payload.email });
    clearCalculator();
  };

  const hint = bookingHint([
    { label: "storlek", status: size ? "ok" : "empty" },
    { label: "datum", status: dateTime ? "ok" : "empty" },
  ]);

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Flyttstädning" bgImage="/images/banners/flyttstadning.webp" />

      {/* Descriptive Section */}
      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-7">
            <h2>Flyttstädning i Stockholm – Noggrann städning inför besiktning</h2>
            <p>
              Ska du flytta och behöver en professionell flyttstädning i Stockholm? Aurel Städ &amp; Allservice erbjuder noggrann och komplett flyttstädning som uppfyller alla krav inför besiktning. Vi ser till att bostaden lämnas i perfekt skick, vilket minskar risken för anmärkningar och gör flytten enklare för dig.
            </p>
          </div>
          <div className="col-lg-5">
            <div className="brand-card">
              <h4>RUT-avdrag</h4>
              <p>Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden. Vi sköter hela ansökan direkt på fakturan.</p>
              <p><strong>OBS!</strong> Fönsterputs ingår. Gäller ej spröjsade fönster.</p>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: "30px" }}>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Allmänna utrymmen</h4>
              <ul>
                <li>Dammsugning och våttorkning av golv</li>
                <li>Rengöring av golvlister och trösklar</li>
                <li>Rengöring av dörrar, dörrkarmar och handtag</li>
                <li>Rengöring av strömbrytare och eluttag</li>
                <li>Borttagning av synliga fläckar på väggar och tak</li>
                <li>Fönsterputsning, både invändigt och utvändigt</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Kök</h4>
              <ul>
                <li>Rengöring av alla skåp och lådor, invändigt och utvändigt</li>
                <li>Djupgående rengöring av ugn och spis inklusive plattor och galler</li>
                <li>Rengöring av kyl och frys (ska vara tömda och avfrostade)</li>
                <li>Rengöring av diskmaskin om sådan finns</li>
                <li>Rengöring av köksfläkt och filter</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Badrum</h4>
              <ul>
                <li>Noggrann rengöring av toalett, handfat, dusch och badkar</li>
                <li>Borttagning av kalkavlagringar på kranar och kakel</li>
                <li>Rengöring av speglar och badrumsskåp</li>
                <li>Rengöring av ventilation och luftgaller</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: "10px" }}>
          <div className="col-lg-12">
            <div className="brand-card-warning">
              <strong>Viktig information om pris:</strong> Priset baseras på att bostaden är i normalt skick. Om bostaden visar sig vara mer smutsig än normalt kan ett pristillägg på upp till 20 procent tillkomma. Kunden informeras alltid innan arbetet påbörjas.
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            <h3>Beräkna pris</h3>
            <form className="move-cleaning-form" onSubmit={(e) => e.preventDefault()}>
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
                    Kyl/Frys med avfrostning - 400 kr
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
                    Persienner (kan bokas som tillägg) - 360 kr
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
                    Städning av biytor såsom förråd, garage och balkonger - 360 kr/timmen
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
                    Fönsterputsning av inglasade balkonger - 650 kr
                  </label>
                </div>
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
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary hint={hint} onBook={flow.openContact}>
              <li>
                <strong>Storlek:</strong> {size || "Ej angiven"} m²
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {dateTime || "Ej angiven"}
              </li>
              <li>
                <strong>Beräknad tid:</strong> {cleaningTime || "0"} timmar
              </li>
              <li>
                <strong>Baspris:</strong> {basePrice || "0"} kr
              </li>
              <li>
                <strong>Tillägg:</strong>{" "}
                {[
                  hasKylFrysDefrost && "Kyl/Frys",
                  hasPersienner && "Persienner",
                  hasBalkonger && "Biytor",
                  hasBalkongerGlas && "Fönsterputsning balkong"
                ].filter(Boolean).join(", ") || "Inga"}
              </li>
              <li>
                <strong>Uppskattat totalpris:</strong> {predictedPrice || "0"} kr
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

export default MoveCleaning;