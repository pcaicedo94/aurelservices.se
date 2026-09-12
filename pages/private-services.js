import React from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

// No prices here on purpose: each service page shows its own calculator until
// the single price source (config/prices.json) is wired in.
const SERVICES = [
  {
    href: "/homecleaning",
    title: "Hemstädning",
    text: "Regelbunden städning varje vecka, varannan vecka eller en gång i månaden – eller vid ett enstaka tillfälle. Vi tar hand om golv, kök, badrum och ytor så att du får mer tid över.",
  },
  {
    href: "/deepcleaning",
    title: "Storstädning",
    text: "En grundlig rengöring av hela hemmet, från golv till tak. Perfekt när bostaden behöver en nystart eller när du inte hinner göra det själv.",
  },
  {
    href: "/movecleaning",
    title: "Flyttstädning",
    text: "Noggrann städning av hela bostaden, som minskar risken för anmärkningar vid besiktningen. Fönsterputs ingår, utom för spröjsade fönster.",
  },
  {
    href: "/windowcleaning",
    title: "Fönsterputsning",
    text: "Rena fönster utan ränder, på både in- och utsidan. Priset utgår från antal rum och du ser det direkt i formuläret.",
  },
];

const PrivateServices = () => {
  return (
    <>
      <Head>
        <title>{"Privata tjänster – Aurel Städ & Allservice"}</title>
      </Head>

      <Navbar />

      <PageBanner
        pageTitle="Privata tjänster"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Privata tjänster"
        breadcrumbUrl="/"
        bgImage="/images/banners/hemstadning.webp"
      />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Städning för privatpersoner i Stockholm</h2>
            <p>
              Aurel Städ &amp; Allservice hjälper dig att hålla hemmet rent – med regelbunden
              hemstädning, en grundlig storstädning, flyttstädning inför besiktning eller
              fönsterputsning. Välj den tjänst som passar dig, så får du ett pris direkt i
              formuläret på tjänstens sida.
            </p>
          </div>
        </div>

        <div className="row" style={{ marginTop: "30px" }}>
          {SERVICES.map((service) => (
            <div className="col-lg-3 col-md-6" key={service.href} style={{ marginBottom: "30px" }}>
              <div className="info-card d-flex flex-column">
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginTop: 0 }}>{service.title}</h3>
                <p>{service.text}</p>
                <div className="mt-auto">
                  <Link href={service.href} className="default-btn">
                    Läs mer och se pris
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          <div className="col-lg-7" style={{ marginBottom: "30px" }}>
            <div className="brand-card">
              <h4>RUT-avdrag direkt på fakturan</h4>
              <p>
                Som privatperson kan du få upp till 50 procent avdrag på arbetskostnaden för
                hemstädning, storstädning, flyttstädning och fönsterputsning. Vi drar av RUT
                direkt på fakturan och sköter ansökan hos Skatteverket, så du betalar bara din
                del. Priserna på webbplatsen visas inklusive moms och efter RUT-avdrag.
              </p>
            </div>
          </div>
          <div className="col-lg-5" style={{ marginBottom: "30px" }}>
            <div className="info-card">
              <h4>Fler tjänster för hemmet</h4>
              <p>
                Vi hjälper också till med <Link href="/gardening">trädgårdsskötsel</Link>,{" "}
                <Link href="/movinghelp">flytthjälp</Link> och{" "}
                <Link href="/carpetwashing">mattvätt</Link>. Undrar du något? Läs våra{" "}
                <Link href="/faq">vanliga frågor</Link> eller{" "}
                <Link href="/contact">kontakta oss</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PrivateServices;
