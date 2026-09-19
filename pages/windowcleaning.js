import React, { useRef, useState } from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import QuoteModal from "../components/Common/QuoteModal";
import Footer from "../components/Layouts/Footer";
import BookingSummary from "../components/Booking/BookingSummary";
import BookingContactForm from "../components/Booking/BookingContactForm";
import BookingConfirmation from "../components/Booking/BookingConfirmation";
import DateTimeField from "../components/Booking/DateTimeField";
import useBookingFlow from "../lib/booking/useBookingFlow";
import useBookingDate from "../lib/booking/useBookingDate";
import FieldError, { invalidClass } from "../components/Booking/FieldError";
import { bookingHint, isQuoteOnly, parseArea, QUOTE_ONLY_HINT } from "../lib/booking/rules";
import {
  WINDOW_BALCONY_PRICE,
  WINDOW_QUOTE_ABOVE_AREA,
  WINDOW_QUOTE_FROM_ROOMS,
  WINDOW_ROOM_PRICES,
  WINDOW_SURCHARGE_PERCENT,
  WINDOW_SURCHARGE_RATE,
} from "../lib/pricing";
import { describeArea, describeDate, formatDateTime, formatPrice, NOT_SET, roundKronor } from "../lib/booking/format";
import Seo from "../components/Common/Seo";

// Q21 (client, confirmed): a home of this many rooms, or larger than
// WINDOW_QUOTE_ABOVE_AREA, is quoted and never priced online. The room count
// is compared against the value of the select, which is a string.
const QUOTE_FROM_ROOMS = String(WINDOW_QUOTE_FROM_ROOMS);

const WindowCleaning = () => {
  // Form state
  const [rooms, setRooms] = useState("");
  const [size, setSize] = useState("");
  const [hasSprojs, setHasSprojs] = useState(false);
  const [hasHighCeiling, setHasHighCeiling] = useState(false);
  const [hasTripleGlass, setHasTripleGlass] = useState(false);
  const [onlyBalcony, setOnlyBalcony] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const date = useBookingDate();

  // Booking steps (contact form, confirmation) shared by all booking pages
  const flow = useBookingFlow();
  const dateInputRef = useRef(null);

  // Derived on every render, so the summary and the payload always follow the
  // current inputs and never keep a price from values that were cleared.
  const area = parseArea(size, { max: WINDOW_QUOTE_ABOVE_AREA });
  const basePrice = onlyBalcony ? WINDOW_BALCONY_PRICE : WINDOW_ROOM_PRICES[rooms] || null;
  const addOns = [
    hasSprojs && "Spröjs",
    hasHighCeiling && "Hög takhöjd",
    hasTripleGlass && "Treglasfönster"
  ].filter(Boolean);
  // Q20 (client, confirmed): the add-ons add up instead of compounding, so two
  // of them are +50 % of the base price, not +56 %.
  const totalPrice =
    basePrice === null ? null : roundKronor(basePrice * (1 + WINDOW_SURCHARGE_RATE * addOns.length));

  let selection = NOT_SET;
  if (onlyBalcony) selection = "Endast balkong";
  else if (rooms === QUOTE_FROM_ROOMS) selection = `${QUOTE_FROM_ROOMS} rum och kök eller större`;
  else if (rooms) selection = `${rooms} rum och kök`;

  const hint = bookingHint([
    { label: "antal rum", status: onlyBalcony || rooms ? "ok" : "empty" },
    { label: "datum", status: date.check.status },
  ]);
  const needsQuote = isQuoteOnly({
    outOfRange: !onlyBalcony && (rooms === QUOTE_FROM_ROOMS || area.status === "quote"),
    hint,
    price: totalPrice,
  });

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Fönsterputsning",
    rooms: onlyBalcony ? "Endast balkong" : `${rooms} rum och kök`,
    ...(area.status === "ok" && { area: String(area.value) }),
    addOns: addOns.join(", "),
    totalPrice,
    dateTime: date.dateTime,
  });

  const clearCalculator = () => {
    setRooms("");
    setSize("");
    setHasSprojs(false);
    setHasHighCeiling(false);
    setHasTripleGlass(false);
    setOnlyBalcony(false);
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
    Val: selection,
    ...(addOns.length > 0 && { Tillägg: addOns.join(", ") }),
    ...(date.isValid && { "Önskat datum och tid": formatDateTime(date.dateTime) }),
  };

  return (
    <>
      <Seo route="/windowcleaning" />

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
              <h3>RUT-avdrag</h3>
              <p>Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden. Vi sköter hela ansökan direkt på fakturan.</p>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: "30px" }}>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h3>Vad ingår</h3>
              <ul>
                <li>Rengöring av fönstrets in- och utsida</li>
                <li>Putsning av fönsterglas för klart och fläckfritt resultat</li>
                <li>Avtorkning av fönsterkarmar och kanter</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h3>Fördelar</h3>
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
              <h3>Prisinformation</h3>
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
                  <option value="5">{`${QUOTE_FROM_ROOMS} rum och kök eller större`}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="size">Bostadens storlek i m² (frivilligt)</label>
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
                  disabled={onlyBalcony}
                  aria-invalid={area.status === "invalid" || undefined}
                  aria-describedby={area.message ? "size-error" : undefined}
                />
                <FieldError id="size-error">{area.message}</FieldError>
                <small className="form-text text-muted">
                  Över {WINDOW_QUOTE_ABOVE_AREA} m² lämnar vi en offert.
                </small>
              </div>

              <div className="form-group">
                <label>Tillägg</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="sprojs" checked={hasSprojs} onChange={(e) => setHasSprojs(e.target.checked)} />
                  <label className="form-check-label" htmlFor="sprojs">{`Spröjs (+${WINDOW_SURCHARGE_PERCENT}%)`}</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="highCeiling" checked={hasHighCeiling} onChange={(e) => setHasHighCeiling(e.target.checked)} />
                  <label className="form-check-label" htmlFor="highCeiling">{`Takhöjd över 280 cm (+${WINDOW_SURCHARGE_PERCENT}%)`}</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="tripleGlass" checked={hasTripleGlass} onChange={(e) => setHasTripleGlass(e.target.checked)} />
                  <label className="form-check-label" htmlFor="tripleGlass">{`Treglasfönster eller mer (+${WINDOW_SURCHARGE_PERCENT}%)`}</label>
                </div>
              </div>

              <div className="form-group">
                <label>Endast Balkong</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="onlyBalcony" checked={onlyBalcony} onChange={(e) => { setOnlyBalcony(e.target.checked); if (e.target.checked) setRooms(""); }} />
                  <label className="form-check-label" htmlFor="onlyBalcony">{`Endast inglasad balkong (från ${WINDOW_BALCONY_PRICE} kr)`}</label>
                </div>
              </div>

              <DateTimeField date={date} inputRef={dateInputRef} conflict={flow.isConflict(date.dateTime)} />
            </form>
          </div>

          {/* Summary Section */}
          <div className="col-lg-6">
            <BookingSummary
              mode={needsQuote ? "quote" : "book"}
              hint={needsQuote ? "" : hint}
              onBook={flow.openContact}
              onQuote={() => setShowQuote(true)}
              quoteNote={`För ${QUOTE_FROM_ROOMS} rum och kök eller mer än ${WINDOW_QUOTE_ABOVE_AREA} m² lämnar vi en offert. Skicka en förfrågan så återkommer vi.`}
            >
              <li><strong>Val:</strong> {selection}</li>
              <li><strong>Storlek:</strong> {onlyBalcony ? "–" : describeArea(area)}</li>
              <li><strong>Tillägg:</strong> {addOns.join(", ") || "Inga"}</li>
              <li><strong>Önskat datum och tid:</strong> {describeDate(date)}</li>
              <li><strong>Uppskattat pris:</strong> {needsQuote ? "Offereras" : formatPrice(totalPrice)}</li>
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
        service="Fönsterputsning"
        details={quoteDetails}
      />

      <Footer />
    </>
  );
};

export default WindowCleaning;
