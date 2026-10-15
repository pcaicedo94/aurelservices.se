import React from "react";
import Link from "next/link";

// Sources: Prislista 2026 (payment terms, notice period, materials, soiling
// surcharge), the service copy in "Servicios privados" and the client's own
// Swedish wording in Q90, Q92 and Q101-Q110, answered on 2026-10-15. Every
// [ATT BEKRÄFTA: …] is unconfirmed by the client and must be resolved before
// launch.
//
// Figures here mirror the `terms` block of config/prices.json, which is the
// single source of truth the chatbot reads: the cancellation deadline is one
// deadline written both ways, "48 timmar (2 dagar)", and the two cancellation
// fees are ceilings, so every sentence says "upp till".
const TermsConditionContent = () => {
  return (
    <div className="privacy-policy ptb-100">
      <div className="container">
        <div className="single-privacy">
          <h2 className="mt-0">Allmänna villkor för privatpersoner</h2>
          <p>
            De här villkoren gäller när du som privatperson köper städtjänster av Aurel Städ &amp;
            Allservice AB, organisationsnummer 556725-2340. För företag och
            bostadsrättsföreningar gäller andra villkor: där är det den offert eller det
            undertecknade avtal som vi har kommit överens om som gäller, inte de här villkoren.
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
              {/* Q105, bekräftat av kunden 2026-10-15. */}
              När vi har tagit emot din bokning får du en bekräftelse via e-post. Avtalet är slutet
              när du har fått den bekräftelsen. Du skriver inte under något och betalar ingenting i
              förväg.
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
            {/* Q104, bekräftat av kunden 2026-10-15: upp till 20 procent, inte 20 procent fast. */}
            <li>
              Priset för storstädning och flyttstädning förutsätter att bostaden är i normalt skick.
              Vid kraftig nedsmutsning kan ett pristillägg på upp till 20 procent tillkomma.
            </li>
            <li>
              Vid extrem nedsmutsning, där arbetsinsatsen väsentligt överstiger vad som normalt kan
              förväntas, görs en separat bedömning och priset kan justeras utöver 20 procent.
            </li>
            <li>
              Du informeras alltid på plats och ska godkänna pristillägget innan något extra arbete
              utförs. Godkänner du inte det justerade priset utför vi endast det arbete som ryms
              inom den ursprungliga beställningen, alternativt avbryter vi uppdraget efter
              överenskommelse. Vi kan då inte garantera det avtalade slutresultatet.
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
              uppfyller villkoren för RUT-avdrag och för att du har tillräckligt avdragsutrymme, till
              exempel att du har betalat tillräckligt med skatt och inte har använt hela årets
              utrymme.
            </li>
            <li>
              {/* Q103, bekräftat av kunden 2026-10-15. */}
              Om Skatteverket helt eller delvis avslår RUT-avdraget har vi rätt att fakturera dig
              motsvarande belopp. Du ansvarar då för att betala mellanskillnaden.
            </li>
          </ul>

          <h2>4. Betalning</h2>
          <ul>
            {/* Q92, bekräftat av kunden 2026-10-15: all betalning sker mot faktura. */}
            <li>
              All betalning sker mot faktura med 20 dagars betalningstid. Vi tar inte emot Swish
              eller kortbetalning.
            </li>
            <li>Fakturaavgiften är 45 kr.</li>
            <li>Vid försenad betalning debiteras dröjsmålsränta enligt räntelagen.</li>
            <li>
              Återkommande hemstädning faktureras månadsvis. Övriga uppdrag faktureras mot faktura på
              samma villkor.
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
          {/* Q102 och Q107, bekräftade av kunden 2026-10-15. Avgiften vid
              uteblivet tillträde står också i punkt 8, och de två måste säga
              samma sak. */}
          <ul>
            <li>
              Du ansvarar för att vi har tillgång till bostaden vid avtalad tid. Kommer vi inte in
              kontaktar vi dig och försöker i första hand hitta en lösning tillsammans.
            </li>
            <li>
              Kan tillträde inte ordnas och arbetet därför inte utföras kan vi debitera den bokade
              tiden eller framkörningen, enligt punkt 8.
            </li>
            <li>
              Nycklar, portkoder och larminformation hanteras konfidentiellt och endast av behörig
              personal.
            </li>
            <li>Vid flyttstädning ska kyl och frys vara tömda och avfrostade.</li>
            <li>Du ansvarar för att fungerande vatten och el finns tillgängligt under städningen.</li>
            <li>
              Ömtåliga eller särskilt känsliga material och ytor, till exempel marmor, mässing eller
              natursten, ska meddelas oss innan arbetet påbörjas.
            </li>
            <li>
              Husdjur ska hållas på ett säkert sätt så att städningen kan utföras utan hinder eller
              risk.
            </li>
            <li>
              Du ansvarar för att personliga och värdefulla föremål är undanplockade innan städningen
              påbörjas.
            </li>
            <li>
              Tunga möbler, vitvaror och andra större föremål flyttas normalt inte inom ordinarie
              städning, om detta inte har avtalats i förväg.
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
          {/* Q24 (2026-09-17) och Q101 (2026-10-15) gäller samma tidsgräns:
              48 timmar är de två dagarna, och hela webbplatsen skriver den
              som "48 timmar (2 dagar)". Avgifterna är tak, aldrig fasta
              belopp. */}
          <ul>
            <li>Avbokning och ombokning gör du via telefon eller e-post.</li>
            <li>Avbokning är kostnadsfri senast 48 timmar (2 dagar) före den bokade tiden.</li>
            <li>
              Vid avbokning senare än 48 timmar (2 dagar) före den bokade tiden kan en avgift på upp
              till 50 procent av det avtalade priset debiteras.
            </li>
            <li>
              Vid avbokning samma dag, eller om vi inte får tillträde till bostaden, kan
              upp till 100 procent av det avtalade priset debiteras.
            </li>
            <li>
              Vi försöker alltid vara flexibla. Går tiden att boka om, eller personalen att planera
              om, hittar vi hellre en lösning tillsammans med dig.
            </li>
            <li>
              Behöver vi på Aurel avboka erbjuder vi en ny tid så snart som möjligt. Du debiteras
              självklart inte för arbete som inte har utförts.
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
              {/* Q108, bekräftat av kunden 2026-10-15. Försäkringsbolag och
                  försäkringsbelopp är inte lämnade och får inte skrivas här. */}
              Aurel Städ &amp; Allservice AB har giltig företags- och ansvarsförsäkring.
              Försäkringsbevis kan uppvisas vid behov.
            </li>
            <li>
              Av arbetsmiljöskäl flyttar vi inte tunga möbler, vitvaror som kyl, frys eller spis
              eller andra större föremål inom ordinarie städning, om vi inte har avtalat det i
              förväg.
            </li>
          </ul>

          <h2>12. Personuppgifter</h2>
          <p>
            Hur vi behandlar dina personuppgifter beskriver vi i vår{" "}
            <Link href="/integritetspolicy">integritetspolicy</Link>.
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
