import React from "react";
import Link from "next/link";

// Sources: Prislista 2026 (payment terms, notice period, materials, soiling
// surcharge) and the service copy in "Servicios privados". Every
// [ATT BEKRÄFTA: …] is unconfirmed by the client and must be resolved before
// launch.
const TermsConditionContent = () => {
  return (
    <div className="privacy-policy ptb-100">
      <div className="container">
        <div className="single-privacy">
          <h2 className="mt-0">Allmänna villkor för privatpersoner</h2>
          <p>
            De här villkoren gäller när du som privatperson köper städtjänster av Aurel Städ &amp;
            Allservice AB, organisationsnummer 556725-2340{" "}
            <mark>[ATT BEKRÄFTA: organisationsnummer]</mark>. För företag och
            bostadsrättsföreningar gäller i första hand den offert eller det avtal som vi har kommit
            överens om. <mark>[ATT BEKRÄFTA: om villkoren även ska gälla företagskunder]</mark>
          </p>
          <p>
            Som konsument har du alltid de rättigheter som tvingande lag ger dig. Villkoren begränsar
            inte de rättigheterna.
          </p>
          <p>
            <strong>Senast uppdaterad:</strong>{" "}
            <mark>[ATT BEKRÄFTA: datum då villkoren publiceras]</mark>
          </p>

          <h2>1. Bokning och avtal</h2>
          <ul>
            <li>
              Hemstädning, storstädning, flyttstädning och fönsterputsning kan du boka direkt på
              webbplatsen. Övriga tjänster utförs efter offert.
            </li>
            <li>
              När vi har tagit emot din bokning får du en bekräftelse via e-post.{" "}
              <mark>
                [ATT BEKRÄFTA: när avtalet anses ingånget – vid bokningen eller när vi har bekräftat
                tiden]
              </mark>
            </li>
            <li>
              Återkommande tjänster, till exempel hemstädning varje vecka, varannan vecka eller en
              gång i månaden, regleras i ett avtal mellan dig och oss.{" "}
              <mark>[ATT BEKRÄFTA: hur avtalet tecknas]</mark>
            </li>
            <li>
              Du ansvarar för att uppgifterna du lämnar stämmer, till exempel bostadens storlek och
              antal rum.
            </li>
          </ul>

          <h2>2. Priser</h2>
          <ul>
            <li>Priser för privatpersoner anges inklusive moms och efter RUT-avdrag.</li>
            <li>
              Priset som visas i formuläret bygger på de uppgifter du lämnar.{" "}
              <mark>
                [ATT BEKRÄFTA: att priset justeras om uppgifterna inte stämmer, t.ex. om bostaden är
                större än angivet]
              </mark>
            </li>
            <li>
              Priset för storstädning och flyttstädning förutsätter att bostaden är i normalt skick.
              Är bostaden hårt nedsmutsad kan ett tillägg på upp till 20 procent tillkomma. Du får
              alltid veta det innan arbetet påbörjas.{" "}
              <mark>[ATT BEKRÄFTA: om tillägget är 20 procent eller upp till 20 procent]</mark>
            </li>
            <li>
              Hemstädning debiteras per timme, med minst 2 timmar per tillfälle.{" "}
              <mark>[ATT BEKRÄFTA: om minimidebiteringen även gäller enstaka hemstädning]</mark>
            </li>
            <li>
              Tilläggstjänster med ”från”-pris kan bli dyrare beroende på omfattning.{" "}
              <mark>[ATT BEKRÄFTA: hur ”från”-priser räknas]</mark>
            </li>
          </ul>

          <h2>3. RUT-avdrag</h2>
          <ul>
            <li>
              Vi drar av RUT-avdraget direkt på fakturan och ansöker om utbetalningen hos
              Skatteverket.
            </li>
            <li>
              För att vi ska kunna ansöka behöver du lämna ditt personnummer. Du ansvarar för att du
              har rätt till avdraget, till exempel att du har betalat tillräckligt med skatt och inte
              har använt hela årets utrymme.
            </li>
            <li>
              Om Skatteverket helt eller delvis nekar avdraget betalar du mellanskillnaden.{" "}
              <mark>[ATT BEKRÄFTA]</mark>
            </li>
          </ul>

          <h2>4. Betalning</h2>
          <ul>
            <li>Betalning sker mot faktura med 20 dagars betalningstid.</li>
            <li>Fakturaavgiften är 45 kr.</li>
            <li>Vid försenad betalning debiteras dröjsmålsränta enligt räntelagen.</li>
            <li>
              Återkommande hemstädning faktureras månadsvis.{" "}
              <mark>[ATT BEKRÄFTA: hur övriga återkommande tjänster och engångsuppdrag faktureras]</mark>
            </li>
          </ul>

          <h2>5. Städmaterial och utrustning</h2>
          <ul>
            <li>
              Vid hemstädning står du som kund för de produkter och medel som behövs för att utföra
              tjänsten. Vill du att vi står för produkterna debiteras de och specificeras på
              månadsfakturan. <mark>[ATT BEKRÄFTA: pris för våra städprodukter]</mark>
            </li>
            <li>Du ansvarar för att trasorna som används är tvättade till nästa städtillfälle.</li>
            <li>
              Vid enstaka hemstädning använder vi vårt eget städmaterial.{" "}
              <mark>[ATT BEKRÄFTA: vad som ingår i städmaterialet]</mark> Vid storstädning ingår all
              utrustning och alla städprodukter.
            </li>
          </ul>

          <h2>6. Förberedelser och tillträde</h2>
          <ul>
            <li>
              Du ser till att vi kan komma in i bostaden vid den bokade tiden.{" "}
              <mark>[ATT BEKRÄFTA: vad som gäller om vi inte kommer in, t.ex. om besöket debiteras]</mark>
            </li>
            <li>Vid flyttstädning ska kyl och frys vara tömda och avfrostade.</li>
            <li>
              El och vatten ska vara påslagna under städningen. <mark>[ATT BEKRÄFTA]</mark>
            </li>
            <li>
              Berätta i förväg om det finns känsliga material, till exempel marmor, mässing eller
              natursten. <mark>[ATT BEKRÄFTA]</mark>
            </li>
            <li>
              Lämnar du en nyckel till oss skriver vi en nyckelkvittens. Nyckeln märks bara med en
              intern kod och lämnas tillbaka när avtalet upphör. <mark>[ATT BEKRÄFTA]</mark>
            </li>
          </ul>

          <h2>7. Vad som ingår</h2>
          <ul>
            <li>Vad som ingår i respektive tjänst beskrivs på tjänstens sida på webbplatsen.</li>
            <li>
              Fönsterputs ingår i flyttstädning, utom för spröjsade fönster. I storstädning ingår
              fönsterputs inte, men den kan bokas som tillägg.
            </li>
            <li>
              Vid flyttstädning tar vi bort synliga fläckar på väggar och tak i den mån det går utan
              att skada ytan. Kraftiga fläckar, missfärgningar, färg, fett och skador på väggar ingår
              inte.
            </li>
          </ul>

          <h2>8. Avbokning och ombokning</h2>
          <ul>
            <li>
              Avbokning eller ombokning ska göras via telefon eller e-post senast{" "}
              <mark>[ATT BEKRÄFTA: antal dagar – i dag anges 3 dagar på webbplatsen]</mark> före det
              bokade tillfället.
            </li>
            <li>
              Vid senare avbokning debiteras{" "}
              <mark>[ATT BEKRÄFTA: avgift – i dag anges 50 procent av priset]</mark>.
            </li>
            <li>
              <mark>[ATT BEKRÄFTA: vad som gäller om vi behöver ställa in eller flytta ett uppdrag]</mark>
            </li>
          </ul>

          <h2>9. Uppsägning av återkommande tjänster</h2>
          <p>
            Avtal om återkommande tjänster har tre månaders uppsägningstid. Uppsägningen skickar du
            till info@aurelservice.se.{" "}
            <mark>
              [ATT BEKRÄFTA: att uppsägningstiden gäller alla återkommande tjänster och om uppsägningen
              ska vara skriftlig]
            </mark>
          </p>

          <h2>10. Reklamation</h2>
          <ul>
            <li>
              Är du inte nöjd med en utförd tjänst ska du kontakta oss så snart som möjligt efter att
              du har upptäckt felet, så att vi kan åtgärda det.
            </li>
            <li>
              <mark>
                [ATT BEKRÄFTA: reklamationsrutin och garanti – webbplatsen anger i dag att vi kommer
                tillbaka inom 24–48 timmar utan extra kostnad. Rutinen får inte begränsa konsumentens
                lagstadgade rätt att reklamera.]
              </mark>
            </li>
          </ul>

          <h2>11. Skador</h2>
          <ul>
            <li>Om något skadas i samband med vårt arbete ska du meddela oss så snart som möjligt.</li>
            <li>
              <mark>[ATT BEKRÄFTA: ansvarsförsäkring – försäkringsbolag, vad den täcker och eventuell självrisk]</mark>
            </li>
            <li>
              Av arbetsmiljöskäl flyttar vi inte tunga vitvaror som kyl, frys eller spis.{" "}
              <mark>[ATT BEKRÄFTA]</mark>
            </li>
          </ul>

          <h2>12. Personuppgifter</h2>
          <p>
            Hur vi behandlar dina personuppgifter beskriver vi i vår{" "}
            <Link href="/privacy-policy">integritetspolicy</Link>.
          </p>

          <h2>13. Frågor och oenighet</h2>
          <p>
            Har du frågor om villkoren är du välkommen att kontakta oss på info@aurelservice.se eller
            076-045 02 28. Om vi inte kommer överens kan du som konsument vända dig till Allmänna
            reklamationsnämnden (ARN),{" "}
            <a href="https://www.arn.se" target="_blank" rel="noopener noreferrer">
              www.arn.se
            </a>
            . <mark>[ATT BEKRÄFTA: att företaget medverkar i ARN:s prövning]</mark>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionContent;
