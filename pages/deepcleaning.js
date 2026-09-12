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

const DeepCleaning = () => {
  const [size, setSize] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [predictedPrice, setPredictedPrice] = useState(0);
  
  // Extra services checkboxes
  const [hasKylFrys, setHasKylFrys] = useState(false);
  const [hasKylFrysDefrost, setHasKylFrysDefrost] = useState(false);
  const [hasDiskmaskin, setHasDiskmaskin] = useState(false);
  const [hasKapGarderob, setHasKapGarderob] = useState(false);
  const [hasForrad, setHasForrad] = useState(false);
  const [hasTvattmaskin, setHasTvattmaskin] = useState(false);
  const [vaggtvattCount, setVaggtvattCount] = useState(0);
  
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

  // Calculate base price based on area
  const calculateBasePrice = (area) => {
    if (!isNaN(area) && area > 0) {
      let price = 0;
      if (area >= 1 && area <= 50) price = 2650;
      else if (area > 50 && area <= 70) price = 3290;
      else if (area > 70 && area <= 100) price = 3950;
      else if (area > 100 && area <= 150) price = 4750;
      else if (area > 150) price = 0; // Offereras
      setBasePrice(price);
      return price;
    }
    setBasePrice(0);
    return 0;
  };

  // Calculate total price with extras
  useEffect(() => {
    let total = basePrice;
    
    // Add extra services
    if (hasKylFrys) total += 360;
    if (hasKylFrysDefrost) total += 500;
    if (hasDiskmaskin) total += 250;
    if (hasKapGarderob) total += 360;
    if (hasForrad) total += 300;
    if (hasTvattmaskin) total += 390;
    total += vaggtvattCount * 250;
    
    setPredictedPrice(total.toFixed(2));
  }, [basePrice, hasKylFrys, hasKylFrysDefrost, hasDiskmaskin, hasKapGarderob, hasForrad, hasTvattmaskin, vaggtvattCount]);

  // Handle size input change
  const handleSizeChange = (e) => {
    const area = parseFloat(e.target.value);
    setSize(e.target.value);
    calculateBasePrice(area);
  };

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => {
    const extras = [];
    if (hasKylFrys) extras.push("Kyl/Frys invändigt (ej avfrostning)");
    if (hasKylFrysDefrost) extras.push("Kyl/Frys med avfrostning");
    if (hasDiskmaskin) extras.push("Diskmaskin invändigt");
    if (hasKapGarderob) extras.push("Skåp och garderober invändigt");
    if (hasForrad) extras.push("Förråd");
    if (hasTvattmaskin) extras.push("Tvättmaskin/torktumlare invändigt");
    if (vaggtvattCount > 0) extras.push(`Väggtvätt (${vaggtvattCount} vägg${vaggtvattCount > 1 ? 'ar' : ''})`);

    return {
      cleaningType: "Storstädning",
      area: size,
      dateTime,
      contactPreference,
      basePrice,
      extras: extras.join(", "),
      totalPrice: predictedPrice,
    };
  };

  const clearCalculator = () => {
    setSize("");
    setDateTime("");
    setContactPreference("");
    setBasePrice(0);
    setPredictedPrice(0);
    setHasKylFrys(false);
    setHasKylFrysDefrost(false);
    setHasDiskmaskin(false);
    setHasKapGarderob(false);
    setHasForrad(false);
    setHasTvattmaskin(false);
    setVaggtvattCount(0);
  };

  const handleBooked = (payload) => {
    flow.complete({ service: payload.cleaningType, when: payload.dateTime, email: payload.email });
    clearCalculator();
  };

  const hint = bookingHint([
    { label: "storlek", status: size ? "ok" : "empty" },
    { label: "datum", status: dateTime ? "ok" : "empty" },
    { label: "kontaktmetod", status: contactPreference ? "ok" : "empty" },
  ]);

  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Storstädning" bgImage="/images/banners/storstadning.webp" bgPosition="center 25%" />

      {/* Descriptive Section */}
      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-7">
            <h2>Storstädning i Stockholm – Grundlig rengöring av hela hemmet</h2>
            <p>
              Behöver ditt hem en ordentlig genomgång? Aurel Städ &amp; Allservice erbjuder professionell storstädning i Stockholm där vi rengör ditt hem på djupet, från golv till tak. Perfekt för dig som vill ha en nystart i hemmet eller som inte har tid att göra en grundlig städning själv.
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
              <h4>Allmän rengöring</h4>
              <ul>
                <li>Rengöring av alla ytor från golv till tak</li>
                <li>Dammsugning och våttorkning av golv, lister, dörrkarmar</li>
                <li>Borttagning av damm, smuts och fläckar på ytor och skåp</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Kök och badrum</h4>
              <ul>
                <li>Rengöring med fokus på noggrannhet och hygien</li>
                <li>Rengöring av kyl och frys utvändigt</li>
                <li>Rengöring av brunnar i toalett, kök och badrum</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h4>Utrustning och material</h4>
              <ul>
                <li>All städutrustning ingår</li>
                <li>Dammsugare, hinkar, moppar</li>
                <li>Transport och professionella städprodukter</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <div className="brand-card-warning">
              <strong>Viktig information:</strong> Om bostaden är hårt nedsmutsad kan en tilläggskostnad på upp till 20 procent tillkomma. Kunden informeras alltid innan arbetet påbörjas. <strong>OBS!</strong> Fönsterputs ingår inte men kan bokas som tilläggstjänst.
            </div>
          </div>
        </div>

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            <h3>Beräkna pris</h3>
            <form className="deep-cleaning-form" onSubmit={(e) => e.preventDefault()}>
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
                <label>Tillvalstjänster</label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrys"
                    checked={hasKylFrys}
                    onChange={(e) => setHasKylFrys(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kylfrys">
                    Kyl/Frys invändigt (ej avfrostning) - 360 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrysdefrost"
                    checked={hasKylFrysDefrost}
                    onChange={(e) => setHasKylFrysDefrost(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kylfrysdefrost">
                    Kyl/Frys med avfrostning - 500 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="diskmaskin"
                    checked={hasDiskmaskin}
                    onChange={(e) => setHasDiskmaskin(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="diskmaskin">
                    Diskmaskin invändigt - 250 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kapgarderob"
                    checked={hasKapGarderob}
                    onChange={(e) => setHasKapGarderob(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="kapgarderob">
                    Skåp och garderober invändigt - 360 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="forrad"
                    checked={hasForrad}
                    onChange={(e) => setHasForrad(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="forrad">
                    Balkong/Förråd - 300 kr
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="tvattmaskin"
                    checked={hasTvattmaskin}
                    onChange={(e) => setHasTvattmaskin(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="tvattmaskin">
                    Tvättmaskin/torktumlare invändigt - 390 kr
                  </label>
                </div>
                <div className="form-group mt-3">
                  <label htmlFor="vaggtvatt">Väggtvätt (250 kr per vägg)</label>
                  <input
                    type="number"
                    id="vaggtvatt"
                    className="form-control"
                    placeholder="Antal väggar"
                    min="0"
                    value={vaggtvattCount}
                    onChange={(e) => setVaggtvattCount(parseInt(e.target.value) || 0)}
                  />
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
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary hint={hint} onBook={flow.openContact}>
              <li>
                <strong>Storlek:</strong> {size || "Ej angiven"} m²
              </li>
              <li>
                <strong>Baspris:</strong> {basePrice === 0 && parseFloat(size) > 150 ? "Offereras" : `${basePrice || "0"} kr`}
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
              <li>
                <strong>Uppskattat totalpris:</strong> {basePrice === 0 && parseFloat(size) > 150 ? "Offereras" : `${predictedPrice || "0"} kr`}
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

export default DeepCleaning;
