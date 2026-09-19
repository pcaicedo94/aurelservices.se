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
import { bookingHint, isQuoteOnly, parseArea, parseCount, QUOTE_ONLY_HINT } from "../lib/booking/rules";
import {
  deepCleaningBasePrice,
  DEEP_CLEANING_EXTRAS,
  DEEP_CLEANING_QUOTE_ABOVE_AREA,
} from "../lib/pricing";
import {
  describeArea,
  describeDate,
  formatArea,
  formatDateTime,
  formatPrice,
  NOT_SET,
  roundKronor,
} from "../lib/booking/format";

const MAX_WALLS = 20;

const CONTACT_PREFERENCES = { call: "Bli uppringd", visit: "Få ett hembesök" };

const DeepCleaning = () => {
  const [size, setSize] = useState("");
  const [contactPreference, setContactPreference] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const date = useBookingDate();

  // Extra services checkboxes
  const [hasKylFrys, setHasKylFrys] = useState(false);
  const [hasKylFrysDefrost, setHasKylFrysDefrost] = useState(false);
  const [hasDiskmaskin, setHasDiskmaskin] = useState(false);
  const [hasKapGarderob, setHasKapGarderob] = useState(false);
  const [hasForrad, setHasForrad] = useState(false);
  const [hasTvattmaskin, setHasTvattmaskin] = useState(false);
  const [vaggtvatt, setVaggtvatt] = useState("0");

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Derived on every render, so the summary and the payload always follow the
  // current inputs and never keep a price from values that were cleared.
  // Homes above this size are quoted ("Offereras"), not priced online.
  const area = parseArea(size, { max: DEEP_CLEANING_QUOTE_ABOVE_AREA });
  const walls = parseCount(vaggtvatt, { min: 0, max: MAX_WALLS, emptyValue: 0 });
  const wallCount = walls.status === "ok" ? walls.value : 0;
  const basePrice = area.status === "ok" ? deepCleaningBasePrice(area.value) : null;

  const extras = [
    { selected: hasKylFrys, label: "Kyl/Frys invändigt (ej avfrostning)", price: DEEP_CLEANING_EXTRAS.kylFrys },
    { selected: hasKylFrysDefrost, label: "Kyl/Frys med avfrostning", price: DEEP_CLEANING_EXTRAS.kylFrysDefrost },
    { selected: hasDiskmaskin, label: "Diskmaskin invändigt", price: DEEP_CLEANING_EXTRAS.diskmaskin },
    { selected: hasKapGarderob, label: "Skåp och garderober invändigt", price: DEEP_CLEANING_EXTRAS.kapGarderob },
    { selected: hasForrad, label: "Förråd", price: DEEP_CLEANING_EXTRAS.forrad },
    { selected: hasTvattmaskin, label: "Tvättmaskin/torktumlare invändigt", price: DEEP_CLEANING_EXTRAS.tvattmaskin },
    {
      selected: wallCount > 0,
      label: `Väggtvätt (${wallCount} vägg${wallCount > 1 ? "ar" : ""})`,
      price: wallCount * DEEP_CLEANING_EXTRAS.vaggtvatt,
    },
  ].filter((extra) => extra.selected);
  const extrasLabel = extras.map((extra) => extra.label).join(", ");

  const totalPrice =
    basePrice !== null && walls.status === "ok"
      ? roundKronor(extras.reduce((sum, extra) => sum + extra.price, basePrice))
      : null;

  const hint = bookingHint([
    { label: "storlek", status: area.status },
    { label: "antal väggar", status: walls.status },
    { label: "datum", status: date.check.status },
    { label: "kontaktmetod", status: CONTACT_PREFERENCES[contactPreference] ? "ok" : "empty" },
  ]);
  const needsQuote = isQuoteOnly({ outOfRange: area.status === "quote", hint, price: totalPrice });

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Storstädning",
    area: String(area.value),
    dateTime: date.dateTime,
    contactPreference,
    basePrice,
    extras: extrasLabel,
    totalPrice,
  });

  const clearCalculator = () => {
    setSize("");
    date.setDateTime("");
    setContactPreference("");
    setHasKylFrys(false);
    setHasKylFrysDefrost(false);
    setHasDiskmaskin(false);
    setHasKapGarderob(false);
    setHasForrad(false);
    setHasTvattmaskin(false);
    setVaggtvatt("0");
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
    ...(extrasLabel && { Tillval: extrasLabel }),
    ...(date.isValid && { "Önskat datum och tid": formatDateTime(date.dateTime) }),
    ...(CONTACT_PREFERENCES[contactPreference] && {
      Kontaktmetod: CONTACT_PREFERENCES[contactPreference],
    }),
  };

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
                <label>Tillvalstjänster</label>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrys"
                    checked={hasKylFrys}
                    onChange={(e) => {
                      setHasKylFrys(e.target.checked);
                      // The two fridge options exclude each other.
                      if (e.target.checked) setHasKylFrysDefrost(false);
                    }}
                  />
                  <label className="form-check-label" htmlFor="kylfrys">
                    {`Kyl/Frys invändigt (ej avfrostning) - ${DEEP_CLEANING_EXTRAS.kylFrys} kr`}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="kylfrysdefrost"
                    checked={hasKylFrysDefrost}
                    onChange={(e) => {
                      setHasKylFrysDefrost(e.target.checked);
                      if (e.target.checked) setHasKylFrys(false);
                    }}
                  />
                  <label className="form-check-label" htmlFor="kylfrysdefrost">
                    {`Kyl/Frys med avfrostning - ${DEEP_CLEANING_EXTRAS.kylFrysDefrost} kr`}
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
                    {`Diskmaskin invändigt - ${DEEP_CLEANING_EXTRAS.diskmaskin} kr`}
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
                    {`Skåp och garderober invändigt - ${DEEP_CLEANING_EXTRAS.kapGarderob} kr`}
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
                    {`Balkong/Förråd - ${DEEP_CLEANING_EXTRAS.forrad} kr`}
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
                    {`Tvättmaskin/torktumlare invändigt - ${DEEP_CLEANING_EXTRAS.tvattmaskin} kr`}
                  </label>
                </div>
                <div className="form-group mt-3">
                  <label htmlFor="vaggtvatt">{`Väggtvätt (${DEEP_CLEANING_EXTRAS.vaggtvatt} kr per vägg)`}</label>
                  <input
                    type="number"
                    id="vaggtvatt"
                    className={`form-control${walls.status === "invalid" ? ` ${invalidClass}` : ""}`}
                    placeholder="Antal väggar"
                    min="0"
                    max={MAX_WALLS}
                    step="1"
                    inputMode="numeric"
                    value={vaggtvatt}
                    onChange={(e) => setVaggtvatt(e.target.value)}
                    aria-invalid={walls.status === "invalid" || undefined}
                    aria-describedby={walls.status === "invalid" ? "vaggtvatt-error" : undefined}
                  />
                  <FieldError id="vaggtvatt-error">
                    {walls.status === "invalid" &&
                      `Ange antal väggar som ett heltal mellan 0 och ${MAX_WALLS}.`}
                  </FieldError>
                </div>
              </div>

              <DateTimeField
                date={date}
                inputRef={dateInputRef}
                conflict={flow.isConflict(date.dateTime)}
              />
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
            <BookingSummary
              mode={needsQuote ? "quote" : "book"}
              hint={needsQuote ? "" : hint}
              onBook={flow.openContact}
              onQuote={() => setShowQuote(true)}
              quoteNote={`Storstädning av bostäder över ${DEEP_CLEANING_QUOTE_ABOVE_AREA} m² prissätter vi med en offert. Skicka en förfrågan så återkommer vi.`}
            >
              <li>
                <strong>Storlek:</strong> {describeArea(area)}
              </li>
              <li>
                <strong>Baspris:</strong> {needsQuote ? "Offereras" : formatPrice(basePrice)}
              </li>
              <li>
                <strong>Önskat datum och tid:</strong> {describeDate(date)}
              </li>
              <li>
                <strong>Kontaktmetod:</strong> {CONTACT_PREFERENCES[contactPreference] || NOT_SET}
              </li>
              <li>
                <strong>Uppskattat totalpris:</strong>{" "}
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
        service="Storstädning"
        details={quoteDetails}
      />

      <Footer />
    </>
  );
};

export default DeepCleaning;
