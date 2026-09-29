import React from "react";
import Link from "next/link";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import Footer from "../../components/Layouts/Footer";
import Seo from "../../components/Common/Seo";

// Business index. Only the pages that live under /foretag/ are listed, and the
// copy is taken from each service's own page: nothing is invented here.
// No prices: business work is always agreed by quote (client Q26-Q29), so the
// cards link to the page instead of showing a figure.
const SERVICES = [
  {
    href: "/foretag/kontorsstadning",
    title: "Kontorsstädning",
    text: "Lokalvård av arbetsplatser, mötesrum, pentry, toaletter och gemensamma ytor enligt överenskommet schema. Räkna ut en uppskattad kostnad direkt på sidan.",
    cta: "Läs mer och uppskatta kostnad",
  },
  {
    href: "/foretag/trappstadning",
    title: "Trappstädning",
    text: "Återkommande städning av trapphus, entré, hiss och gemensamma utrymmen för bostadsrättsföreningar och fastighetsägare.",
  },
  {
    href: "/foretag/bodstadning",
    title: "Bodstädning och byggstädning",
    text: "Etableringsstädning, löpande städning av bodar och personalutrymmen samt slutstädning inför överlämning. Uppskatta kostnaden utifrån antal bodar och städfrekvens.",
    cta: "Läs mer och uppskatta kostnad",
  },
  {
    href: "/foretag/flyttstadning",
    title: "Flyttstädning av lokal",
    text: "Flyttstädning av kontor och verksamhetslokaler inför överlämning och besiktning, anpassad efter lokalens storlek och skick.",
  },
  {
    href: "/foretag/fonsterputs",
    title: "Fönsterputsning",
    text: "Putsning av fönster i kontor, butik och entré, med ett putsintervall anpassat efter lokalerna och verksamhetens behov.",
  },
  {
    href: "/foretag/golvvard",
    title: "Golvvård",
    text: "Maskinell rengöring, polering, ytbehandling och underhåll som förlänger golvets livslängd och återställer dess utseende.",
  },
  {
    href: "/foretag/byggtjanster",
    title: "Byggtjänster",
    text: "Mindre byggarbeten och renoveringar, reparationer, snickeri och måleri – utfört med fokus på kvalitet och ett hållbart slutresultat.",
  },
];

const BusinessServices = () => {
  return (
    <>
      <Seo route="/foretag" />

      <Navbar />

      <PageBanner
        pageTitle="Tjänster för företag och BRF"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Företag och BRF"
        breadcrumbUrl="/"
        bgImage="/images/banners/kontorsstadning.webp"
        bgPosition="center 30%"
      />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Städning och service för företag och bostadsrättsföreningar i Stockholm</h2>
            <p>
              Aurel Städ &amp; Allservice arbetar åt företag, bostadsrättsföreningar,
              fastighetsägare och entreprenörer i hela Stockholm – med kontorsstädning,
              trappstädning, byggstädning, fönsterputsning, golvvård och byggtjänster. Vi lägger
              upp arbetet efter era lokaler och er verksamhet, i det intervall som passar er.
            </p>
            <p>
              Ska ni städa hemma i stället? Se våra{" "}
              <Link href="/tjanster">tjänster för privatpersoner</Link>, där du får ett pris
              direkt i formuläret.
            </p>
          </div>
        </div>

        <div className="row" style={{ marginTop: "30px" }}>
          {SERVICES.map((service) => (
            <div className="col-lg-4 col-md-6" key={service.href} style={{ marginBottom: "30px" }}>
              <div className="info-card d-flex flex-column">
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginTop: 0 }}>{service.title}</h3>
                <p>{service.text}</p>
                <div className="mt-auto">
                  <Link href={service.href} className="default-btn">
                    {service.cta || "Läs mer och begär offert"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          <div className="col-lg-7" style={{ marginBottom: "30px" }}>
            <div className="brand-card">
              <h4>Alltid offert, alltid exklusive moms</h4>
              <p>
                Uppdrag åt företag och bostadsrättsföreningar prissätts alltid genom offert:
                omfattningen skiljer sig från lokal till lokal. Alla belopp vi visar för
                företagstjänster är exklusive moms och en uppskattning – det slutliga priset
                kommer i offerten. RUT-avdrag gäller bara privatpersoner och ingår därför inte
                här.
              </p>
            </div>
          </div>
          <div className="col-lg-5" style={{ marginBottom: "30px" }}>
            <div className="info-card">
              <h4>Så får ni en offert</h4>
              <p>
                Berätta vad ni behöver hjälp med, så bokar vi ett kostnadsfritt platsbesök och
                återkommer med en skräddarsydd offert. Undrar ni något? Läs våra{" "}
                <Link href="/vanliga-fragor">vanliga frågor</Link> eller{" "}
                <Link href="/kontakt">kontakta oss</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BusinessServices;
