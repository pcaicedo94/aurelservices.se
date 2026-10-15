// The chatbot's conversation, as data. components/ChatBot/FAQbot.js only walks
// this tree; it writes no copy of its own. scripts/qa-chatbot.mjs walks the
// same export, which is why the tree lives outside the component.
//
// Two rules hold the file together:
//
//   1. Not one amount is written out. Every figure comes from lib/pricing.js,
//      which reads config/prices.json, so a rate the client changes can never
//      leave the bot quoting last year's price. Before this module the bot
//      promised "180 kr/timme" and "195 kr per timme" for hemstädning while
//      the calculator on the same site charged 200–270 kr.
//   2. A service with no rate in the data is never given one. Everything under
//      /foretag/ is quoted after a free site visit, and so are the private
//      services that have no price list, so those answers say exactly that.
//
// Where the client has not answered yet — marked [ATT BEKRÄFTA] in
// components/Faq/FaqContent.js or pendingConfirmation in config/prices.json —
// the answer says what we do know and sends the visitor to the contact form
// instead of inventing the rest.
import {
  CANCELLATION_NOTICE_DAYS,
  CONTAINER_CLEANING_TIERS,
  CONTAINER_MAX_UNITS_ONLINE,
  CONTAINER_VISITS_PER_WEEK,
  CONTAINER_WEEKS_PER_MONTH,
  containerCleaningPricePerUnit,
  DEEP_CLEANING_EXTRAS,
  DEEP_CLEANING_MIN_AREA,
  DEEP_CLEANING_QUOTE_ABOVE_AREA,
  DEEP_CLEANING_TIERS,
  deepCleaningBasePrice,
  FIRST_CLEANING_DISCOUNT_PERCENT,
  HOME_FREQUENCY_RATES,
  HOME_WEEKDAY_RATES,
  INVOICE_FEE,
  MIN_BILLABLE_HOURS,
  MOVE_CLEANING_EXTRAS,
  MOVE_CLEANING_MIN_AREA,
  MOVE_CLEANING_TIERS,
  NOTICE_PERIOD_MONTHS,
  OFFICE_FREQUENCIES,
  PAYMENT_TERMS_DAYS,
  WINDOW_BALCONY_PRICE,
  WINDOW_QUOTE_ABOVE_AREA,
  WINDOW_QUOTE_FROM_ROOMS,
  WINDOW_ROOM_PRICES,
  WINDOW_SURCHARGE_PERCENT,
} from "../pricing.js";
import { formatPrice, joinSwedish } from "../booking/format.js";
import { FIRST_START_HOUR, LAST_START_HOUR, LEAD_DAYS } from "../booking/rules.js";

/**
 * @typedef {Object} ChatLink
 * @property {string} href  Internal path, optionally with a #fragment.
 * @property {string} label Link text.
 */

/**
 * @typedef {Object} ChatOption
 * @property {string} label What the button says, and what the visitor's own
 *                          message then reads.
 * @property {string} next  Id of the node the button opens.
 */

/**
 * @typedef {Object} ChatNode
 * @property {string} id
 * @property {string} message             What the bot says.
 * @property {ReadonlyArray<ChatLink>} links
 * @property {ReadonlyArray<ChatOption>} options  Never empty: no dead ends.
 */

export const ROOT_ID = "root";
export const QUOTE_ID = "offert";
export const CONTACT_ID = "kontakt";
const PRIVATE_MENU_ID = "menu.privat";
const BUSINESS_MENU_ID = "menu.foretag";

const PHONE = "076-045 02 28";
const EMAIL = "info@aurelservice.se";

const hour = (value) => `${String(value).padStart(2, "0")}:00`;
const BOOKING_WINDOW = `mellan ${hour(FIRST_START_HOUR)} och ${hour(LAST_START_HOUR)}`;

/* ---------------------------- price sentences ----------------------------- */
// Each helper turns the data into Swedish; none of them holds an amount.

// "upp till 50 kvm", "51–70 kvm", "från 151 kvm".
function bandLabel(tiers, index, minArea) {
  const from = index === 0 ? minArea : tiers[index - 1].maxSqm + 1;
  const { maxSqm } = tiers[index];
  if (maxSqm === null) return `från ${from} kvm`;
  if (index === 0) return `upp till ${maxSqm} kvm`;
  return `${from}–${maxSqm} kvm`;
}

const deepBands = joinSwedish(
  DEEP_CLEANING_TIERS.map(
    (tier, index) =>
      `${bandLabel(DEEP_CLEANING_TIERS, index, DEEP_CLEANING_MIN_AREA)} kostar ${formatPrice(
        deepCleaningBasePrice(tier.maxSqm)
      )}`
  )
);

const moveBands = joinSwedish(
  MOVE_CLEANING_TIERS.map((tier, index) => {
    const label = bandLabel(MOVE_CLEANING_TIERS, index, MOVE_CLEANING_MIN_AREA);
    return tier.price === null
      ? `${label} kostar ${formatPrice(tier.pricePerSqm)} per kvm`
      : `${label} kostar ${formatPrice(tier.price)} som fast pris`;
  })
);

const windowRoomBands = joinSwedish(
  Object.entries(WINDOW_ROOM_PRICES).map(
    ([rooms, price]) => `${rooms} rum och kök ${formatPrice(price)}`
  )
);

const officeRates = joinSwedish(
  Object.values(OFFICE_FREQUENCIES).map(
    (plan) => `${formatPrice(plan.hourlyRate)} per timme vid ${plan.label.toLowerCase()}`
  )
);

// Dearest and cheapest rate per site hut, so the span can be named without
// listing all sixteen combinations.
const containerRates = CONTAINER_CLEANING_TIERS.flatMap((tier) =>
  CONTAINER_VISITS_PER_WEEK.map((visits) => containerCleaningPricePerUnit(tier.minUnits, visits))
).filter((price) => price !== null);
const containerFewestVisits = CONTAINER_VISITS_PER_WEEK[0];
const containerMostVisits = CONTAINER_VISITS_PER_WEEK[CONTAINER_VISITS_PER_WEEK.length - 1];

const deepExtras = joinSwedish([
  `kyl och frys invändigt utan avfrostning från ${formatPrice(DEEP_CLEANING_EXTRAS.kylFrys)}`,
  `kyl och frys med avfrostning från ${formatPrice(DEEP_CLEANING_EXTRAS.kylFrysDefrost)}`,
  `diskmaskin invändigt ${formatPrice(DEEP_CLEANING_EXTRAS.diskmaskin)}`,
  `skåp och garderober invändigt från ${formatPrice(DEEP_CLEANING_EXTRAS.kapGarderob)}`,
  `balkong eller förråd från ${formatPrice(DEEP_CLEANING_EXTRAS.forrad)}`,
  `tvättmaskin eller torktumlare invändigt ${formatPrice(DEEP_CLEANING_EXTRAS.tvattmaskin)}`,
  `väggtvätt ${formatPrice(DEEP_CLEANING_EXTRAS.vaggtvatt)} per vägg`,
]);

const moveExtras = joinSwedish([
  `kyl och frys med avfrostning ${formatPrice(MOVE_CLEANING_EXTRAS.kylFrysDefrost)}`,
  `rengöring av persienner ${formatPrice(MOVE_CLEANING_EXTRAS.persienner)}`,
  `städning av biytor som förråd, garage och balkong ${formatPrice(
    MOVE_CLEANING_EXTRAS.biytor
  )} per uppskattad timme`,
  `fönsterputsning av inglasad balkong ${formatPrice(MOVE_CLEANING_EXTRAS.inglasadBalkong)}`,
]);

/* ------------------------------ sales terms ------------------------------- */

const RUT = `Som privatperson får du RUT-avdrag på upp till 50 procent av arbetskostnaden, och vi drar av det direkt på fakturan.`;
const PRIVATE_BASIS = `Priset är inklusive moms och efter RUT-avdrag.`;
const PRIVATE_BASIS_PLURAL = `Priserna är inklusive moms och efter RUT-avdrag, så beloppet du ser är det du betalar.`;
const BUSINESS_BASIS = `Företagspriser anges exklusive moms, är alltid uppskattningar som förhandlas och RUT-avdrag gäller inte för företag eller bostadsrättsföreningar.`;
const SITE_VISIT = `Vi bokar ett kostnadsfritt platsbesök, går igenom behoven på plats och lämnar sedan en offert.`;
const MIN_HOURS = `Minsta debitering är ${MIN_BILLABLE_HOURS} timmar.`;

/* -------------------------------- services -------------------------------- */
// One entry per service on the site. `calculator` is the anchor of the price
// form on the page; a service without one is quoted.

const SERVICE_LIST = [
  {
    id: "hemstadning",
    label: "Hemstädning",
    segment: "private",
    page: "/tjanster/hemstadning",
    calculator: true,
    includes:
      "Vid varje hemstädning dammsuger vi golv och mattor, våttorkar golven, rengör köket med bänkar, spis och diskho, gör rent badrum och toalett, torkar av ytor, möbler och fönsterbrädor och tömmer soporna. Fönsterputsning och storstädning är egna tjänster som du bokar vid sidan av hemstädningen.",
    price: `Hemstädning har timpris. ${PRIVATE_BASIS} Städar vi varje vecka eller varannan vecka kostar timmen ${formatPrice(
      HOME_WEEKDAY_RATES.mondayToWednesday
    )} måndag till onsdag och ${formatPrice(
      HOME_WEEKDAY_RATES.thursdayToFriday
    )} torsdag och fredag. En gång i månaden kostar ${formatPrice(
      HOME_FREQUENCY_RATES[1]
    )} per timme, och en enstaka hemstädning ${formatPrice(
      HOME_FREQUENCY_RATES.onetime
    )} per timme – då med vårt eget städmaterial. ${MIN_HOURS} I kalkylatorn på sidan får du priset för just din bostad.`,
    extras: [
      {
        question: "Hur ofta kan jag boka?",
        answer: `Du väljer själv: varje vecka, varannan vecka, en gång i månaden eller en enstaka städning. Återkommande städning gäller tills vidare med ${NOTICE_PERIOD_MONTHS} månaders uppsägningstid, och timpriset beror på hur ofta vi kommer och vilken veckodag du väljer.`,
      },
      {
        question: "Hur lång tid tar en städning?",
        answer: `Tiden beror på bostadens storlek och hur mycket som ska göras. Kalkylatorn på sidan visar hur många timmar vi uppskattar för din bostad, och vi bekräftar tiden innan första besöket. ${MIN_HOURS}`,
      },
      {
        question: "Vem håller med städmaterial?",
        answer:
          "Vid återkommande hemstädning håller du som kund med städprodukter och medel och ser till att trasorna är tvättade till nästa tillfälle. Vill du att vi tar med produkterna debiteras de och specificeras på månadsfakturan. Vid en enstaka hemstädning använder vi vårt eget städmaterial. Vad produkterna kostar och exakt vad materialet omfattar har vi inte fastställt ännu – kontakta oss så berättar vi vad som gäller för ditt hem.",
      },
    ],
  },
  {
    id: "storstadning",
    label: "Storstädning",
    segment: "private",
    page: "/tjanster/storstadning",
    calculator: true,
    includes:
      "Storstädning är en grundligare rengöring än den vanliga hemstädningen. Vi dammsuger och våttorkar alla golv, rengör köksluckor, bänkar, spis, ugn, fläkt och kakel, gör rent badrummet med dusch, kakel, toalett, tvättställ och speglar och torkar av dörrar, lister, element, lampor, hyllor och fönsterbrädor. Fönsterputsning ingår inte i storstädningen utan bokas som egen tjänst.",
    price: `Storstädning har fast pris efter bostadens storlek: ${deepBands}. ${PRIVATE_BASIS} Är bostaden större än ${DEEP_CLEANING_QUOTE_ABOVE_AREA} kvm lämnar vi offert i stället. Tillägg väljer du i kalkylatorn på sidan.`,
    extras: [
      {
        question: "Vilka tillägg kan jag välja?",
        answer: `Till en storstädning kan du lägga till ${deepExtras}. Kyl och frys med respektive utan avfrostning är alternativ till varandra, inte två tillägg. Alla priser är inklusive moms och efter RUT-avdrag.`,
      },
      {
        question: "Hur ofta bör man storstäda?",
        answer:
          "De flesta storstädar en eller två gånger om året, till exempel inför en högtid, vid säsongsbyte eller efter en renovering. Hur ofta som passar beror på bostadens storlek, hur många ni är och om det finns husdjur.",
      },
      {
        question: "Vad händer om bostaden är extra smutsig?",
        answer:
          "Priset utgår från att bostaden är i normalt skick. Är den hårt nedsmutsad kan ett tillägg tillkomma, och du får alltid veta det innan vi börjar. Hur stort tillägget blir har vi inte fastställt ännu, så kontakta oss gärna så ser vi på bostaden först.",
      },
    ],
  },
  {
    id: "flyttstadning",
    label: "Flyttstädning",
    segment: "private",
    page: "/tjanster/flyttstadning",
    calculator: true,
    includes:
      "Vid flyttstädning rengör vi hela bostaden från golv till tak: tak, väggar, dörrar, karmar och lister, köket med vitvaror, badrummet, skåp och lådor. Fönsterputsning ingår – spröjsade fönster undantagna. Biytor som förråd, garage och balkong lägger du till vid bokningen. Av arbetsmiljöskäl flyttar vi inte tunga vitvaror.",
    price: `Flyttstädning prissätts efter bostadens storlek: ${moveBands}. ${PRIVATE_BASIS} Ett kvadratmeterpris gäller hela ytan, och priset blir aldrig lägre än toppen av föregående intervall – kalkylatorn på sidan räknar ut exakt pris för din bostad.`,
    extras: [
      {
        question: "Vilka tillägg kan jag välja?",
        answer: `Till en flyttstädning kan du lägga till ${moveExtras}. Alla priser är inklusive moms och efter RUT-avdrag.`,
      },
      {
        question: "Hur förbereder jag bostaden?",
        answer:
          "Bäst resultat får vi om bostaden är helt tom, så att vi når alla ytor. Lämna gärna el och vatten på, och berätta i förväg om du har känsliga material som marmor, mässing eller natursten. Är bostaden inte tömd städar vi runt det som står kvar – säg bara till i förväg så planerar vi besöket efter det.",
      },
      {
        question: "Kan ni ta bort fläckar på väggarna?",
        answer:
          "Vi tar bort synliga fläckar på väggar och tak i den mån det går utan att skada ytan. Kraftiga fläckar, missfärgningar, färg, fett och skador ingår inte i städningen.",
      },
      {
        question: "Gäller det här även för företagslokaler?",
        answer:
          "Nej. Priserna och kalkylatorn här gäller bostäder. Ska ett företag eller en bostadsrättsförening flyttstäda en lokal är det en egen tjänst som vi alltid offererar efter ett platsbesök.",
        links: [{ href: "/foretag/flyttstadning", label: "Flyttstädning för företag" }],
      },
    ],
  },
  {
    id: "fonsterputs",
    label: "Fönsterputsning",
    segment: "private",
    page: "/tjanster/fonsterputs",
    calculator: true,
    includes:
      "Vi putsar fönstren på in- och utsidan, rengör bågarna, torkar av karmar och kanter och dammar av persiennerna.",
    price: `Fönsterputsning har fast pris efter antal rum: ${windowRoomBands}. ${PRIVATE_BASIS} Har bostaden ${WINDOW_QUOTE_FROM_ROOMS} rum och kök eller fler, eller är den större än ${WINDOW_QUOTE_ABOVE_AREA} kvm, lämnar vi offert. Vill du bara få en inglasad balkong putsad kostar det från ${formatPrice(
      WINDOW_BALCONY_PRICE
    )}.`,
    extras: [
      {
        question: "Vilka tillägg finns det?",
        answer: `Spröjs, takhöjd över 280 cm och treglasfönster eller fler ger ${WINDOW_SURCHARGE_PERCENT} procent tillägg vardera, räknat på grundpriset. Har du två av dem blir tillägget ${
          2 * WINDOW_SURCHARGE_PERCENT
        } procent – de läggs till var för sig och räknas inte på varandra. Du väljer tilläggen i kalkylatorn på sidan.`,
      },
      {
        question: "Hur ofta bör jag putsa fönster?",
        answer:
          "De flesta putsar fönstren två till fyra gånger om året, ofta på våren och på hösten. Bor du nära en större väg eller vid vatten kan det behövas lite oftare.",
      },
      {
        question: "Behöver jag förbereda något?",
        answer:
          "Flytta gärna undan gardiner, blommor och saker från fönsterbrädorna så att vi kommer åt. Berätta i förväg om du har känsliga material som marmor eller natursten. Vi tar med allt material och alla redskap som behövs.",
      },
      {
        question: "Gäller det här även för företagslokaler?",
        answer:
          "Nej. Rumspriserna här gäller bostäder. Fönsterputsning för företag och bostadsrättsföreningar är en egen tjänst som vi offererar efter ett platsbesök, exklusive moms.",
        links: [{ href: "/foretag/fonsterputs", label: "Fönsterputsning för företag" }],
      },
    ],
  },
  {
    id: "flytthjalp",
    label: "Flytthjälp",
    segment: "private",
    page: "/tjanster/flytthjalp",
    calculator: false,
    includes:
      "Vi hjälper till med packning vid behov, transport av möbler och tillhörigheter, bärhjälp och lastning samt montering och demontering av möbler. Vi tar både mindre flyttar och större uppdrag, och många kombinerar flytthjälpen med en flyttstädning.",
    price: `Flytthjälp har ingen prislista – priset beror på hur mycket som ska flyttas, hur långt och hur många vi behöver vara. ${SITE_VISIT} Om RUT-avdrag kan användas för just din flytt tar vi upp det i offerten.`,
    extras: [
      {
        question: "Kan jag boka flytthjälp och flyttstädning tillsammans?",
        answer:
          "Ja, det är vanligt och ofta smidigast: vi flyttar ut och flyttstädar bostaden efteråt. Berätta i förfrågan att du vill ha båda, så planerar vi dagarna i rätt ordning och lämnar pris på allt.",
        links: [{ href: "/tjanster/flyttstadning", label: "Flyttstädning för privatpersoner" }],
      },
    ],
  },
  {
    id: "mattvatt",
    label: "Mattvätt",
    segment: "private",
    page: "/tjanster/mattvatt",
    calculator: false,
    includes:
      "Vi djuprengör mattan, tar bort fläckar och smuts och anpassar metoden efter mattans material. Resultatet blir en fräschare matta, bättre inomhusmiljö och längre livslängd.",
    price: `Mattvätt har ingen prislista – priset beror på mattans storlek, material och skick. ${SITE_VISIT} Vi tar både enstaka tvättar och återkommande underhåll.`,
    extras: [],
  },
  {
    id: "tradgardsskotsel",
    label: "Trädgårdsskötsel",
    segment: "private",
    page: "/tjanster/tradgardsskotsel",
    calculator: false,
    includes:
      "Vi klipper gräs, rensar ogräs, beskär buskar och träd, krattar löv, städar trädgården och sköter allmänt underhåll under hela säsongen.",
    price: `Trädgårdsskötsel har ingen prislista – priset beror på trädgårdens storlek och vad som ska göras. ${SITE_VISIT} ${RUT} Avdraget gäller löpande underhåll som gräsklippning, ogräsrensning och beskärning, men inte nyanläggning eller större förändringar av trädgården.`,
    extras: [],
  },
  {
    id: "snorojning",
    label: "Snöröjning",
    segment: "private",
    page: "/tjanster/snorojning",
    calculator: false,
    includes:
      "Vi skottar gångvägar och entréer, plogar parkeringar och uppfarter och halkbekämpar med sand eller salt. Vi röjer både vid snöfall enligt avtal och vid akuta behov.",
    price: `Snöröjning har ingen prislista – priset beror på ytan, hur ofta vi ska komma och väderförhållandena. ${SITE_VISIT} Som privatperson kan du i vissa fall använda RUT-avdrag för snöröjning av tomt och uppfart i direkt anslutning till bostaden; för gemensamma ytor som tillhör en förening eller ett företag gäller avdraget inte.`,
    extras: [
      {
        question: "Kan vi teckna avtal för hela vintern?",
        answer:
          "Ja. Vi erbjuder både enstaka uppdrag och löpande snöröjning enligt avtal, anpassat efter fastighetens behov. Skicka in en förfrågan före säsongen så hinner vi planera in er.",
      },
    ],
  },
  {
    id: "kontorsstadning",
    label: "Kontorsstädning",
    segment: "business",
    page: "/foretag/kontorsstadning",
    calculator: true,
    includes:
      "Kontorsstädning omfattar dammsugning och våttorkning av golv, tömning av papperskorgar, rengöring av kök och personalutrymmen, rengöring av toaletter och hygienutrymmen, avtorkning av skrivbord och ytor samt påfyllning av förbrukningsmaterial vid behov.",
    price: `Kontorsstädning prissätts per timme. Kalkylatorn på sidan räknar med ${officeRates}, och ${MIN_HOURS.toLowerCase()} ${BUSINESS_BASIS} ${SITE_VISIT}`,
    extras: [
      {
        question: "Hur ofta kan ni komma?",
        answer:
          "Vi lägger upp städningen efter verksamheten – allt från en gång i månaden till flera gånger i veckan, före eller efter arbetsdagen. Berätta hur lokalen används så föreslår vi ett schema i offerten.",
      },
      {
        question: "Hur får vi en offert?",
        answer: `${SITE_VISIT} Kalkylatorn på sidan ger er en första uppskattning, men det är offerten som gäller. ${BUSINESS_BASIS}`,
      },
    ],
  },
  {
    id: "bodstadning",
    label: "Bodstädning och byggstädning",
    menuLabel: "Bodstädning och byggstädning",
    segment: "business",
    page: "/foretag/bodstadning",
    calculator: true,
    includes:
      "Vi städar bodar, baracker och personalutrymmen, sköter löpande städning under byggprojektet och gör slutstädning inför överlämning. Vi tar bort byggdamm och smuts, dammsuger och våttorkar golv och ytor, rengör dörrar, karmar och fasta installationer samt kök och hygienutrymmen, och hanterar avfall vid behov.",
    price: `Bodstädning prissätts per bod och städning, och priset beror på antal bodar och hur ofta vi kommer: från ${formatPrice(
      Math.max(...containerRates)
    )} per bod vid få bodar och ${containerFewestVisits} städning i veckan, ner till ${formatPrice(
      Math.min(...containerRates)
    )} per bod vid många bodar och ${containerMostVisits} städningar i veckan. Månadspriset är pris per bod gånger antal bodar gånger städningar per vecka gånger ${CONTAINER_WEEKS_PER_MONTH} veckor. Har ni fler än ${CONTAINER_MAX_UNITS_ONLINE} bodar lämnar vi offert. ${BUSINESS_BASIS}`,
    extras: [
      {
        question: "Vad gäller för byggstädning och slutstädning?",
        answer: `Byggstädning och slutstädning inför överlämning har ingen prislista – omfattningen skiljer sig för mycket mellan projekten. ${SITE_VISIT} ${BUSINESS_BASIS}`,
      },
    ],
  },
  {
    id: "trappstadning",
    label: "Trappstädning",
    segment: "business",
    page: "/foretag/trappstadning",
    calculator: false,
    includes:
      "Vi sopar och våttorkar trappor och golv, rengör entréer och hissar, torkar av räcken, dörrar och handtag, gör rent lister, fönsterbrädor och andra ytor och tömmer papperskorgar vid behov.",
    price: `Trappstädning prissätts efter fastigheten – antal trapphus, våningar och hur ofta vi ska komma. ${SITE_VISIT} Vi städar enligt schema, till exempel en eller flera gånger per vecka. ${BUSINESS_BASIS}`,
    extras: [],
  },
  {
    id: "golvvard",
    label: "Golvvård",
    segment: "business",
    page: "/foretag/golvvard",
    calculator: false,
    includes:
      "Vi gör maskinell rengöring av golv, polering och ytbehandling, vaxning och boning samt djuprengöring av slitna golv. Vi arbetar med plastgolv, laminatgolv, trägolv, stengolv och klinker.",
    price: `Golvvård prissätts efter golvtyp, yta och hur slitet golvet är. ${SITE_VISIT} Vi tar både enstaka behandlingar och löpande underhåll. ${BUSINESS_BASIS}`,
    extras: [],
  },
  {
    id: "byggtjanster",
    label: "Byggtjänster",
    segment: "business",
    page: "/foretag/byggtjanster",
    calculator: false,
    includes:
      "Vi utför mindre byggarbeten och renoveringar, reparationer och underhåll, montering och demontering, snickeriarbeten och måleriarbeten, inklusive målning av väggar, tak och snickerier.",
    price: `Byggtjänster prissätts efter projektets omfattning och har ingen prislista. ${SITE_VISIT} Privatpersoner kan i många fall använda ROT-avdrag och få upp till 30 procent avdrag på arbetskostnaden, och vi hanterar avdraget på fakturan. För företag och föreningar anges priset exklusive moms.`,
    extras: [],
  },
  {
    id: "foretag-flyttstadning",
    label: "Flyttstädning för företag",
    segment: "business",
    page: "/foretag/flyttstadning",
    calculator: false,
    includes:
      "Vi rengör lokalen från golv till tak: alla ytor, dammsugning och våttorkning av golv, dörrar, karmar, lister och kontaktpunkter, fönsterputsning in- och utvändigt, kök och personalutrymmen, toaletter och hygienutrymmen samt skåp, hyllor och fasta installationer. Vi kan också hjälpa till med själva flytten.",
    price: `Flyttstädning av en lokal har ingen prislista – priset beror på lokalens storlek, skick och vad besiktningen kräver. ${SITE_VISIT} ${BUSINESS_BASIS} Fast pris och kalkylator finns bara för flyttstädning av bostäder, som är en annan tjänst.`,
    extras: [
      {
        question: "Jag ska flyttstäda en bostad – gäller det här?",
        answer:
          "Nej. Den här tjänsten gäller företagslokaler. För bostäder har vi fast pris efter storlek, inklusive moms och efter RUT-avdrag, och du räknar ut priset direkt i kalkylatorn.",
        links: [{ href: "/tjanster/flyttstadning", label: "Flyttstädning för privatpersoner" }],
      },
    ],
  },
  {
    id: "foretag-fonsterputs",
    label: "Fönsterputsning för företag",
    segment: "business",
    page: "/foretag/fonsterputs",
    calculator: false,
    includes:
      "Vi putsar fönstren in- och utvändigt, rengör glasytorna till ett klart och fläckfritt resultat och torkar av karmar och kanter. Vi tar både enstaka uppdrag och regelbunden putsning enligt schema, med tider som stör verksamheten så lite som möjligt.",
    price: `Fönsterputsning för företag har ingen prislista – priset beror på antal fönster, höjd, åtkomst och hur ofta vi ska komma. ${SITE_VISIT} ${BUSINESS_BASIS} Rumspriserna på vår sida för privatpersoner gäller bara bostäder.`,
    extras: [
      {
        question: "Jag bor i lägenhet – gäller det här?",
        answer: `Nej. För bostäder har vi fast pris efter antal rum, inklusive moms och efter RUT-avdrag, och ${WINDOW_QUOTE_FROM_ROOMS} rum och kök eller mer än ${WINDOW_QUOTE_ABOVE_AREA} kvm offereras.`,
        links: [{ href: "/tjanster/fonsterputs", label: "Fönsterputsning för privatpersoner" }],
      },
    ],
  },
];

/** Every service the bot can talk about. @type {ReadonlyArray<Object>} */
export const CHAT_SERVICES = Object.freeze(
  SERVICE_LIST.map((service) => Object.freeze({ ...service }))
);

/* --------------------------------- nodes ---------------------------------- */

const nodes = new Map();

function node(id, message, { links = [], options }) {
  if (nodes.has(id)) throw new Error(`lib/chatbot/tree.js: duplicate node "${id}"`);
  if (!options.length) throw new Error(`lib/chatbot/tree.js: node "${id}" has no way out`);
  nodes.set(
    id,
    Object.freeze({
      id,
      message,
      links: Object.freeze(links.map((link) => Object.freeze({ ...link }))),
      options: Object.freeze(options.map((option) => Object.freeze({ ...option }))),
    })
  );
}

const toRoot = { label: "Till huvudmenyn", next: ROOT_ID };
const toQuote = { label: "Begär offert", next: QUOTE_ID };
const toContact = { label: "Kontakta oss", next: CONTACT_ID };

const serviceId = (service) => `tjanst.${service.id}`;
const menuOf = (service) => (service.segment === "private" ? PRIVATE_MENU_ID : BUSINESS_MENU_ID);

// Page link plus, when the page prices the service itself, the calculator.
function serviceLinks(service) {
  const links = [{ href: service.page, label: `Läs mer om ${service.label.toLowerCase()}` }];
  if (service.calculator) {
    links.push({ href: `${service.page}#berakna-pris`, label: "Räkna ut ditt pris" });
  }
  return links;
}

/* root */

node(
  ROOT_ID,
  "Hej och välkommen till Aurel Städ & Allservice! Jag svarar på frågor om alla våra tjänster, vad de kostar och hur du bokar. Vad vill du veta mer om?",
  {
    options: [
      { label: "Tjänster för privatpersoner", next: PRIVATE_MENU_ID },
      { label: "Tjänster för företag och BRF", next: BUSINESS_MENU_ID },
      { label: "Priser, RUT och betalning", next: "info.priser" },
      { label: "Boka, avboka och garanti", next: "info.boka" },
      toQuote,
      toContact,
    ],
  }
);

/* service menus */

const servicesIn = (segment) => SERVICE_LIST.filter((service) => service.segment === segment);

node(
  PRIVATE_MENU_ID,
  `Det här gör vi för dig som privatperson. ${PRIVATE_BASIS_PLURAL} Vilken tjänst gäller det?`,
  {
    links: [{ href: "/tjanster", label: "Alla tjänster för privatpersoner" }],
    options: [
      ...servicesIn("private").map((service) => ({
        label: service.menuLabel || service.label,
        next: serviceId(service),
      })),
      { label: "Tjänster för företag och BRF", next: BUSINESS_MENU_ID },
      toRoot,
    ],
  }
);

node(
  BUSINESS_MENU_ID,
  "Det här gör vi för företag, bostadsrättsföreningar och fastighetsägare. Priserna anges exklusive moms, de är uppskattningar som vi förhandlar, och vi lämnar alltid offert efter ett kostnadsfritt platsbesök. RUT-avdrag gäller inte för företag. Vilken tjänst gäller det?",
  {
    links: [{ href: "/foretag", label: "Alla tjänster för företag och BRF" }],
    options: [
      ...servicesIn("business").map((service) => ({
        label: service.menuLabel || service.label,
        next: serviceId(service),
      })),
      { label: "Tjänster för privatpersoner", next: PRIVATE_MENU_ID },
      toRoot,
    ],
  }
);

/* one menu and one answer node per service */

for (const service of SERVICE_LIST) {
  const base = serviceId(service);
  const links = serviceLinks(service);
  const back = {
    label: `Fler frågor om ${service.label.toLowerCase()}`,
    next: base,
  };
  const answer = (id, message, extraLinks = []) =>
    node(id, message, { links: [...links, ...extraLinks], options: [back, toQuote, toContact] });

  answer(`${base}.ingar`, service.includes);
  answer(`${base}.pris`, service.price);
  service.extras.forEach((extra, index) => {
    answer(`${base}.fraga${index + 1}`, extra.answer, extra.links || []);
  });

  node(base,`Vad vill du veta om ${service.label.toLowerCase()}?`, {
    links,
    options: [
      { label: `Vad ingår i ${service.label.toLowerCase()}?`, next: `${base}.ingar` },
      {
        label: service.calculator ? `Vad kostar ${service.label.toLowerCase()}?` : "Vad kostar det?",
        next: `${base}.pris`,
      },
      ...service.extras.map((extra, index) => ({
        label: extra.question,
        next: `${base}.fraga${index + 1}`,
      })),
      { label: "Hur bokar jag?", next: "info.hurbokar" },
      toQuote,
      { label: "Tillbaka till tjänsterna", next: menuOf(service) },
      toRoot,
    ],
  });
}

/* quote and contact: the way out from anywhere */

node(
  QUOTE_ID,
  `Att begära offert är kostnadsfritt. Beskriv vad du behöver hjälp med i formuläret på kontaktsidan, eller ring ${PHONE}. Vid större uppdrag bokar vi ett kostnadsfritt platsbesök först, så att priset stämmer med verkligheten. För privatpersoner anges offerten inklusive moms och efter RUT-avdrag, för företag exklusive moms.`,
  {
    links: [{ href: "/kontakt", label: "Skicka din förfrågan" }],
    options: [
      { label: "Tjänster för privatpersoner", next: PRIVATE_MENU_ID },
      { label: "Tjänster för företag och BRF", next: BUSINESS_MENU_ID },
      toContact,
      toRoot,
    ],
  }
);

node(
  CONTACT_ID,
  `Du når oss på ${PHONE} och ${EMAIL}, eller via formuläret på kontaktsidan. Vi svarar så snart vi kan, och vid större uppdrag bokar vi gärna ett kostnadsfritt platsbesök. Kan jag inte svara på din fråga här är det alltid bäst att höra av dig – då får du svar av en människa.`,
  {
    links: [
      { href: "/kontakt", label: "Till kontaktsidan" },
      { href: "/vanliga-fragor", label: "Vanliga frågor och svar" },
    ],
    options: [toQuote, { label: "Tjänster för privatpersoner", next: PRIVATE_MENU_ID }, toRoot],
  }
);

/* general questions */

const infoLinks = [{ href: "/vanliga-fragor", label: "Fler vanliga frågor" }];

function info(id, message, links = infoLinks) {
  node(id, message, {
    links,
    options: [
      { label: "Fler frågor om priser", next: "info.priser" },
      { label: "Fler frågor om bokning", next: "info.boka" },
      toContact,
      toRoot,
    ],
  });
}

node("info.priser", "Vad vill du veta om priser, avdrag och betalning?", {
  links: infoLinks,
  options: [
    { label: "Hur fungerar RUT-avdraget?", next: "info.rut" },
    { label: "Är priserna med eller utan moms?", next: "info.moms" },
    { label: "Vad gäller för företagspriser?", next: "info.foretagspris" },
    { label: "Finns det någon rabatt?", next: "info.rabatt" },
    { label: "Minsta debitering", next: "info.minsta" },
    { label: "Hur betalar jag?", next: "info.betalning" },
    { label: "Vilka områden täcker ni?", next: "info.omrade" },
    toQuote,
    toRoot,
  ],
});

node("info.boka", "Vad vill du veta om bokning, villkor och garanti?", {
  links: infoLinks,
  options: [
    { label: "Hur bokar jag?", next: "info.hurbokar" },
    { label: "Vilka tider kan jag boka?", next: "info.tider" },
    { label: "Hur avbokar jag?", next: "info.avbokning" },
    { label: "Binder jag mig vid återkommande städning?", next: "info.avtal" },
    { label: "Vad gäller om jag inte är nöjd?", next: "info.garanti" },
    { label: "Vem håller med städmaterial?", next: "info.material" },
    { label: "Nycklar och tillträde", next: "info.nycklar" },
    { label: "Är ni försäkrade?", next: "info.forsakring" },
    { label: "Jag har husdjur – går det bra?", next: "info.husdjur" },
    { label: "Vilka språk talar ni?", next: "info.sprak" },
    toRoot,
  ],
});

info(
  "info.rut",
  `${RUT} Avdraget gäller hushållsnära tjänster som hemstädning, storstädning, flyttstädning, fönsterputsning och trädgårdsskötsel, och i vissa fall snöröjning av tomt och uppfart vid bostaden. Därför är alla priser för privatpersoner på webbplatsen redan efter avdrag. Vi sköter ansökan hos Skatteverket och behöver ditt personnummer för det, och avdraget förutsätter att du har kvar utrymme för året. För företag och bostadsrättsföreningar gäller RUT-avdrag inte.`
);

info(
  "info.moms",
  `Priserna för privatpersoner anges inklusive moms och efter RUT-avdrag – beloppet du ser i kalkylatorn är det du betalar. ${BUSINESS_BASIS}`
);

info("info.foretagspris", `${BUSINESS_BASIS} ${SITE_VISIT} Kalkylatorerna för kontorsstädning och bodstädning ger er en uppskattning av månadskostnaden, men det är offerten som gäller.`);

info(
  "info.rabatt",
  `Du får ${FIRST_CLEANING_DISCOUNT_PERCENT} procent rabatt på din första städning. Säg till när du bokar att det är första gången, så lägger vi in rabatten på fakturan.`
);

info("info.minsta", `${MIN_HOURS} Det gäller alla tjänster, även en enstaka städning: blir uppdraget kortare än så debiterar vi ändå ${MIN_BILLABLE_HOURS} timmar.`);

info(
  "info.betalning",
  `Du betalar mot faktura med ${PAYMENT_TERMS_DAYS} dagars betalningstid. Fakturaavgiften är ${formatPrice(
    INVOICE_FEE
  )}, och vid försenad betalning debiteras dröjsmålsränta enligt räntelagen. RUT-avdraget är redan draget på fakturan, och återkommande hemstädning faktureras månadsvis. Vilka betalningssätt som finns i övrigt och hur enstaka uppdrag faktureras kan jag inte svara på här – kontakta oss så får du det bekräftat.`,
  [{ href: "/allmanna-villkor", label: "Våra allmänna villkor" }]
);

info(
  "info.omrade",
  "Vi arbetar i Stockholm med omnejd. Exakt vilka områden vi täcker just nu, och om det tillkommer något för längre resor, kan jag inte svara på här – skicka en förfrågan med adressen så får du svar direkt."
);

info(
  "info.hurbokar",
  `För hemstädning, storstädning, flyttstädning, fönsterputsning, kontorsstädning och bodstädning räknar du ut priset i kalkylatorn på tjänstens sida och skickar bokningen därifrån. Övriga tjänster bokar du genom att begära offert. Vi bekräftar alltid dag och tid innan besöket.`
);

info(
  "info.tider",
  `Du väljer en starttid ${BOOKING_WINDOW}, måndag till fredag. Lördagar och söndagar går inte att boka online. Tiden måste ligga minst ${LEAD_DAYS} dagar framåt, så att vi hinner planera in uppdraget, och vi bekräftar den alltid innan besöket.`
);

info(
  "info.avbokning",
  `Avboka eller boka om senast ${CANCELLATION_NOTICE_DAYS} dagar före den bokade tiden – ring ${PHONE} eller mejla ${EMAIL}. Behöver du avboka senare än så kan en avgift tillkomma; hur stor den är kan jag inte svara på här, så hör av dig till oss och vi går igenom vad som gäller för din bokning.`,
  [{ href: "/allmanna-villkor", label: "Våra allmänna villkor" }]
);

info(
  "info.avtal",
  `Återkommande städning, till exempel hemstädning varje eller varannan vecka, gäller tills vidare med ${NOTICE_PERIOD_MONTHS} månaders uppsägningstid. Uppsägningen skickar du till ${EMAIL}. Hur avtalet tecknas i övrigt kan jag inte svara på här – kontakta oss så går vi igenom det innan du bokar.`,
  [{ href: "/allmanna-villkor", label: "Våra allmänna villkor" }]
);

info(
  "info.garanti",
  "Vi lämnar nöjd kund-garanti. Hör av dig inom 24 timmar efter städningen och berätta vad som inte blev bra, så åtgärdar vi det. Hur snabbt vi kan vara på plats igen och de fullständiga garantivillkoren bekräftar vi när du kontaktar oss."
);

info(
  "info.material",
  "Vid återkommande hemstädning håller du som kund med städprodukter och medel och ser till att trasorna är tvättade till nästa tillfälle; vill du att vi tar med produkterna debiteras de och specificeras på månadsfakturan. Vid en enstaka hemstädning och vid storstädning använder vi vårt eget material och våra egna redskap. Vad produkterna kostar, och om detsamma gäller vid flyttstädning och fönsterputsning, kan jag inte svara på här – kontakta oss så får du det bekräftat."
);

info(
  "info.nycklar",
  "Vi behöver kunna komma in vid den bokade tiden. Du kan vara hemma när vi städar eller lämna en nyckel till oss. Lämnar du en nyckel skriver vi en nyckelkvittens, märker nyckeln med en intern kod – aldrig med namn eller adress – och förvarar den säkert; när avtalet upphör får du tillbaka den. Vilka sätt att lämna tillträde vi erbjuder i dag kan jag inte svara på här, så kontakta oss gärna."
);

info(
  "info.forsakring",
  "Ja, Aurel Städ & Allservice AB har ansvarsförsäkring, och skulle något skadas i samband med vårt arbete vill vi att du kontaktar oss så snart som möjligt. Vilket försäkringsbolag vi har, exakt vad försäkringen täcker och eventuell självrisk kan jag inte svara på här – kontakta oss så får du uppgifterna."
);

info(
  "info.husdjur",
  "Berätta gärna redan när du bokar om du har husdjur, så planerar vi besöket efter det. Om det finns några särskilda villkor för städning i hem med husdjur kan jag inte svara på här – kontakta oss så får du det bekräftat."
);

info(
  "info.sprak",
  "Du kan alltid kontakta oss på svenska, och vi svarar på telefon, mejl och via formuläret. Vilka fler språk vår personal talar kan jag inte svara på här – skriv på det språk du föredrar i formuläret så återkommer vi."
);

/* -------------------------------- exports --------------------------------- */

/** Every node, by id. @type {Readonly<Record<string, ChatNode>>} */
export const CHAT_NODES = Object.freeze(Object.fromEntries(nodes));

/**
 * The whole conversation.
 * @type {Readonly<{ rootId: string, nodes: Readonly<Record<string, ChatNode>> }>}
 */
export const CHAT_TREE = Object.freeze({ rootId: ROOT_ID, nodes: CHAT_NODES });

/**
 * One node by id.
 * @param {string} id
 * @returns {ChatNode|null}
 */
export function chatNode(id) {
  return CHAT_NODES[id] || null;
}
