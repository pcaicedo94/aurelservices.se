import React, { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import QuoteModal from "../../components/Common/QuoteModal";
import Footer from "../../components/Layouts/Footer";
import Seo from "../../components/Common/Seo";

// Byggstädning (client Q74-Q77). Deliberately a short information page with a
// quote form and no booking system or calculator: the client asked for exactly
// that, because the scope of a construction clean has to be seen on site
// before it can be priced. No figure appears anywhere on this page.
//
// This is NOT /foretag/bodstadning, which is the cleaning of site huts and has
// its own rate per hut. The two pages link to each other instead of overlapping.
//
// The banner is reused from flyttstädning för företag: it shows final cleaning
// of an empty flat (window frames, cabinets inside), which is what slutstädning
// looks like. There is no byggstädning photo in public/images/banners yet.
const ConstructionCleaning = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <>
      <Seo route="/foretag/byggstadning" />

      <Navbar />

      <PageBanner
        pageTitle="Byggstädning"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Byggstädning"
        breadcrumbUrl="/"
        bgImage="/images/banners/flyttstadning-foretag.webp"
      />

      <div className="container ptb-50">
        <div className="row">
          <div className="col-lg-8">
            <h2>Byggstädning i Stockholm – efter nybyggnation, renovering och ombyggnation</h2>
            <p>
              Vi erbjuder professionell byggstädning efter nybyggnation, renovering och
              ombyggnation. Vi tar hand om byggdamm, smuts och rester efter arbetet och ser till
              att lokalerna är rena och redo för besiktning, överlämning eller inflyttning.
            </p>

            <h3>Under projektet eller när allt är klart</h3>
            <ul>
              <li>
                <strong>Byggstädning under pågående byggprojekt:</strong> löpande städning under
                arbetets gång, där vi tar bort damm, smuts, emballage och mindre materialrester och
                håller arbetsytorna renare och mer ordnade.
              </li>
              <li>
                <strong>Slutstädning efter avslutat byggprojekt:</strong> den avslutande och mer
                detaljerade städningen när bygget eller renoveringen är färdig. Vi tar bort fint
                damm och smuts från ytor, golv, fönster, karmar, skåp och sanitetsutrymmen så att
                lokalen är redo för besiktning, överlämning eller inflyttning.
              </li>
            </ul>
            <p>Vi utför båda delarna, var för sig eller i samma projekt.</p>

            <h3>Detta ingår normalt i vår byggstädning</h3>
            <ul>
              <li>Noggrann borttagning av byggdamm och fint damm från alla tillgängliga ytor.</li>
              <li>
                Dammsugning och avtorkning av lister, dörrar, dörrkarmar, fönsterbrädor och andra
                fasta detaljer.
              </li>
              <li>Fönsterputs samt rengöring av fönsterkarmar och bågar.</li>
              <li>Dammsugning och rengöring av golv, anpassad efter golvmaterial.</li>
              <li>Grundlig rengöring av kök, arbetsytor och fasta installationer.</li>
              <li>Rengöring av skåp, lådor och garderober, både utvändigt och invändigt.</li>
              <li>
                Rengöring av toaletter, badrum och sanitetsutrymmen, inklusive handfat, toalett,
                dusch och blandare.
              </li>
              <li>
                Avtorkning av eluttag, strömbrytare, element och andra fasta installationer där
                arbetet kan utföras på ett säkert sätt.
              </li>
              <li>
                Borttagning av etiketter, tejp och enklare skyddsmaterial där detta kan göras utan
                risk för skador på ytan.
              </li>
              <li>
                Borttagning av mindre mängder byggrester och emballage i samband med
                slutstädningen.
              </li>
              <li>
                Slutlig dammsugning och våttorkning så att lokalen lämnas ren och redo för
                besiktning, överlämning eller inflyttning.
              </li>
            </ul>

            <h3>Vilka anlitar oss?</h3>
            <p>
              Vi erbjuder byggstädning för både företag och privatpersoner i Stockholm och
              närområdet:
            </p>
            <ul>
              <li>Byggföretag och entreprenörer</li>
              <li>Fastighetsbolag och fastighetsägare</li>
              <li>Bostadsrättsföreningar (BRF)</li>
              <li>Företag och verksamheter som bygger om eller renoverar sina lokaler</li>
              <li>Privatpersoner i samband med renovering eller ombyggnation</li>
            </ul>

            <h3>Projektens storlek</h3>
            <p>
              Vi tar oss an både mindre och större uppdrag. Det kan vara allt från en lägenhet
              eller lokal efter renovering till större byggprojekt och fastigheter. Vid större
              projekt kan vi även anpassa bemanning och städning efter byggprojektets olika etapper
              och tidsplan.
            </p>

            <h3>Bra att veta</h3>
            <ul>
              <li>Tillgång till vatten och el behöver normalt finnas på arbetsplatsen.</li>
              <li>Större mängder byggavfall och grovsopor ingår inte.</li>
              <li>Arbete som kräver byggställning eller särskild höjdutrustning bedöms separat.</li>
              <li>Specialsanering och farligt avfall ingår inte i vanlig byggstädning.</li>
              <li>
                Bortforsling av större mängder byggavfall och grovt material, och borttagning av
                till exempel färg, cement, silikon och fogrester som kräver särskild behandling,
                ingår inte i en normal byggstädning om inget annat har avtalats.
              </li>
            </ul>

            <h3>Så får ni en offert</h3>
            <p>
              Byggstädning har ingen prislista. Omfattningen skiljer sig för mycket mellan
              projekten, så vi bokar ett kostnadsfritt platsbesök, går igenom lokalerna och
              tidsplanen på plats och lämnar därefter en offert. Priser till företag och
              bostadsrättsföreningar anges exklusive moms.
            </p>
            <p>
              Ska vi städa bodar, baracker och personalutrymmen på arbetsplatsen är det en egen
              tjänst: <Link href="/foretag/bodstadning">bodstädning och etableringsstädning</Link>.
              Behöver ni hjälp med själva bygg- eller renoveringsarbetet hittar ni det under{" "}
              <Link href="/foretag/byggtjanster">byggtjänster</Link>.
            </p>
          </div>

          <div className="col-lg-4">
            <div className="summary-frame">
              <h3>Begär offert</h3>
              <p>
                Berätta vad som ska städas och när bygget är klart, så återkommer vi med ett
                förslag och bokar ett kostnadsfritt platsbesök.
              </p>
              <button type="button" className="default-btn" onClick={() => setShowQuote(true)}>
                Begär offert
              </button>
              <p className="mt-3" style={{ fontSize: "13px", color: "#666" }}>
                Vill ni hellre prata direkt? <Link href="/kontakt">Kontakta oss</Link> så hör vi av
                oss.
              </p>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal
        open={showQuote}
        onClose={() => setShowQuote(false)}
        service="Byggstädning"
        addressPlaceholder="Ange adressen för byggprojektet"
      />

      <Footer />
    </>
  );
};

export default ConstructionCleaning;
