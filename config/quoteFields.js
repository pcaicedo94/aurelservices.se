// Service-specific questions for the quote popup (QuoteModal `fields`).
//
// Why this file exists: the popup used to mail the office nothing but the
// service name and the address, so an enquiry for byggstädning, trappstädning
// or mattvätt always started with a phone call to find out what the job even
// was — a flat or a whole property, a finished build or one still running.
// Each list below asks the two to four things a quote for that service really
// depends on, and every answer becomes a row in the mail to the office.
//
// Rules this file follows:
//  - Nothing is asked that the service page itself does not cover. Where the
//    page gives no ground for a question, the question is left out.
//  - Every field is optional. Someone who does not know the area must still be
//    able to send the request; a lead form that blocks is worse than an
//    incomplete one. Name, phone, e-mail and address stay the required ones.
//  - `label` is the key of the row in the mail, so it reads as a Swedish
//    question, not as a code name. An unanswered field sends no row.
//  - The six pages with a calculator already mail size, frequency, extras, the
//    wanted date and the estimated price through `details`. The lists here
//    never ask any of that again.
//
//   import { QUOTE_FIELDS } from "../../config/quoteFields";
//   <QuoteModal ... fields={QUOTE_FIELDS["/foretag/byggstadning"]} />

// Shared option lists, so the same question reads the same way on every page.
const PREMISES = ["Kontor", "Butik", "Restaurang eller café", "Lager eller industrilokal", "Annan lokal"];
const ONE_OFF_OR_RECURRING = ["Enstaka uppdrag", "Regelbundet enligt schema", "Vet inte än"];
const AREA_HINT = "Osäker på ytan? Lämna fältet tomt – vi räknar på platsbesöket.";
// Date fields are pickers, and a picker cannot say "så snart som möjligt". The
// way out of that is the same everywhere: leave it empty and write it down.
const DATE_HINT = "Inte bestämt än? Lämna fältet tomt och beskriv tidsplanen i meddelandet.";

export const QUOTE_FIELDS = {
  // The start page hero is not a service page: the popup opens with "Städning i
  // Stockholm", so the one thing the office cannot guess is which service the
  // visitor means. The options are the site's own service pages.
  "/": [
    {
      name: "service",
      label: "Vilken tjänst gäller det?",
      type: "select",
      options: [
        "Hemstädning",
        "Storstädning",
        "Flyttstädning",
        "Fönsterputsning",
        "Kontorsstädning",
        "Trappstädning",
        "Byggstädning",
        "Bodstädning",
        "Flytthjälp",
        "Mattvätt",
        "Golvvård",
        "Snöröjning",
        "Trädgårdsskötsel",
        "Byggtjänster",
        "Annat – jag beskriver nedan",
      ],
    },
    {
      name: "placeType",
      label: "Gäller det ett hem eller en lokal?",
      type: "select",
      options: ["Ett hem", "En lokal eller ett kontor", "En fastighet eller en BRF"],
    },
  ],

  // Page: byggstädning after nybyggnation, renovering and ombyggnation, both as
  // löpande städning while the build runs and as slutstädning when it is done,
  // on everything from a flat to a larger byggprojekt. The page itself asks the
  // visitor to say what is to be cleaned and when the build is finished.
  "/foretag/byggstadning": [
    {
      name: "projectType",
      label: "Typ av projekt",
      type: "select",
      options: ["Lägenhet", "Lokal eller kontor", "Hus eller villa", "Större byggprojekt eller fastighet"],
    },
    { name: "area", label: "Ungefärlig yta (m²)", type: "number", placeholder: "T.ex. 120", hint: AREA_HINT },
    {
      name: "stage",
      label: "Var i projektet är ni?",
      type: "select",
      options: [
        "Bygget pågår – löpande byggstädning",
        "Bygget är klart – slutstädning",
        "Både löpande städning och slutstädning",
      ],
    },
    { name: "when", label: "När behöver ni städningen?", type: "date", hint: DATE_HINT },
  ],

  // Page: trapphus, entréer och hissar för fastighetsägare, BRF och företag,
  // städat enligt schema en eller flera gånger per vecka.
  "/foretag/trappstadning": [
    { name: "entrances", label: "Antal uppgångar", type: "number", placeholder: "T.ex. 3" },
    { name: "floors", label: "Antal våningar per uppgång", type: "number", placeholder: "T.ex. 5" },
    {
      name: "frequency",
      label: "Hur ofta ska det städas?",
      type: "select",
      options: [
        "Tre gånger per vecka eller mer",
        "Två gånger per vecka",
        "En gång per vecka",
        "Varannan vecka",
        "En gång per månad",
        "Vet inte än",
      ],
    },
    { name: "elevator", label: "Finns det hiss?", type: "select", options: ["Ja", "Nej", "Vet inte"] },
  ],

  // Page: offert baserad på mattans storlek och skick, med metod anpassad efter
  // material.
  "/tjanster/mattvatt": [
    { name: "carpets", label: "Antal mattor", type: "number", placeholder: "T.ex. 2" },
    {
      name: "measurements",
      // "Ungefärliga mått" alone was answered with a bare "20", which the
      // office cannot read: 20 m², 20 cm or a 20-metre runner. The unit and
      // the two sides are now part of the question.
      label: "Ungefärliga mått i meter (längd x bredd)",
      type: "text",
      placeholder: "T.ex. 2 x 3 meter",
      hint: "Inte kvadratmeter. Har du flera mattor? Ange måtten för var och en.",
    },
    {
      name: "material",
      label: "Material, om du vet",
      type: "text",
      placeholder: "T.ex. ull, syntet eller siden",
    },
  ],

  // Page: offert baserad på golvtyp och omfattning, för plast, laminat, trä och
  // sten eller klinker, som enstaka behandling eller löpande underhåll.
  "/foretag/golvvard": [
    {
      name: "floorType",
      label: "Typ av golv",
      type: "select",
      options: ["Plastgolv", "Laminatgolv", "Trägolv", "Stengolv eller klinker", "Flera olika golvtyper", "Vet inte"],
    },
    { name: "area", label: "Ungefärlig yta (m²)", type: "number", placeholder: "T.ex. 200", hint: AREA_HINT },
    {
      name: "scope",
      label: "Enstaka behandling eller löpande underhåll?",
      type: "select",
      options: ["Enstaka behandling", "Löpande underhåll", "Vet inte än"],
    },
  ],

  // Page: packning, transport, bärhjälp och montering, både mindre flyttar och
  // större uppdrag. The address field on this page asks where the move starts,
  // so only the destination is asked here.
  "/tjanster/flytthjalp": [
    {
      name: "destination",
      label: "Flytt till (adress eller område)",
      type: "text",
      placeholder: "T.ex. Solna eller Storgatan 5, Stockholm",
    },
    {
      name: "homeSize",
      label: "Bostadens storlek",
      type: "select",
      options: ["1–2 rum", "3–4 rum", "5 rum eller mer", "Kontor eller lokal", "Vet inte"],
    },
    {
      name: "elevator",
      label: "Finns det hiss?",
      type: "select",
      options: [
        "Ja, på båda adresserna",
        "Ja, på en av adresserna",
        "Nej, inte på någon av adresserna",
        "Vet inte",
      ],
    },
  ],

  // Page: gångvägar, entréer, parkeringar och uppfarter, med offert baserad på
  // yta och behov, som löpande snöröjning enligt avtal eller enstaka uppdrag.
  "/tjanster/snorojning": [
    {
      name: "surfaces",
      label: "Vad ska röjas?",
      type: "select",
      options: [
        "Uppfart och gångväg vid bostaden",
        "Parkering",
        "Gångvägar och entréer",
        "Hela fastighetens ytor",
        "Flera av dessa",
      ],
    },
    { name: "area", label: "Ungefärlig yta (m²)", type: "number", placeholder: "T.ex. 300", hint: AREA_HINT },
    {
      name: "agreement",
      label: "Säsongsavtal eller enstaka insats?",
      type: "select",
      options: ["Säsongsavtal för hela vintern", "Enstaka insats", "Vet inte än"],
    },
  ],

  // Page: gräsklippning, ogräsrensning, beskärning och lövkrattning, med RUT på
  // löpande underhåll och offert baserad på arbetets omfattning.
  "/tjanster/tradgardsskotsel": [
    {
      name: "gardenSize",
      label: "Trädgårdens ungefärliga storlek (m²)",
      type: "number",
      placeholder: "T.ex. 400",
      hint: "Osäker på storleken? Lämna fältet tomt – vi räknar på platsbesöket.",
    },
    {
      name: "work",
      label: "Vad behöver du hjälp med?",
      type: "select",
      options: [
        "Gräsklippning",
        "Ogräsrensning",
        "Beskärning av buskar och träd",
        "Lövkrattning och trädgårdsstädning",
        "Allmänt underhåll",
        "Flera av dessa",
      ],
      hint: "Gäller det flera saker? Välj det viktigaste och beskriv resten i meddelandet.",
    },
    {
      name: "scope",
      label: "Enstaka tillfälle eller löpande skötsel?",
      type: "select",
      options: ["Enstaka tillfälle", "Löpande under säsongen", "Vet inte än"],
    },
  ],

  // Page: renovering, reparationer, montering, snickeri och måleri through the
  // partner companies, for företag, BRF och privatpersoner.
  "/foretag/byggtjanster": [
    {
      name: "work",
      label: "Typ av arbete",
      type: "select",
      options: [
        "Renovering eller mindre byggarbete",
        "Reparation och underhåll",
        "Montering eller demontering",
        "Snickeriarbete",
        "Måleriarbete",
        "Annat byggrelaterat arbete",
      ],
    },
    {
      name: "place",
      label: "Var ska arbetet utföras?",
      type: "select",
      options: ["Lägenhet", "Villa eller hus", "Lokal eller kontor", "Gemensamma utrymmen i en fastighet"],
    },
    { name: "when", label: "När vill du att arbetet utförs?", type: "date", hint: DATE_HINT },
  ],

  // Page: flyttstädning av en lokal inför överlämning och besiktning, med
  // skräddarsydd offert baserad på lokalens behov.
  "/foretag/flyttstadning": [
    { name: "premises", label: "Typ av lokal", type: "select", options: PREMISES },
    { name: "area", label: "Ungefärlig yta (m²)", type: "number", placeholder: "T.ex. 250", hint: AREA_HINT },
    { name: "handover", label: "När ska lokalen lämnas?", type: "date", hint: DATE_HINT },
  ],

  // Page: fönsterputs invändigt och utvändigt, som enstaka uppdrag eller
  // regelbundet enligt schema. The number of windows, not the floor area, is
  // what the job is measured in.
  "/foretag/fonsterputs": [
    { name: "premises", label: "Typ av lokal", type: "select", options: PREMISES },
    {
      name: "windows",
      label: "Ungefärligt antal fönster",
      type: "number",
      placeholder: "T.ex. 20",
      hint: "Osäker på antalet? Lämna fältet tomt – vi räknar på platsbesöket.",
    },
    {
      name: "schedule",
      label: "Enstaka uppdrag eller enligt schema?",
      type: "select",
      options: ONE_OFF_OR_RECURRING,
    },
  ],

  // Has a calculator: antal bodar, städfrekvens, önskat datum och kontaktmetod
  // are already mailed. What the page offers beyond that is löpande städning
  // under projektet versus slutstädning inför överlämning, and how long the
  // site will be running.
  "/foretag/bodstadning": [
    {
      name: "stage",
      label: "Löpande städning eller slutstädning?",
      type: "select",
      options: [
        "Löpande städning under projektet",
        "Slutstädning inför överlämning",
        "Både löpande städning och slutstädning",
      ],
    },
    {
      name: "duration",
      label: "Hur länge pågår projektet?",
      type: "text",
      placeholder: "T.ex. 6 månader eller till mars",
    },
  ],

  // Has a calculator: storlek, frekvens, beräknad tid och uppskattat pris are
  // already mailed, and unlike the other calculators this one asks for no date.
  // Påfyllning av förbrukningsmaterial is listed on the page as something done
  // "vid behov", so it is worth knowing before the quote.
  "/foretag/kontorsstadning": [
    { name: "start", label: "Önskat startdatum", type: "date", hint: DATE_HINT },
    {
      name: "supplies",
      label: "Ska vi fylla på förbrukningsmaterial?",
      type: "select",
      options: ["Ja", "Nej", "Vet inte än"],
      hint: "Till exempel papper, tvål och soppåsar.",
    },
  ],

  // /tjanster/hemstadning, /tjanster/storstadning, /tjanster/flyttstadning and
  // /tjanster/fonsterputs get no extra questions on purpose: their calculators
  // already mail storlek or val, frekvens, tillägg, önskat datum och tid and
  // the estimated price, which is everything those quotes are priced on.
};

export default QUOTE_FIELDS;
