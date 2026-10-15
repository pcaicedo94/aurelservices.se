import React from "react";
import Link from "next/link";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

// Client Q94-Q99: the only answer given was "I prefer to handle hiring
// internally, but of course people can send their CVs"; Q95-Q99 (travel time,
// benefits, roles and requirements, working hours, selection process) were
// left blank. So this page may not state a collective agreement, a salary,
// insurance, pension, training or any other term of employment: none of that
// is confirmed and publishing it would be inventing working conditions.
//
// What the earlier version promised and has been removed:
//   - "trygga villkor med kollektivavtal och försäkring"
//   - "Anställning enligt kollektivavtal"
//   - "Trygg arbetsmiljö med fullständig försäkring"
//   - "Möjlighet till utveckling och utbildning"
//   - "Flexibla arbetstider"
//
// What is left is what we do know from the client's own answers: what the work
// consists of (the services on the site), where it is done (Stockholm), that
// applications are read internally, and where to send them.
const Careers = () => {
  return (
    <>
      <Seo route="/karriar" />

      <Navbar />
      <PageBanner
        pageTitle="Jobba hos oss"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Jobba hos oss"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <div className="ptb-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="about-content">
                <h2>Skicka in din ansökan</h2>
                <p>
                  Aurel Städ &amp; Allservice AB är ett litet företag i Skärholmen som arbetar i
                  hela Stockholm. Vi utlyser inga tjänster här på sidan – rekryteringen sköter vi
                  själva, internt – men du är alltid välkommen att skicka in ditt CV. Vi läser
                  alla ansökningar och hör av oss när vi har ett uppdrag som passar.
                </p>

                <h3>Vad arbetet går ut på</h3>
                <p>
                  Arbetet är praktiskt och utförs ute hos kund, på olika adresser i Stockholm med
                  omnejd. Det handlar om de tjänster vi utför varje dag:
                </p>
                <ul>
                  <li>Hemstädning, storstädning och flyttstädning hos privatpersoner</li>
                  <li>Kontorsstädning, trappstädning och lokalvård hos företag och BRF</li>
                  <li>Fönsterputsning och golvvård</li>
                  <li>Byggstädning och bodstädning på byggarbetsplatser</li>
                  <li>Trädgårdsskötsel, snöröjning, flytthjälp och mattvätt</li>
                </ul>
                <p>
                  Man arbetar ofta självständigt hemma hos eller i lokalerna hos en kund, så
                  noggrannhet, punktlighet och ett trevligt bemötande betyder mycket hos oss.
                </p>

                <h3>Vad vi vill att ansökan innehåller</h3>
                <ul>
                  <li>CV med dina tidigare arbeten och hur vi når dig – telefon och e-post</li>
                  <li>Några rader om varför du söker dig till just den här typen av arbete</li>
                  <li>Vilka språk du talar</li>
                  <li>Om du har körkort (B) och tillgång till bil</li>
                  <li>Vilka områden i Stockholm du kan arbeta i, och från när du är tillgänglig</li>
                  <li>Referenser, om du har några</li>
                </ul>

                <h3>Så går det till</h3>
                <p>
                  Skicka din ansökan till{" "}
                  <a href="mailto:rekrytering@aurelservice.se">rekrytering@aurelservice.se</a>. Vi
                  sparar ansökan och kontaktar dig om vi ser att det finns ett behov som matchar.
                  Får du inget svar direkt betyder det alltså inte att ansökan är bortsorterad.
                </p>
                <p>
                  Villkoren för en anställning – tjänstens omfattning, arbetstider och ersättning –
                  går vi igenom i den personliga kontakten, inte här på sidan. Har du en fråga om
                  arbetet innan du söker är du välkommen att{" "}
                  <Link href="/kontakt">kontakta oss</Link>.
                </p>
                <p>
                  Hur vi hanterar personuppgifterna i din ansökan beskriver vi i vår{" "}
                  <Link href="/integritetspolicy">integritetspolicy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Careers;
