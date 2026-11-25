// The offer page. One customer, one link, one contract.
//
// It renders server side on every request (getServerSideProps) rather than
// being built: the page must show the offer's state as it is right now, and
// nothing about an offer may ever reach a CDN or a search engine. Hence
// no-store and noindex below.
//
// The browser is never given the token hash, the offer id or any column the
// screen does not display. What it gets is the frozen snapshot — the offer as
// it was priced and sent — plus the state and the declarations required now.
//
// The snapshot contract, which the office panel will write (step 4):
//   {
//     customer: { name, address, postnummer },
//     service:  { label, description },
//     lines:    [ { label, amount, note } ],   // kr, incl. VAT
//     arbetskostnad_incl_vat, rut_deduction,
//     resetillagg_incl_vat, total_to_pay,      // kr
//     serviceAt: ISO string | null,
//     introDiscount: { amount, text } | null
//   }
// Rendering stays tolerant of missing fields: a half-written snapshot must
// show a gap, never a crash on the customer's screen.
import React from "react";
import Head from "next/head";
import Navbar from "../../components/Layouts/Navbar";
import Footer from "../../components/Layouts/Footer";
import { createOfferStore } from "../../utils/offerStore";
import {
  ACCEPT_BUTTON_LABEL,
  WITHDRAW_ENTRY_LABEL,
  ANGERFRIST_DAYS,
  angerfristEndsAt,
  offerViewState,
  parseOfferToken,
  requiredConsents,
} from "../../utils/offerRules";
import { formatStockholm, formatStockholmDate } from "../../utils/timeZone";

const kr = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${value.toLocaleString("sv-SE")} kr`
    : "—";

const STATE_TEXT = {
  expired: {
    title: "Offerten har gått ut",
    body: "Den här offerten gäller inte längre. Hör av dig så skickar vi en ny.",
  },
  cancelled: {
    title: "Offerten är inte längre aktuell",
    body: "Kontakta oss gärna om du har frågor.",
  },
  unavailable: {
    title: "Länken är inte giltig",
    body: "Kontrollera att du öppnade hela länken från mejlet, eller kontakta oss så skickar vi en ny.",
  },
};

/* ------------------------------- the screen ------------------------------- */

function PriceTable({ snapshot }) {
  const lines = Array.isArray(snapshot.lines) ? snapshot.lines : [];

  return (
    <table className="table" style={{ marginBottom: 0 }}>
      <tbody>
        {lines.map((line, index) => (
          <tr key={index}>
            <td>
              {line.label}
              {line.note ? (
                <div style={{ fontSize: 13, color: "#6c757d" }}>{line.note}</div>
              ) : null}
            </td>
            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{kr(line.amount)}</td>
          </tr>
        ))}

        <tr>
          <td>Arbetskostnad inkl. moms</td>
          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            {kr(snapshot.arbetskostnad_incl_vat)}
          </td>
        </tr>

        {/* Shown as its own line even when it is zero. The customer is
            entitled to see what is and is not charged for travel. */}
        <tr>
          <td>
            Resetillägg
            <div style={{ fontSize: 13, color: "#6c757d" }}>
              Fast avgift per besök efter postnummer. Ingen kilometerdebitering.
            </div>
          </td>
          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            {kr(snapshot.resetillagg_incl_vat ?? 0)}
          </td>
        </tr>

        {snapshot.rut_deduction ? (
          <tr>
            <td>
              RUT-avdrag
              <div style={{ fontSize: 13, color: "#6c757d" }}>
                Dras av direkt på fakturan. Gäller endast arbetskostnaden.
              </div>
            </td>
            <td style={{ textAlign: "right", whiteSpace: "nowrap", color: "#2d9070" }}>
              −{kr(snapshot.rut_deduction)}
            </td>
          </tr>
        ) : null}

        <tr>
          <td style={{ fontWeight: 700, borderTop: "2px solid #dee2e6" }}>Att betala</td>
          <td
            style={{
              textAlign: "right",
              whiteSpace: "nowrap",
              fontWeight: 700,
              fontSize: 20,
              color: "#2d9070",
              borderTop: "2px solid #dee2e6",
            }}
          >
            {kr(snapshot.total_to_pay)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Box({ children, tone = "#f8f9fa" }) {
  return (
    <div
      style={{
        background: tone,
        border: "1px solid #e9ecef",
        borderRadius: 8,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function Consent({ name, checked, onChange, children }) {
  return (
    <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(name, event.target.checked)}
        style={{ marginTop: 5, width: 18, height: 18, flexShrink: 0 }}
      />
      <span style={{ fontSize: 15, lineHeight: 1.5 }}>{children}</span>
    </label>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function OfferPage({ token, state, snapshot, required, angerfristEnds, serviceWhen }) {
  const [given, setGiven] = React.useState({
    info: false,
    start: false,
    lapse: false,
    discount: false,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(state === "accepted");

  const tick = (key, value) => setGiven((prev) => ({ ...prev, [key]: value }));

  const allTicked = Object.keys(required).every((key) => !required[key] || given[key]);

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/offer-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          consentInfo: given.info,
          consentStart: given.start,
          consentLapse: given.lapse,
          consentDiscount: given.discount,
          // Sent back so the record holds the words that were actually on the
          // button this customer pressed, not the words the code has today.
          buttonLabel: ACCEPT_BUTTON_LABEL,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.message || "Något gick fel. Försök igen.");
        return;
      }
      setDone(true);
    } catch {
      setError("Vi kunde inte nå servern. Kontrollera din uppkoppling och försök igen.");
    } finally {
      setBusy(false);
    }
  }

  const head = (
    <Head>
      <title>Din offert – Aurel Städ &amp; Allservice</title>
      {/* A private document. It must not be indexed, cached or followed. */}
      <meta name="robots" content="noindex, nofollow, noarchive" />
    </Head>
  );

  if (state !== "open" && state !== "accepted") {
    const text = STATE_TEXT[state] || STATE_TEXT.unavailable;
    return (
      <>
        {head}
        <Navbar />
        <div className="container" style={{ padding: "80px 15px", maxWidth: 720 }}>
          <h2>{text.title}</h2>
          <p style={{ fontSize: 17 }}>{text.body}</p>
          <p>
            <a href="/kontakt">Kontakta oss</a> eller ring 076-045 02 28.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {head}
      <Navbar />

      <div className="container" style={{ padding: "60px 15px", maxWidth: 760 }}>
        {done ? (
          <Box tone="#eaf7f1">
            <h3 style={{ marginTop: 0 }}>Tack! Din beställning är registrerad.</h3>
            <p style={{ marginBottom: 8 }}>
              Vi skickar en bekräftelse till din e-post. Spara den — den är ditt kvitto på avtalet.
            </p>
            <p style={{ marginBottom: 0 }}>
              Du har <strong>{ANGERFRIST_DAYS} dagar</strong> på dig att ångra dig
              {angerfristEnds ? <>, till och med <strong>{angerfristEnds}</strong></> : null}.{" "}
              <a href={`/angra/${token}`}>{WITHDRAW_ENTRY_LABEL}</a>
            </p>
          </Box>
        ) : null}

        <h2 style={{ marginBottom: 4 }}>Din offert</h2>
        {snapshot.customer?.name ? (
          <p style={{ color: "#6c757d", marginBottom: 32 }}>För {snapshot.customer.name}</p>
        ) : null}

        <Box>
          <h4 style={{ marginTop: 0 }}>{snapshot.service?.label || "Städtjänst"}</h4>
          {snapshot.service?.description ? <p>{snapshot.service.description}</p> : null}
          {snapshot.customer?.address ? (
            <p style={{ marginBottom: 0 }}>
              <strong>Adress:</strong> {snapshot.customer.address}
              {snapshot.customer.postnummer ? `, ${snapshot.customer.postnummer}` : ""}
            </p>
          ) : null}
          {serviceWhen ? (
            <p style={{ marginBottom: 0 }}>
              <strong>Tid:</strong> {serviceWhen}
            </p>
          ) : null}
        </Box>

        <Box>
          <h4 style={{ marginTop: 0 }}>Pris</h4>
          <PriceTable snapshot={snapshot} />
          <p style={{ fontSize: 13, color: "#6c757d", marginTop: 16, marginBottom: 0 }}>
            Alla priser är inklusive moms. Tillkommer inget utöver det som står här.
          </p>
        </Box>

        {/* The withdrawal information has to be given BEFORE the order is
            placed (2 kap. 2 § 1 st 10 distansavtalslagen), so it sits above
            the boxes and the button, not behind a link. */}
        <Box tone="#fffdf5">
          <h4 style={{ marginTop: 0 }}>Din ångerrätt</h4>
          <p>
            Du har rätt att ångra det här avtalet inom <strong>{ANGERFRIST_DAYS} dagar</strong>, utan
            att ange något skäl. Fristen börjar dagen efter att du beställer
            {angerfristEnds ? <> och löper till och med <strong>{angerfristEnds}</strong></> : null}.
          </p>
          <p style={{ marginBottom: 0 }}>
            Du ångrar dig genom att höra av dig till oss — enklast via länken du får i
            bekräftelsemejlet. Vi skickar ett kvitto på att vi tagit emot din ångerförklaring.
          </p>
        </Box>

        <Box>
          <h4 style={{ marginTop: 0 }}>Innan du beställer</h4>

          <Consent name="info" checked={given.info} onChange={tick}>
            Jag har läst informationen om ångerrätten ovan.
          </Consent>

          {required.start ? (
            <>
              {/* Both halves of 2 kap. 11 § 1. Either one alone leaves the
                  right alive, so they are two boxes and both are required. */}
              <Consent name="start" checked={given.start} onChange={tick}>
                Jag begär uttryckligen att arbetet påbörjas redan under ångerfristen.
              </Consent>
              <Consent name="lapse" checked={given.lapse} onChange={tick}>
                Jag förstår att min ångerrätt upphör när tjänsten är helt utförd, och att jag då ska
                betala hela priset.
              </Consent>
            </>
          ) : null}

          {required.discount ? (
            <Consent name="discount" checked={given.discount} onChange={tick}>
              {snapshot.introDiscount?.text ||
                "Jag godkänner uttryckligen villkoret om introduktionsrabatten."}
            </Consent>
          ) : null}
        </Box>

        {error ? (
          <div
            role="alert"
            style={{
              background: "#fdecea",
              border: "1px solid #f5c6cb",
              borderRadius: 8,
              padding: "14px 18px",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        ) : null}

        {/* C-249/21 Fuhrmann-2: the words on this button are what decide
            whether the consumer is bound to pay. They are a constant in
            utils/offerRules.js, stored verbatim with every acceptance, and
            pinned by the tests. Do not reword it here. */}
        <button
          type="button"
          className="default-btn"
          disabled={!allTicked || busy || done}
          onClick={accept}
          style={{
            width: "100%",
            padding: "16px 24px",
            fontSize: 17,
            opacity: !allTicked || busy || done ? 0.5 : 1,
            cursor: !allTicked || busy || done ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Skickar…" : done ? "Beställd" : ACCEPT_BUTTON_LABEL}
        </button>

        <p style={{ fontSize: 13, color: "#6c757d", marginTop: 16 }}>
          Genom att klicka ingår du ett avtal med Aurel Städ &amp; Allservice AB. Se våra{" "}
          <a href="/allmanna-villkor">allmänna villkor</a>.
        </p>
      </div>

      <Footer />
    </>
  );
}

/* ------------------------------ server side ------------------------------ */

export async function getServerSideProps({ params, res }) {
  // Never cached anywhere: not by the browser, not by Vercel's CDN, not by a
  // proxy on the customer's network.
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  const raw = String(params?.token || "");
  const token = parseOfferToken(raw);

  const gone = {
    props: { token: raw, state: "unavailable", snapshot: {}, required: {}, angerfristEnds: null, serviceWhen: null },
  };

  if (!token) return gone;

  let offer = null;
  try {
    offer = await createOfferStore().findByToken(token);
  } catch (error) {
    // A database that cannot be reached must not look like an invalid link:
    // the customer would conclude the offer is dead and give up.
    console.error("Offer page lookup failed:", error?.message || error);
    throw error;
  }

  if (!offer) return gone;

  const now = new Date();
  const state = offerViewState(offer, now);

  if (state !== "open" && state !== "accepted") {
    return { props: { ...gone.props, state } };
  }

  const required = requiredConsents({
    serviceAt: offer.service_at,
    contractAt: now,
    hasIntroDiscount: Boolean(offer.requires_discount_consent),
  });

  // Shown to someone who has not accepted yet, this is "if you order now".
  // The endpoint recomputes it at the moment of acceptance, so a page left
  // open overnight cannot freeze yesterday's deadline into the record.
  const ends = angerfristEndsAt(now);

  return {
    props: {
      token: raw,
      state,
      snapshot: offer.snapshot || {},
      required,
      angerfristEnds: ends ? formatStockholmDate(ends) : null,
      serviceWhen: offer.service_at
        ? formatStockholm(new Date(offer.service_at))
        : null,
    },
  };
}
