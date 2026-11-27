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

// Sources: Prislista för privatpersoner Aurel 2027, the service copy in
// "Servicios privados" and the client's own Swedish wording in Q90, Q92 and
// Q101-Q110, answered on 2026-10-15. Answers are plain paragraphs so the same
// text feeds the FAQPage JSON-LD. Passages in [ATT BEKRÄFTA: …] are not
// confirmed by the client yet, and isConfirmed() keeps them out of the
// structured data.
//
// The figures here are written out rather than read from config/prices.json,
// which is why scripts/qa-pricing.mjs checks the ones that can go stale: the
// 2027 list silently falsified two of these answers before that check existed.
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
      "Storstädning är en mer omfattande och grundlig rengöring där vi lägger extra tid på detaljer och ytor som vanligtvis inte ingår i den löpande hemstädningen, till exempel snickerier, dörrkarmar, golvlister, element och andra svåråtkomliga ytor. Den passar särskilt bra inför vår- eller höstsäsongen, inför en speciell tillställning eller när hemmet behöver lite extra omsorg.",
      "Hemstädning är en regelbunden städning som hjälper dig att hålla hemmet rent och trivsamt i vardagen, med fokus på dammsugning, golvtorkning, dammtorkning samt rengöring av kök och badrum. Många kunder bokar storstädning en eller två gånger om året som ett komplement till sin vanliga hemstädning.",
      "Vid storstädning har vi med oss all utrustning och alla städprodukter. Fönsterputsning ingår inte, men du kan boka den som tillägg. Priset beror på bostadens storlek.",
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
      "Vi putsar fönsterrutornas samtliga åtkomliga sidor, både invändigt och utvändigt, och tar med all utrustning och alla rengöringsmedel. Rengöring av persienner och fönsterbleck ingår inte.",
      "Priset beror på hur många rum bostaden har. Har bostaden fem rum och kök eller fler, eller är den större än 120 kvadratmeter, lämnar vi en offert. I rumspriset ingår tre fönsterbågar per rum; har bostaden fler kostar varje båge därutöver 110 kr, eller 140 kr om fönstren har spröjs, efter RUT-avdrag. Är fönstren överhängda, svåråtkomliga eller kraftigt nedsmutsade lämnar vi en offert i stället, för då behöver vi se dem först.",
    ],
    link: { href: "/tjanster/fonsterputs", label: "Läs mer och beräkna pris för fönsterputsning" },
  },
  {
    id: "nedsmutsad",
    question: "Vad händer om bostaden är smutsigare än normalt?",
    answer: [
      "Priset utgår från att bostaden är i normalt skick. Vid kraftig nedsmutsning kan ett pristillägg tillkomma: upp till 20 procent vid storstädning och upp till 25 procent vid flyttstädning.",
      "Vid extrem nedsmutsning, där arbetsinsatsen väsentligt överstiger vad som normalt kan förväntas, görs en separat bedömning och priset kan justeras utöver de procentsatserna.",
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
      "Du som kund ansvarar för att vi har tillgång till bostaden vid avtalad tid. Kommer vi inte in kontaktar vi dig och försöker i första hand hitta en lösning tillsammans. Kan tillträde inte ordnas inom rimlig tid och städningen därför inte genomföras kan en ersättning på högst 50 procent av det avtalade priset för städarbetet före RUT-avdrag debiteras. Ersättningen ger inte RUT-avdrag.",
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
      "Kontakta oss så snart som möjligt, gärna via e-post till info@aurelservice.se, eller ring 076-045 02 28.",
      // Textosweb (2026-11-26) ersätter Q24/Q101: 72 timmar (3 dagar), och
      // därefter skälig ersättning utan fast procentsats.
      "Avbokning är kostnadsfri senast 72 timmar (3 dagar) före avtalad starttid.",
      "Vid senare avbokning kan vi begära skälig ersättning för kostnader och förluster som uppstår till följd av avbokningen, i enlighet med tillämplig lag. Vi försöker alltid hjälpa dig att hitta en ny tid när det är möjligt.",
      "Behöver vi på Aurel ändra eller ställa in en städning kontaktar vi dig så snart som möjligt och erbjuder i första hand en ny tid. Du debiteras inte för arbete som inte har utförts.",
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
      // Textosweb (2026-11-26) ersätter Q105.
      "Att skicka en bokningsförfrågan via webbplatsen är kostnadsfritt och inte bindande. Vi går igenom dina uppgifter och återkommer via e-post med ett prisförslag och tillgängliga tider.",
      "Bokningen blir bindande först när du skriftligen har accepterat prisförslaget och bokningsvillkoren, till exempel genom att svara på vårt mejl, och vi har bekräftat bokningen skriftligen. Du betalar ingenting i förväg.",
    ],
    link: { href: "/bokningsvillkor", label: "Läs våra bokningsvillkor" },
  },
  {
    id: "avtal",
    question: "Binder jag mig om jag bokar återkommande städning?",
    answer: [
      "Vid löpande hemstädning upprättar vi ett separat skriftligt avtal där pris, städfrekvens, uppsägningstid och övriga villkor framgår. Avtalet kan signeras elektroniskt eller på papper. Uppsägningstiden är tre månader.",
      "Vill du först se hur vi arbetar kan du börja med en provstädning. Den debiteras som en enstaka städning, utan krav på fortsatt städning. Tecknar du avtal om löpande hemstädning inom 14 kalenderdagar justerar vi priset för provstädningen till det överenskomna priset för löpande hemstädning.",
    ],
  },
  {
    id: "garanti",
    question: "Vad händer om jag inte är nöjd?",
    answer: [
      "Kontakta oss så snart som möjligt och beskriv vad du inte är nöjd med. Vi undersöker ärendet och försöker hitta en lämplig lösning.",
      "Vid flyttstädning har du 48 timmar efter avslutad städning på dig att kontakta oss. Vi åtgärdar eventuella brister som omfattas av städuppdraget utan extra kostnad och så snart som möjligt.",
      "Vid fel i tjänsten gäller dina rättigheter enligt konsumenttjänstlagen och annan tillämplig lagstiftning.",
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
