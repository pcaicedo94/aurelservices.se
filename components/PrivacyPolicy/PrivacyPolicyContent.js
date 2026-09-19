import React from "react";
import Link from "next/link";

// Processors and third parties come from an inventory of the code:
// pages/api/booking.js (Google Calendar, Supabase, Simply SMTP),
// pages/api/contact.js (Simply SMTP), pages/index.js (Shapo widget) and
// pages/_document.js (Google Fonts preconnect). Every [ATT BEKRÄFTA: …] is
// unconfirmed by the client and must be resolved before launch.
const PURPOSES = [
  [
    "Ta emot, bekräfta och planera din bokning och utföra tjänsten",
    "Avtal (artikel 6.1 b i dataskyddsförordningen)",
  ],
  [
    "Besvara frågor och offertförfrågningar",
    "Åtgärder på din begäran innan ett avtal ingås (artikel 6.1 b) eller vårt berättigade intresse av att kunna svara dig (artikel 6.1 f)",
  ],
  [
    "Fakturera, bokföra och ansöka om RUT-avdrag hos Skatteverket",
    "Rättslig förpliktelse (artikel 6.1 c), bland annat enligt bokföringslagen och reglerna om skattereduktion för hushållsarbete",
  ],
  ["Hantera reklamationer och rättsliga anspråk", "Berättigat intresse (artikel 6.1 f)"],
  ["Driva, felsöka och skydda webbplatsen", "Berättigat intresse (artikel 6.1 f)"],
];

// The global table styles uppercase every cell, which makes legal sentences
// hard to read; styles/ belongs to another workstream, so override it here.
const SENTENCE_CASE = { textTransform: "none" };

const PrivacyPolicyContent = () => {
  return (
    <div className="privacy-policy ptb-100">
      <div className="container">
        <div className="single-privacy">
          <h2 className="mt-0">Integritetspolicy för Aurel Städ &amp; Allservice AB</h2>
          <p>
            Vi värnar om din integritet. Här beskriver vi vilka personuppgifter vi behandlar när du
            besöker vår webbplats, bokar en tjänst eller kontaktar oss, varför vi gör det och vilka
            rättigheter du har enligt dataskyddsförordningen (GDPR).
          </p>
          <p>
            <strong>Senast uppdaterad:</strong>{" "}
            <mark>[ATT BEKRÄFTA: datum då policyn publiceras]</mark>
          </p>

          <h2>1. Personuppgiftsansvarig</h2>
          <p>
            Aurel Städ &amp; Allservice AB, organisationsnummer 556725-2340{" "}
            <mark>[ATT BEKRÄFTA: organisationsnummer]</mark>, är personuppgiftsansvarig för
            behandlingen av dina personuppgifter.
          </p>
          <ul>
            <li>
              Adress: Bredängs Allé 10 NB, 127 32 Skärholmen
            </li>
            <li>
              E-post: <a href="mailto:info@aurelservice.se">info@aurelservice.se</a>
            </li>
            <li>
              Telefon: <a href="tel:+46760450228">076-045 02 28</a>
            </li>
          </ul>

          <h2>2. Vilka personuppgifter vi behandlar</h2>
          <p>
            <strong>När du bokar en tjänst på webbplatsen:</strong> namn, e-postadress,
            telefonnummer, adressen där tjänsten ska utföras, önskat datum och tid, vald tjänst och
            de uppgifter du fyller i om uppdraget – till exempel bostadens storlek, antal rum,
            frekvens, tillval och önskat kontaktsätt – samt det beräknade priset.
          </p>
          <p>
            <strong>När du kontaktar oss eller begär en offert:</strong> namn, e-postadress,
            telefonnummer, ämne och ditt meddelande. Begär du en offert behandlar vi även adress,
            vald tjänst och de uppgifter du lämnar om uppdraget, till exempel yta och uppskattat
            pris.
          </p>
          <p>
            <strong>När du är kund hos oss:</strong> uppgifter som behövs för att utföra, fakturera
            och följa upp tjänsten, till exempel personnummer för RUT-avdrag, fakturauppgifter,
            uppgifter om tillträde till bostaden som nyckel eller portkod samt vår kommunikation med
            dig.{" "}
            <mark>
              [ATT BEKRÄFTA: vilka uppgifter som samlas in utanför webbplatsen och i vilka system de
              sparas]
            </mark>
          </p>
          <p>
            <strong>När du besöker webbplatsen:</strong> tekniska uppgifter som IP-adress,
            webbläsartyp och tidpunkt för besöket. De behandlas av vår driftleverantör och av de
            tjänster från tredje part som beskrivs i avsnitt 8.
          </p>
          <p>Skriv helst inga känsliga personuppgifter, till exempel om hälsa, i meddelandefälten.</p>

          <h2>3. Varför vi behandlar uppgifterna och med vilket stöd</h2>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th scope="col" style={SENTENCE_CASE}>Ändamål</th>
                  <th scope="col" style={SENTENCE_CASE}>Rättslig grund</th>
                </tr>
              </thead>
              <tbody>
                {PURPOSES.map(([purpose, basis]) => (
                  <tr key={purpose}>
                    <td style={SENTENCE_CASE}>{purpose}</td>
                    <td style={SENTENCE_CASE}>{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Uppgifterna i bokningsformuläret behövs för att vi ska kunna utföra tjänsten. Utan dem kan
            vi inte ta emot bokningen.
          </p>

          <h2>4. Vilka som får ta del av uppgifterna</h2>
          <p>
            Dina uppgifter hanteras av de medarbetare som behöver dem för att planera och utföra
            uppdraget. Vi anlitar också följande leverantörer, som behandlar uppgifter för vår
            räkning (personuppgiftsbiträden):
          </p>
          <ul>
            <li>
              <strong>Google (Google Kalender)</strong> – bokningar läggs in i vår kalender med namn,
              tjänst, adress, telefonnummer, e-postadress, pris och uppgifter om uppdraget.{" "}
              <mark>
                [ATT BEKRÄFTA: vilket Google-konto som används och att det finns ett
                personuppgiftsbiträdesavtal]
              </mark>
            </li>
            <li>
              <strong>Supabase</strong> – databas där bokningarna sparas med samma uppgifter.{" "}
              <mark>[ATT BEKRÄFTA: serverregion och om databasen flyttas till Simply]</mark>
            </li>
            <li>
              <strong>Simply.com (Danmark)</strong> – e-post. Bekräftelser och meddelanden från
              webbplatsens formulär skickas via Simplys e-postserver och tas emot i vår inkorg
              info@aurelservice.se.
            </li>
            <li>
              <strong>Driftleverantör för webbplatsen</strong> –{" "}
              <mark>[ATT BEKRÄFTA: vilket företag som driftar webbplatsen och var]</mark>
            </li>
            <li>
              <strong>Shapo</strong> – visar kundomdömen på startsidan, se avsnitt 8.
            </li>
          </ul>
          <p>
            Vi lämnar också ut uppgifter till Skatteverket när vi ansöker om RUT-avdrag och till
            andra myndigheter när lagen kräver det.{" "}
            <mark>
              [ATT BEKRÄFTA: om redovisningsbyrå eller annan extern part får ta del av kunduppgifter]
            </mark>
          </p>

          <h2>5. Överföring utanför EU/EES</h2>
          <p>
            Google och Supabase är amerikanska företag, och uppgifter kan därför behandlas utanför
            EU/EES. Sådana överföringar sker med stöd av EU–USA-ramverket för dataskydd (EU–US Data
            Privacy Framework) eller EU-kommissionens standardavtalsklausuler.{" "}
            <mark>
              [ATT BEKRÄFTA: vilken skyddsåtgärd som gäller för respektive leverantör och om även
              Shapo överför uppgifter]
            </mark>
          </p>

          <h2>6. Hur länge vi sparar uppgifterna</h2>
          <ul>
            <li>
              Bokningar i kalendern och databasen: <mark>[ATT BEKRÄFTA: lagringstid]</mark>
            </li>
            <li>
              Meddelanden och offertförfrågningar som kommer in via e-post:{" "}
              <mark>[ATT BEKRÄFTA: lagringstid]</mark>
            </li>
            <li>
              Fakturor och annat bokföringsmaterial, även uppgifter för RUT-avdrag: till och med det
              sjunde året efter utgången av det kalenderår då räkenskapsåret avslutades, enligt
              bokföringslagen.
            </li>
            <li>
              Uppgifter om nycklar och portkoder: raderas när avtalet upphör.{" "}
              <mark>[ATT BEKRÄFTA]</mark>
            </li>
          </ul>
          <p>När uppgifterna inte längre behövs raderar eller avidentifierar vi dem.</p>

          <h2>7. Dina rättigheter</h2>
          <p>Du har rätt att:</p>
          <ul>
            <li>få veta vilka personuppgifter vi behandlar om dig och få en kopia av dem</li>
            <li>få felaktiga uppgifter rättade</li>
            <li>
              få dina uppgifter raderade, till exempel när de inte längre behövs, om vi inte är
              skyldiga att spara dem enligt lag
            </li>
            <li>begära att behandlingen begränsas</li>
            <li>invända mot behandling som grundar sig på vårt berättigade intresse</li>
            <li>få ut de uppgifter du själv har lämnat i ett maskinläsbart format (dataportabilitet)</li>
          </ul>
          <p>
            Vill du använda någon av dina rättigheter? Kontakta oss på{" "}
            <a href="mailto:info@aurelservice.se">info@aurelservice.se</a>. Vi svarar utan onödigt
            dröjsmål och senast inom en månad.
          </p>

          <h2>8. Cookies och tjänster från tredje part</h2>
          <p>
            Vi använder inga cookies för statistik eller marknadsföring.{" "}
            <mark>[ATT BEKRÄFTA: att inga sådana verktyg läggs till före lansering]</mark>
          </p>
          <p>Följande tjänster från tredje part används på webbplatsen:</p>
          <ul>
            <li>
              <strong>Shapo:</strong> startsidan hämtar en widget från Shapo (cdn.shapo.io) som visar
              kundomdömen. När sidan laddas får Shapo tekniska uppgifter som din IP-adress och
              information om webbläsaren, och tjänsten kan spara uppgifter i din webbläsare.{" "}
              <mark>
                [ATT BEKRÄFTA: Shapos villkor för personuppgifter och om widgeten sätter cookies]
              </mark>
            </li>
            <li>
              <strong>Google Fonts:</strong> webbplatsen öppnar en anslutning till Googles
              typsnittstjänst (fonts.googleapis.com), vilket gör att din IP-adress kan bli synlig för
              Google.{" "}
              <mark>
                [ATT BEKRÄFTA: om typsnitten ska hämtas från Google eller läggas på vår egen server]
              </mark>
            </li>
          </ul>
          <p>
            Länkar till andra webbplatser, till exempel Instagram, leder till sidor med egna
            integritetsvillkor. Inga uppgifter skickas dit förrän du klickar på länken.
          </p>
          <p>
            Om vi börjar använda cookies som inte är nödvändiga, till exempel för statistik, ber vi om
            ditt samtycke innan de används.
          </p>

          <h2>9. Säkerhet</h2>
          <p>
            Vi skyddar dina uppgifter med tekniska och organisatoriska åtgärder. Kunddatabasen går
            inte att nå från webbläsaren, och bara de som behöver uppgifterna i sitt arbete ska ha
            tillgång till dem. <mark>[ATT BEKRÄFTA: behörigheter och rutiner]</mark>
          </p>

          <h2>10. Klagomål</h2>
          <p>
            Tycker du att vi behandlar dina personuppgifter på fel sätt vill vi gärna att du hör av
            dig till oss först. Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten
            (IMY), som är tillsynsmyndighet:{" "}
            <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">
              www.imy.se
            </a>
            .
          </p>

          <h2>11. Ändringar i policyn</h2>
          <p>
            Vi kan komma att uppdatera policyn, till exempel om vi byter leverantör. Den senaste
            versionen finns alltid på den här sidan. Villkoren för våra tjänster hittar du i våra{" "}
            <Link href="/terms-condition">allmänna villkor</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyContent;
