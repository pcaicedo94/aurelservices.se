import React from "react";
import Seo from "../components/Common/Seo";
import Link from "next/link";
import Script from "next/script";
import Navbar from "../components/Layouts/Navbar";
import Footer from "../components/Layouts/Footer";
import QuoteModal from "../components/Common/QuoteModal";
import { QUOTE_FIELDS } from "../config/quoteFields";
import s from "../styles/home.module.css";

// Home page in the glass + bento design. The shared look (ground, navbar,
// glass surfaces, type) is in styles/glass.css; the grids are in
// styles/home.module.css.

const CALCULATORS = [
  { href: "/tjanster/hemstadning", label: "Hemstädning" },
  { href: "/tjanster/storstadning", label: "Storstädning" },
  { href: "/tjanster/flyttstadning", label: "Flyttstädning" },
  { href: "/tjanster/fonsterputs", label: "Fönsterputs" },
];

// One short line per service. The long copy stays on each service page.
const SERVICES = [
  {
    key: "hem",
    tag: "Privat",
    title: "Hemstädning",
    text: "Regelbunden städning – kom hem till ett fräscht hem.",
    href: "/tjanster/hemstadning",
    img: "/images/banners/hemstadning.webp",
    size: "feature",
  },
  {
    key: "flytt",
    tag: "Privat",
    title: "Flyttstädning",
    text: "Grundligt i gamla eller nya bostaden.",
    href: "/tjanster/flyttstadning",
    img: "/images/banners/flyttstadning.webp",
    size: "tall",
  },
  {
    key: "stor",
    tag: "Privat",
    title: "Storstädning",
    text: "En riktig nystart, uppifrån och ner.",
    href: "/tjanster/storstadning",
    img: "/images/banners/storstadning.webp",
  },
  {
    key: "fonster",
    tag: "Privat",
    title: "Fönsterputs",
    text: "Rena rutor utan ränder.",
    href: "/tjanster/fonsterputs",
    img: "/images/banners/fonsterputs.webp",
  },
  {
    key: "kontor",
    tag: "Företag",
    title: "Kontorsstädning",
    text: "En ren arbetsplats som teamet trivs på.",
    href: "/foretag/kontorsstadning",
    img: "/images/banners/kontorsstadning.webp",
    size: "wide",
  },
  {
    key: "bygg",
    tag: "Företag",
    title: "Bygg- och bodstädning",
    text: "Grovstäd, etablering och slutstäd.",
    href: "/foretag/bodstadning",
    img: "/images/banners/bodstadning.webp",
    size: "wide",
  },
];

const STATS = [
  { value: "250+", label: "nöjda kunder" },
  { value: "200+", label: "städade hem" },
];

const PARTNERS = [
  { name: "Recab", src: "/images/partner/recab.jpeg" },
  { name: "Swerock", src: "/images/partner/swerock.jpeg" },
  { name: "Lambertsson", src: "/images/partner/lambertsson.jpeg" },
];

const Arrow = () => (
  <svg className={s.arrow} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 10h10M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Index = () => {
  const [showQuote, setShowQuote] = React.useState(false);

  return (
    <>
      <Seo route="/" />

      <Navbar />

      <main className={s.page}>

        {/* ---------- 1. Hero bento ---------- */}
        <section className={`${s.wrap} ${s.hero}`} aria-labelledby="hero-title">
          <div className={`${s.glass} ${s.heroMain}`}>
            {/* One H1 with both parts visible: the small line is the
                eyebrow, the large one the services. */}
            <h1 id="hero-title" className={s.h1}>
              <span className={s.eyebrow}>Städfirma i Stockholm</span>{" "}
              <span className={s.h1Main}>Hemstädning, flyttstädning och storstädning</span>
            </h1>
            <p className={s.lead}>
              Hem, kontor och förening. Räkna ut priset och boka direkt.
            </p>
            <div className={s.actions}>
              <Link href="/tjanster" className={s.btnPrimary}>
                Boka – se priset direkt <Arrow />
              </Link>
              <button type="button" className={s.btnGhost} onClick={() => setShowQuote(true)}>
                Begär offert
              </button>
            </div>
          </div>

          <div className={`${s.tile} ${s.heroPhoto}`}>
            <img src="/images/cover2.jpg" alt="Städat vardagsrum med blankt trägolv" />
            <span className={`${s.glassChip} ${s.photoChip}`}>
              <span className={s.dot} /> Hem · Kontor · BRF
            </span>
          </div>

          <div className={`${s.glass} ${s.statTile}`}>
            <span className={s.statValue}>18 år</span>
            <span className={s.statLabel}>i branschen</span>
          </div>

          <div className={`${s.glass} ${s.statTile} ${s.rutTile}`}>
            <span className={s.statValue}>RUT</span>
            <span className={s.statLabel}>avdraget direkt på fakturan</span>
          </div>

          <div className={`${s.glass} ${s.calcTile}`}>
            <p className={s.eyebrow}>Räkna ut ditt pris</p>
            <ul className={s.chips}>
              {CALCULATORS.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className={s.chip}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- 2. Services bento ---------- */}
        <section className={s.wrap} aria-labelledby="services-title">
          <header className={s.sectionHead}>
            <p className={s.eyebrow}>Tjänster</p>
            <h2 id="services-title" className={s.h2}>Vad behöver du hjälp med?</h2>
          </header>

          <ul className={s.servicesGrid}>
            {SERVICES.map((svc) => (
              <li key={svc.key} className={`${s.tile} ${s.service} ${svc.size ? s[svc.size] : ""}`}>
                <img src={svc.img} alt="" loading="lazy" />
                <Link href={svc.href} className={`${s.glass} ${s.serviceCard}`}>
                  <span className={s.tag}>{svc.tag}</span>
                  <span className={s.serviceTitle}>{svc.title}</span>
                  <span className={s.serviceText}>{svc.text}</span>
                  <span className={s.more}>
                    Läs mer <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- 3. Trust bento ---------- */}
        <section className={s.wrap} aria-labelledby="trust-title">
          <header className={s.sectionHead}>
            <p className={s.eyebrow}>Om oss</p>
            <h2 id="trust-title" className={s.h2}>18 år av rena resultat</h2>
          </header>

          <div className={s.trustGrid}>
            <div className={`${s.glass} ${s.about}`}>
              <p className={s.body}>
                Komplett städservice för företag och privatpersoner i Storstockholm – stora som
                små uppdrag, med samma noggrannhet.
              </p>
              <ul className={s.values}>
                <li>Flexibilitet</li>
                <li>Kvalitet</li>
                <li>Service</li>
              </ul>
              <Link href="/om-oss" className={s.textLink}>
                Mer om oss <Arrow />
              </Link>
            </div>

            {STATS.map((st) => (
              <div key={st.label} className={`${s.glass} ${s.statTile}`}>
                <span className={s.statValue}>{st.value}</span>
                <span className={s.statLabel}>{st.label}</span>
              </div>
            ))}

            {/* The clients get a full-width tile of their own: the client
                asked for them to stand out more than one bento cell. */}
            <div className={`${s.glass} ${s.partners}`}>
              <div className={s.partnersHead}>
                <p className={s.eyebrow}>Kunder som litar på oss</p>
                <h3 className={s.partnersTitle}>Tre stora byggföretag anlitar oss</h3>
              </div>
              <ul className={s.logos}>
                {PARTNERS.map((p) => (
                  <li key={p.name}>
                    <img src={p.src} alt={p.name} loading="lazy" />
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${s.glass} ${s.reviews}`}>
              <p className={s.eyebrow}>Omdömen</p>
              <div id="shapo-widget-72759a1d81b0785a4632"></div>
              <Script id="shapo-embed-js" src="https://cdn.shapo.io/js/embed.js" strategy="lazyOnload" />
            </div>
          </div>
        </section>

        {/* ---------- 4. CTA ---------- */}
        <section className={`${s.wrap} ${s.ctaWrap}`} aria-labelledby="cta-title">
          <div className={`${s.tile} ${s.cta}`}>
            <img src="/images/peaceful.jpg" alt="" loading="lazy" />
            <div className={`${s.glass} ${s.ctaCard}`}>
              <h2 id="cta-title" className={s.h2}>Redo för ett renare hem?</h2>
              <p className={s.body}>Boka på webben eller ring oss direkt.</p>
              <div className={s.actions}>
                <Link href="/tjanster" className={s.btnPrimary}>
                  Boka städning <Arrow />
                </Link>
                <a href="tel:+46760450228" className={s.btnGhost}>
                  076-045 02 28
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Städning i Stockholm"
        fields={QUOTE_FIELDS["/"]}
      />
    </>
  );
};

export default Index;
