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
import useBookingFlow from "../../lib/booking/useBookingFlow";
import useBookingDate from "../../lib/booking/useBookingDate";
import FieldError, { invalidClass } from "../../components/Booking/FieldError";
import { bookingHint, isQuoteOnly, parseArea, parseCount, QUOTE_ONLY_HINT } from "../../lib/booking/rules";
import {
  WINDOW_BALCONY_PRICE,
  WINDOW_EXTRA_BAGE_PRICES,
  windowExtraBagePrice,
  windowIncludedBagar,
  WINDOW_INCLUDED_BAGAR_PER_ROOM,
  WINDOW_QUOTE_ABOVE_AREA,
  WINDOW_QUOTE_FROM_ROOMS,
  WINDOW_ROOM_PRICES,
} from "../../lib/pricing";
import { describeArea, describeDate, formatDateTime, formatPrice, NOT_SET } from "../../lib/booking/format";
import Seo from "../../components/Common/Seo";
import {
  GoodToKnow,
  ServiceIntro,
  ServiceSections,
} from "../../components/ServiceContent/ServiceContent";

// Q21 (client, confirmed): a home of this many rooms, or larger than
// WINDOW_QUOTE_ABOVE_AREA, is quoted and never priced online. The room count
// is compared against the value of the select, which is a string.
const QUOTE_FROM_ROOMS = String(WINDOW_QUOTE_FROM_ROOMS);

// A home with more frames than this is not a flat the room price was written
// for, so it is quoted instead of priced. It also stops a typo in the number
// field from producing a five-figure total.
const MAX_BAGAR = 100;

const WindowCleaning = () => {
  // Form state. The two flags replace the three +25 % add-ons the 2026 list
  // had (spröjs, ceilings over 280 cm, triple glazing): the 2027 list prices
  // none of them, and the only two window conditions it still singles out are
  // these, both as "Offert".
  const [rooms, setRooms] = useState("");
  const [size, setSize] = useState("");
  const [bagarInput, setBagarInput] = useState("");
  const [hasSprojs, setHasSprojs] = useState(false);
  const [hasOverhanging, setHasOverhanging] = useState(false);
  const [hasHardToReach, setHasHardToReach] = useState(false);
  const [hasHeavySoiling, setHasHeavySoiling] = useState(false);
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

  // Q20b (client, confirmed): the room price covers three frames per rum. An
  // empty field therefore means "the usual number", not "none", so leaving it
  // alone never adds a charge; a customer who does not count their windows is
  // quoted the plain room price, which is what the price list promises.
  const includedBagar = onlyBalcony ? 0 : windowIncludedBagar(rooms);
  const bagar = parseCount(bagarInput, { min: 1, max: MAX_BAGAR, emptyValue: includedBagar });
  const extraBagePrice =
    !onlyBalcony && bagar.status === "ok"
      ? windowExtraBagePrice(bagar.value, rooms, hasSprojs)
      : 0;
  const extraBagar = Math.max(0, (bagar.status === "ok" ? bagar.value : 0) - includedBagar);

  // Priced per frame or per job only after someone has seen the windows, and
  // the list gives two of the three no amount at all. They are collected
  // because they travel with the quote request, which is the point of asking.
  const addOns = [
    hasSprojs && "Spröjs",
    hasOverhanging && "Överhängda fönster",
    hasHardToReach && "Svåråtkomliga fönster",
    hasHeavySoiling && "Kraftigt nedsmutsade fönster",
    extraBagar > 0 && `${extraBagar} extra fönsterbågar`,
  ].filter(Boolean);

  // The room price plus the frames above the included ones. Nothing is
  // multiplied: the 2027 list has no percentage surcharge left.
  const totalPrice = basePrice === null ? null : basePrice + extraBagePrice;

  let selection = NOT_SET;
  if (onlyBalcony) selection = "Endast balkong";
  else if (rooms === QUOTE_FROM_ROOMS) selection = `${QUOTE_FROM_ROOMS} rum och kök eller större`;
  else if (rooms) selection = `${rooms} rum och kök`;

  const hint = bookingHint([
    { label: "antal rum", status: onlyBalcony || rooms ? "ok" : "empty" },
    { label: "antal fönsterbågar", status: bagar.status === "invalid" ? "invalid" : "ok" },
    { label: "datum", status: date.check.status },
  ]);
  // Spröjs and extra frames have a price, so they do not force a quote. The
  // other three do: each needs someone to look at the windows first.
  const needsQuote = isQuoteOnly({
    outOfRange:
      hasOverhanging ||
      hasHardToReach ||
      hasHeavySoiling ||
      bagar.status === "quote" ||
      (!onlyBalcony && (rooms === QUOTE_FROM_ROOMS || area.status === "quote")),
    hint,
    price: totalPrice,
  });

  // Calculator part of the booking payload; the contact form adds the rest.
  const buildPayload = () => ({
    cleaningType: "Fönsterputsning",
    rooms: onlyBalcony ? "Endast balkong" : `${rooms} rum och kök`,
    ...(area.status === "ok" && { area: String(area.value) }),
    ...(!onlyBalcony && bagar.status === "ok" && { bagar: String(bagar.value) }),
    addOns: addOns.join(", "),
    // Sent so the office can see the room price and the frame charge apart,
    // instead of having to work out why the total is not a list price.
    ...(basePrice !== null && { basePrice: String(basePrice) }),
    totalPrice,
    dateTime: date.dateTime,
  });

  const clearCalculator = () => {
    setRooms("");
    setSize("");
    setBagarInput("");
    setHasSprojs(false);
    setHasOverhanging(false);
    setHasHardToReach(false);
    setHasHeavySoiling(false);
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
      <Seo route="/tjanster/fonsterputs" />

      <Navbar />
      <PageBanner pageTitle="Fönsterputsning" bgImage="/images/banners/fonsterputs.webp" />

      {/* Descriptive Section */}
      <div className="container ptb-50 svc-page">
        <div className="row">
          <div className="col-lg-7">
            {/* Client copy from Textosweb.docx, point 6 (2026-11-26). */}
            <ServiceIntro
              heading="Fönsterputsning i Stockholm – in- och utvändig fönsterputs"
              paras={[
                "Rena fönster gör stor skillnad för både ljusinsläppet och känslan i hemmet. Med Aurel får du professionell fönsterputsning med fokus på kvalitet, noggrannhet och ett skinande rent resultat.",
              ]}
            />
          </div>
          <div className="col-lg-5">
            <div className="brand-card">
              <h3>RUT-avdrag</h3>
              <p>Du som privatperson kan använda RUT-avdraget och få upp till 50 procent avdrag på arbetskostnaden. Vi sköter hela ansökan direkt på fakturan.</p>
              <p>Priserna i kalkylatorn är inklusive moms och efter RUT-avdrag.</p>
            </div>
          </div>
        </div>

        <ServiceSections
          sections={[
            {
              title: "Det här ingår i vår fönsterputsning",
              items: [
                "Noggrann putsning av fönsterrutornas samtliga åtkomliga sidor, både invändigt och utvändigt.",
                "Vi tar med all nödvändig utrustning och professionella rengöringsmedel.",
                "Vi har ansvarsförsäkring som ger extra trygghet om en skada skulle uppstå i samband med arbetet.",
                "Vi utför fönsterputsning året runt, även vid regn och snö, när väderförhållandena tillåter det. Vi arbetar vid temperaturer ner till cirka -10 °C.",
              ],
            },
            {
              title: "Säkerhet vid användning av stege",
              paras: [
                "Om vi behöver använda en stege som finns i bostaden ska den vara stabil och säker. Tvåbenta stegar får vara högst 2 meter höga. Vid högre arbetshöjder krävs en lämplig och säker arbetsplattform eller annan godkänd utrustning.",
                "Vi förbehåller oss rätten att avstå från arbeten som inte kan utföras på ett säkert sätt.",
              ],
            },
          ]}
        />

        <GoodToKnow
          items={[
            "Vi putsar fönster på höjder upp till 3,5 meter. Om stege eller särskild utrustning behövs kan en tilläggskostnad tillkomma.",
            "Rengöring av persienner och fönsterbleck ingår inte i den ordinarie fönsterputsningen.",
            "Vi putsar inte skadade fönster eller fönster som inte kan öppnas på ett säkert sätt. Meddela oss gärna i förväg om något fönster har särskilda förutsättningar.",
            "Fönster som kräver arbete från yttertaket ingår inte i tjänsten.",
          ]}
        />

        {/* Form + Summary Section */}
        <div className="row">
          <div className="col-lg-6">
            {/* The heading lives inside the card, like "Summering" in the summary. */}
            <form onSubmit={(e) => e.preventDefault()} className="window-cleaning-form">
              <h3 id="berakna-pris">Beräkna pris</h3>
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
                <label htmlFor="bagar">Antal fönsterbågar</label>
                <input
                  type="number"
                  id="bagar"
                  className={`form-control${bagar.status === "invalid" ? ` ${invalidClass}` : ""}`}
                  placeholder={includedBagar ? String(includedBagar) : "Ange antal"}
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={bagarInput}
                  onChange={(e) => setBagarInput(e.target.value)}
                  disabled={onlyBalcony}
                  aria-invalid={bagar.status === "invalid" || undefined}
                  aria-describedby={bagar.status === "invalid" ? "bagar-error" : undefined}
                />
                <FieldError id="bagar-error">
                  {bagar.status === "invalid" ? "Ange antalet fönsterbågar som ett helt tal." : null}
                </FieldError>
                <small className="form-text text-muted">
                  {`I priset ingår ${WINDOW_INCLUDED_BAGAR_PER_ROOM} bågar per rum`}
                  {includedBagar ? `, alltså ${includedBagar} för din bostad` : ""}
                  {`. Varje båge därutöver kostar ${WINDOW_EXTRA_BAGE_PRICES.plain} kr, eller ${WINDOW_EXTRA_BAGE_PRICES.sprojs} kr med spröjs, ${RUT_LABEL}. Vet du inte antalet? Lämna fältet tomt.`}
                </small>
                <div className="form-check mt-2">
                  <input type="checkbox" className="form-check-input" id="sprojs" checked={hasSprojs} onChange={(e) => setHasSprojs(e.target.checked)} disabled={onlyBalcony} />
                  <label className="form-check-label" htmlFor="sprojs">Fönstren har spröjs</label>
                </div>
              </div>

              <div className="form-group">
                <label>Gäller något av det här?</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="overhanging" checked={hasOverhanging} onChange={(e) => setHasOverhanging(e.target.checked)} />
                  <label className="form-check-label" htmlFor="overhanging">Överhängda fönster</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="hardToReach" checked={hasHardToReach} onChange={(e) => setHasHardToReach(e.target.checked)} />
                  <label className="form-check-label" htmlFor="hardToReach">Svåråtkomliga fönster</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="heavySoiling" checked={hasHeavySoiling} onChange={(e) => setHasHeavySoiling(e.target.checked)} />
                  <label className="form-check-label" htmlFor="heavySoiling">Kraftigt nedsmutsade fönster</label>
                </div>
                <small className="form-text text-muted">
                  Då lämnar vi ett pris i en offert i stället, efter att vi har sett fönstren.
                </small>
              </div>

              <div className="form-group">
                <label>Endast Balkong</label>
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="onlyBalcony" checked={onlyBalcony} onChange={(e) => { setOnlyBalcony(e.target.checked); if (e.target.checked) setRooms(""); }} />
                  <label className="form-check-label" htmlFor="onlyBalcony">{`Endast inglasad balkong (från ${WINDOW_BALCONY_PRICE} kr)`} <RutTag /></label>
                </div>
              </div>

              <DateTimeField date={date} inputRef={dateInputRef} conflict={flow.isConflict(date.dateTime)} />
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
              quoteNote={`För ${QUOTE_FROM_ROOMS} rum och kök eller mer än ${WINDOW_QUOTE_ABOVE_AREA} m² lämnar vi en offert. Skicka en förfrågan så återkommer vi.`}
            >
              <li><strong>Val:</strong> {selection}</li>
              <li><strong>Storlek:</strong> {onlyBalcony ? "–" : describeArea(area)}</li>
              <li>
                <strong>Fönsterbågar:</strong>{" "}
                {onlyBalcony
                  ? "–"
                  : bagar.status === "ok"
                    ? extraBagar > 0
                      ? `${bagar.value} (${extraBagar} utöver de ${includedBagar} som ingår, ${formatPrice(extraBagePrice)} ${RUT_LABEL})`
                      : `${bagar.value} (ingår i priset)`
                    : NOT_SET}
              </li>
              <li><strong>Tillägg:</strong> {addOns.join(", ") || "Inga"}</li>
              <li><strong>Önskat datum och tid:</strong> {describeDate(date)}</li>
              <li><strong>Preliminärt pris:</strong> {needsQuote ? "Offereras" : <RutPrice amount={totalPrice} />}</li>
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
