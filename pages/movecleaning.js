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
import { bookingHint, isQuoteOnly, parseArea, QUOTE_ONLY_HINT } from "../lib/booking/rules";
import {
  describeArea,
  describeDate,
  formatArea,
  formatDateTime,
  formatHours,
  formatPrice,
  NO_PRICE,
  roundKronor,
} from "../lib/booking/format";

// Calculate base price based on area.
// Q22 (client, confirmed): the 2026 list alone makes 51 m² cheaper than 50 m²
// (2 601 vs 2 890 kr), and the same happens at 101 and 151 m². The price may
// never fall below the top of the previous tier, so each tier starts there.
const getBasePrice = (area) => {
  if (area >= 1 && area <= 50) return 2890;
  if (area > 50 && area <= 100) return Math.max(2890, area * 51);
  if (area > 100 && area <= 150) return Math.max(100 * 51, area * 47);
  return Math.max(150 * 47, area * 42);
};

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
  const area = parseArea(size);
  // Rounded to two decimals as before: side areas are billed per estimated hour.
  const cleaningTime = area.status === "ok" ? Number((1.57 + 0.0167 * area.value).toFixed(2)) : null;
  const basePrice = area.status === "ok" ? roundKronor(getBasePrice(area.value)) : null;

  const extras = [
    { selected: hasKylFrysDefrost, label: "Kyl/Frys med avfrostning", short: "Kyl/Frys", price: 400 },
    { selected: hasPersienner, label: "Persienner (kan bokas som tillägg)", short: "Persienner", price: 360 },
    {
      selected: hasBalkonger,
      label: "Städning av biytor såsom förråd, garage och balkonger",
      short: "Biytor",
      price: roundKronor((cleaningTime || 0) * 360), // 360 kr/timmen
    },
    { selected: hasBalkongerGlas, label: "Fönsterputsning av inglasade balkonger", short: "Fönsterputsning balkong", price: 650 },
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
                <strong>Önskat datum och tid:</strong> {describeDate(date)}
              </li>
              <li>
                <strong>Beräknad tid:</strong> {cleaningTime === null ? NO_PRICE : formatHours(cleaningTime)}
              </li>
              <li>
                <strong>Baspris:</strong> {needsQuote ? "Offereras" : formatPrice(basePrice)}
              </li>
              <li>
                <strong>Tillägg:</strong> {extras.map((extra) => extra.short).join(", ") || "Inga"}
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
        service="Flyttstädning"
        details={quoteDetails}
      />

      <Footer />
    </>
  );
};

export default MoveCleaning;
