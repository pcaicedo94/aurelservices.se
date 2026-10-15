import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";

const PENDING = "[ATT BEKRÄFTA";

// Sources: Prislista 2026 (pages 1-3), the service copy in "Servicios
// privados" and the client's own Swedish wording in Q90, Q92 and Q101-Q110,
// answered on 2026-10-15. Answers are plain paragraphs so the same text feeds
// the FAQPage JSON-LD. Passages in [ATT BEKRÄFTA: …] are not confirmed by the
// client yet, and isConfirmed() keeps them out of the structured data.
export const FAQ_ITEMS = [
  {
    id: "rut",
    question: "Hur fungerar RUT-avdraget?",
    answer: [
      "Som privatperson kan du få RUT-avdrag när du köper hemstädning, storstädning, flyttstädning eller fönsterputsning. Avdraget är upp till 50 procent av arbetskostnaden.",
      "Vi drar av RUT direkt på fakturan och sköter ansökan hos Skatteverket, så du betalar bara din del. För att vi ska kunna ansöka behöver vi ditt personnummer.",
      "Avdraget förutsätter att du har betalat tillräckligt med skatt och inte redan har använt hela årets utrymme. Aktuella regler och belopp finns hos Skatteverket.",
      "Du ansvarar själv för att du uppfyller villkoren och har tillräckligt avdragsutrymme. Avslår Skatteverket avdraget helt eller delvis har vi rätt att fakturera dig motsvarande belopp, och du betalar då mellanskillnaden.",
      "Priserna på vår webbplats anges inklusive moms och efter RUT-avdrag.",
    ],
  },
  {
    id: "hemstadning",
    question: "Vad ingår i hemstädning?",
    answer: [
      "Vid hemstädning dammsuger vi golv och mattor, våttorkar golven, rengör kök och badrum – bland annat bänkar, spis, diskho och toalett – torkar av ytor och möbler och tömmer soporna.",
      "Du bestämmer själv hur ofta vi kommer: varje vecka, varannan vecka, en gång i månaden eller vid ett enstaka tillfälle.",
    ],
    link: { href: "/tjanster/hemstadning", label: "Läs mer och beräkna pris för hemstädning" },
  },
  {
    id: "storstadning",
    question: "Vad är skillnaden mellan hemstädning och storstädning?",
    answer: [
      "Hemstädning håller hemmet rent i vardagen. Storstädning är en grundlig rengöring av hela bostaden från golv till tak, där vi även tar lister, dörrkarmar och skåp, kyl och frys utvändigt samt brunnar i kök och badrum.",
      "Vi har med oss all utrustning och alla städprodukter. Fönsterputsning ingår inte, men du kan boka den som tillägg. Priset beror på bostadens storlek.",
    ],
    link: { href: "/tjanster/storstadning", label: "Läs mer och beräkna pris för storstädning" },
  },
  {
    id: "flyttstadning",
    question: "Vad ingår i flyttstädning?",
    answer: [
      "Flyttstädningen omfattar hela bostaden och är anpassad för att klara besiktningen. Vi rengör bland annat golv, lister, dörrar och strömbrytare, skåp och lådor in- och utvändigt, ugn, spis, köksfläkt, kyl och frys, badrum och ventilationsgaller. Fönsterputs ingår, både invändigt och utvändigt, men inte för spröjsade fönster.",
      "Kyl och frys ska vara tömda och avfrostade när vi kommer. Synliga fläckar på väggar och tak tar vi bort så långt det går utan att skada ytan, men kraftiga fläckar, missfärgningar, färg, fett och skador ingår inte.",
      "Som tillägg kan du boka avfrostning av kyl och frys, rengöring av persienner, städning av förråd, garage och balkong samt fönsterputs av inglasad balkong.",
    ],
    link: { href: "/tjanster/flyttstadning", label: "Läs mer och beräkna pris för flyttstädning" },
  },
  {
    id: "fonsterputs",
    question: "Vad ingår i fönsterputsning?",
    answer: [
      "Vi putsar fönstren på in- och utsidan, rengör bågarna, torkar av karmar och kanter och dammar av persiennerna.",
      "Priset beror på hur många rum bostaden har. Har bostaden fem rum och kök eller fler, eller är den större än 120 kvadratmeter, lämnar vi en offert. [ATT BEKRÄFTA: om bostäder med fem rum och kök får pris direkt eller offert] Spröjs, takhöjd över 280 cm och treglasfönster ger ett tillägg på 25 procent vardera.",
    ],
    link: { href: "/tjanster/fonsterputs", label: "Läs mer och beräkna pris för fönsterputsning" },
  },
  {
    id: "nedsmutsad",
    question: "Vad händer om bostaden är smutsigare än normalt?",
    answer: [
      "Priset för storstädning och flyttstädning utgår från att bostaden är i normalt skick. Vid kraftig nedsmutsning kan ett pristillägg på upp till 20 procent tillkomma.",
      "Vid extrem nedsmutsning, där arbetsinsatsen väsentligt överstiger vad som normalt kan förväntas, görs en separat bedömning och priset kan justeras utöver 20 procent.",
      "Du informeras alltid på plats och ska godkänna pristillägget innan vi utför något extra arbete. Godkänner du inte det justerade priset utför vi endast det arbete som ryms inom den ursprungliga beställningen, alternativt avbryter vi uppdraget efter överenskommelse. Vi kan då inte garantera det avtalade slutresultatet.",
    ],
  },
  {
    id: "material",
    question: "Behöver jag ha egna städprodukter och egen utrustning?",
    answer: [
      "Vid hemstädning står du som kund för de städprodukter och medel som behövs, och du ser till att trasorna är tvättade till nästa städtillfälle. Vill du att vi tar med produkterna debiteras de och specificeras på månadsfakturan. [ATT BEKRÄFTA: pris för våra städprodukter]",
      "Vid enstaka hemstädning använder vi vårt eget städmaterial. [ATT BEKRÄFTA: vad som ingår i städmaterialet vid enstaka hemstädning, t.ex. dammsugare]",
      "Vid storstädning ingår all utrustning och alla städprodukter. [ATT BEKRÄFTA: om detsamma gäller vid flyttstädning och fönsterputsning]",
    ],
  },
  {
    id: "nycklar",
    question: "Hur fungerar det med nycklar och tillträde?",
    answer: [
      "Vi behöver kunna komma in i bostaden vid den bokade tiden. Du kan vara hemma när vi städar eller lämna en nyckel till oss. Nycklar, portkoder och larminformation hanteras konfidentiellt och endast av behörig personal.",
      "Du som kund ansvarar för att vi har tillgång till bostaden vid avtalad tid. Kommer vi inte in kontaktar vi dig och försöker i första hand hitta en lösning tillsammans. Kan tillträde inte ordnas och arbetet därför inte utföras kan vi debitera den bokade tiden eller framkörningen.",
    ],
  },
  {
    id: "husdjur",
    question: "Kan ni städa hos mig om jag har husdjur?",
    answer: [
      "Berätta gärna redan när du bokar om du har husdjur, så kan vi planera besöket. Det vi ber om är att husdjuret hålls på ett säkert sätt under städningen, så att arbetet kan utföras utan hinder eller risk.",
    ],
  },
  {
    id: "avbokning",
    question: "Hur avbokar eller flyttar jag en städning?",
    answer: [
      "Kontakta oss på 076-045 02 28 eller info@aurelservice.se så snart du vet att tiden inte passar.",
      // Q24 (2026-09-17) och Q101 (2026-10-15) gäller samma tidsgräns: 48
      // timmar är de två dagarna, och hela webbplatsen skriver den som
      // "48 timmar (2 dagar)". Avgifterna är tak, aldrig fasta belopp.
      "Avbokning och ombokning är kostnadsfri senast 48 timmar (2 dagar) före den bokade tiden.",
      "Avbokar du senare än så kan en avgift på upp till 50 procent av det avtalade priset debiteras, och vid avbokning samma dag, eller om vi inte får tillträde till bostaden, upp till 100 procent av det avtalade priset.",
      "Vi försöker alltid vara flexibla. Går tiden att boka om, eller personalen att planera om, hittar vi hellre en lösning tillsammans med dig. Behöver vi på Aurel avboka erbjuder vi en ny tid så snart som möjligt, och du debiteras självklart inte för arbete som inte har utförts.",
    ],
  },
  {
    id: "betalning",
    question: "Hur betalar jag?",
    answer: [
      "Du betalar mot faktura med 20 dagars betalningstid. Fakturaavgiften är 45 kr, och vid försenad betalning debiteras dröjsmålsränta enligt räntelagen.",
      "All betalning sker mot faktura – vi tar inte emot Swish eller kortbetalning – och det gäller både enstaka uppdrag och återkommande städning. RUT-avdraget är redan draget på fakturan, och återkommande hemstädning faktureras månadsvis.",
    ],
  },
  {
    id: "bekraftelse",
    question: "När är min bokning bekräftad?",
    answer: [
      // Q105, bekräftat av kunden 2026-10-15.
      "Bokningen är klar först när du har fått vår bekräftelse via e-post. Du skriver inte under något och betalar ingenting i förväg.",
    ],
  },
  {
    id: "avtal",
    question: "Binder jag mig om jag bokar återkommande städning?",
    answer: [
      "Återkommande städning, till exempel hemstädning varje eller varannan vecka, gäller tills vidare med tre månaders uppsägningstid. [ATT BEKRÄFTA: att uppsägningstiden gäller alla återkommande avtal och hur avtalet tecknas]",
    ],
  },
  {
    id: "garanti",
    question: "Vad händer om jag inte är nöjd?",
    answer: [
      "Hör av dig så snart som möjligt och berätta vad som inte blev bra, så åtgärdar vi det. [ATT BEKRÄFTA: garantins villkor – webbplatsen anger i dag att vi kommer tillbaka inom 24–48 timmar utan extra kostnad, och på ett annat ställe att du ska höra av dig inom 24 timmar]",
    ],
  },
  {
    id: "forsakring",
    question: "Är ni försäkrade?",
    answer: [
      "Ja, Aurel Städ & Allservice AB har giltig företags- och ansvarsförsäkring, och försäkringsbevis kan uppvisas vid behov – säg till om du vill se det.",
      "Skulle något skadas i samband med vårt arbete vill vi att du kontaktar oss så snart som möjligt.",
    ],
  },
  {
    id: "foretag",
    question: "Städar ni även åt företag och bostadsrättsföreningar?",
    answer: [
      "Ja. Vi erbjuder bland annat kontorsstädning, trappstädning, bodstädning, fönsterputsning och flyttstädning för företag samt byggstädning och golvvård.",
      "Skicka er förfrågan, så bokar vi ett kostnadsfritt platsbesök och tar fram en offert anpassad efter lokalen eller fastigheten.",
      "För företag och bostadsrättsföreningar gäller egna villkor: där är det den offert eller det undertecknade avtal vi har kommit överens om som gäller, inte de allmänna villkoren för privatpersoner.",
    ],
    link: { href: "/foretag", label: "Se våra tjänster för företag och BRF" },
  },
  {
    id: "sprak",
    question: "Vilka språk talar er personal?",
    answer: ["Du kan alltid kontakta oss på svenska. [ATT BEKRÄFTA: vilka fler språk personalen talar, t.ex. engelska och spanska]"],
  },
];

export const isConfirmed = (item) => !item.answer.some((paragraph) => paragraph.includes(PENDING));

// Only confirmed answers go into the structured data, so search engines never
// index a placeholder; the rest join once the client has confirmed them.
export function faqSchema(items = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.filter(isConfirmed).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.join(" ") },
    })),
  };
}

// Highlights unconfirmed passages so they are easy to spot before launch.
function withMarkers(text) {
  return text
    .split(/(\[ATT BEKRÄFTA[^\]]*\])/)
    .map((part, index) => (part.startsWith(PENDING) ? <mark key={index}>{part}</mark> : part));
}

const FaqContent = () => {
  return (
    <div className="faq-section ptb-100">
      <div className="container">
        <div className="section-title">
          <span>Frågor och svar</span>
          <h2>Vanliga frågor om våra tjänster</h2>
        </div>

        <p className="text-center" style={{ marginBottom: "40px" }}>
          Hittar du inte svaret du letar efter? Skriv till oss i formuläret längre ner eller ring{" "}
          <a href="tel:+46760450228">076-045 02 28</a>. Du får svar inom 24 timmar.
        </p>

        <div className="faq-accordion">
          <Accordion allowZeroExpanded preExpanded={[FAQ_ITEMS[0].id]}>
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} uuid={item.id}>
                <AccordionItemHeading>
                  <AccordionItemButton>{item.question}</AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  {item.answer.map((paragraph, index) => (
                    <p key={index}>{withMarkers(paragraph)}</p>
                  ))}
                  {item.link && (
                    <p>
                      <Link href={item.link.href}>{item.link.label}</Link>
                    </p>
                  )}
                </AccordionItemPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FaqContent;
