import React from "react";
import Link from "next/link";
import LineIcon from "../Common/LineIcon";

// Om oss — the client's new text from Textosweb.docx, point 17 (2026-11-26),
// word for word. The photo is a real one of the team (not AI-made), so it
// stays; the AI illustrations elsewhere on the page were replaced by icons
// (point 16).
const HISTORY = [
  {
    year: "2007",
    text: "Vår resa började 2007 under namnet Xabia AB.",
  },
  {
    year: "2012",
    text: "År 2012 tog vi nästa steg och bytte namn till Aurel Städ, med en tydligare inriktning på professionella städtjänster.",
  },
  {
    year: "2020",
    text: "År 2020 inleddes ett nytt kapitel när nästa generation tog en större roll i företagets fortsatta utveckling. Med nya idéer och ambitioner började vi bredda verksamheten, samtidigt som vi bevarade den erfarenhet och de värderingar som byggts upp genom åren.",
  },
  {
    year: "2025",
    text: "Under 2025 bytte vi namn till Aurel Städ & Allservice AB. Namnbytet speglar vår utveckling och vårt mål att kunna hjälpa kunderna med mer än enbart städning.",
  },
  {
    year: "I dag",
    text: "I dag erbjuder vi ett brett utbud av tjänster och fortsätter att utvecklas utifrån våra kunders behov.",
  },
];

const VALUES = [
  {
    icon: "flex",
    title: "Flexibilitet",
    text: "Vi förstår att varje kund och uppdrag har olika förutsättningar. Därför anpassar vi våra tjänster, arbetstider och lösningar efter kundens behov.",
  },
  {
    icon: "quality",
    title: "Kvalitet",
    text: "Vi tror på noggrant utfört arbete, tydliga rutiner och ett långsiktigt ansvar för de tjänster vi levererar.",
  },
  {
    icon: "service",
    title: "Service",
    text: "För oss handlar god service om mer än själva arbetet. Det handlar också om tillgänglighet, tydlig kommunikation och att bygga relationer som håller över tid.",
  },
];

const AboutUsContent = () => (
  <div className="about-section ptb-100 about-v2">
    <div className="container">
      <div className="row align-items-center g-4">
        <div className="col-lg-6">
          <div className="about-image">
            <img src="/images/aurel3.jpg" alt="Medarbetare från Aurel putsar en spegel i ett hem" />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="about-content">
            <h2>Om Aurel Städ &amp; Allservice AB</h2>
            <p className="svc-subheading">Ett familjeföretag med erfarenhet sedan 2007</p>
            <p>
              Aurel Städ &amp; Allservice AB är ett familjeföretag med rötter tillbaka till 2007. Det
              som började som ett företag med fokus på städning har genom åren utvecklats till en
              verksamhet som erbjuder ett bredare utbud av tjänster för privatpersoner, företag och
              bostadsrättsföreningar.
            </p>
            <p>
              Med Stockholm som utgångspunkt hjälper vi våra kunder med allt från regelbunden städning
              och fastighetsservice till mer omfattande uppdrag inom bygg och etablering.
            </p>
            <p>
              Trots att verksamheten har vuxit har vi behållit det som alltid varit viktigt för oss:
              personlig service, nära kundrelationer och ett genuint engagemang i varje uppdrag.
            </p>
          </div>
        </div>
      </div>

      <section className="svc-block about-history">
        <h2 className="svc-block-title">Vår historia</h2>
        <ol className="about-timeline">
          {HISTORY.map((step) => (
            <li key={step.year} className="glass-panel">
              <span className="about-year">{step.year}</span>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="svc-block">
        <h2 className="svc-block-title">Flexibilitet, kvalitet och service</h2>
        <p className="svc-block-intro">
          Tre ledord har följt oss genom åren och ligger fortfarande till grund för hur vi arbetar.
        </p>
        <div className="about-values">
          {VALUES.map((value) => (
            <article key={value.title} className="info-card about-value">
              <span className="about-icon">
                <LineIcon name={value.icon} />
              </span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="svc-grid svc-block">
        <article className="info-card about-value">
          <span className="about-icon">
            <LineIcon name="handshake" />
          </span>
          <h3>En trygg och långsiktig samarbetspartner</h3>
          <p>
            Vi är stolta över de långvariga kundrelationer vi har byggt upp genom åren. Flera av våra
            företagskunder har valt att samarbeta med oss under lång tid, något vi ser som ett viktigt
            förtroende.
          </p>
          <p>
            Vi arbetar med både mindre och större uppdrag och lägger stor vikt vid att vara en
            pålitlig partner som är enkel att samarbeta med.
          </p>
          <p>
            Aurel Städ &amp; Allservice AB har kollektivavtal och ansvarsförsäkring. För oss är det en
            självklar del av att bedriva en seriös verksamhet och skapa trygghet för både våra
            medarbetare och kunder.
          </p>
        </article>
        <article className="info-card about-value">
          <span className="about-icon">
            <LineIcon name="people" />
          </span>
          <h3>Våra medarbetare gör skillnaden</h3>
          <p>
            Bakom varje väl utfört uppdrag finns människor som tar ansvar och gör sitt bästa varje
            dag.
          </p>
          <p>
            Vi värdesätter våra medarbetares erfarenhet, engagemang och arbetsmiljö. Vi tror att
            respekt, god kommunikation och rättvisa arbetsvillkor är viktiga förutsättningar för att
            kunna leverera kvalitet över tid.
          </p>
          <p>
            Som familjeföretag vill vi skapa en arbetsplats där människor känner sig uppskattade och
            där alla bidrar till företagets utveckling.
          </p>
        </article>
      </div>

      <section className="brand-card svc-cta svc-block">
        <div>
          <h2>Vi fortsätter att utvecklas</h2>
          <p>
            Vår ambition är inte att vara störst, utan att vara en samarbetspartner som våra kunder
            kan lita på. Vi vill fortsätta växa på ett hållbart sätt, utveckla våra tjänster och
            bygga långsiktiga relationer med både nya och befintliga kunder. Samtidigt ska vi behålla
            det personliga engagemang som har präglat Aurel sedan starten.
          </p>
          <p>
            <strong>Lär känna oss.</strong> Behöver du hjälp med städning, fastighetsservice eller
            någon av våra övriga tjänster? Vi berättar gärna mer om hur vi arbetar och hur vi kan
            hjälpa just dig eller din verksamhet.
          </p>
        </div>
        <Link href="/kontakt" className="default-btn svc-cta-button">
          Kontakta oss
        </Link>
      </section>
    </div>
  </div>
);

export default AboutUsContent;
