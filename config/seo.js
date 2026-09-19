// Single source of truth for per-route metadata and structured data.
// Visible strings are Swedish on purpose: they are what Google shows in the SERP.
// Rules followed here:
//  - titles 55-60 characters, descriptions 150-160 characters, unique per route;
//  - only claims the company actually makes on the page being described;
//  - no invented opening hours, reviews, ratings or prices anywhere in the JSON-LD.

export const SITE_URL = "https://aurelservice.se";
export const SITE_NAME = "Aurel Städ & Allservice AB";
export const SITE_LOCALE = "sv_SE";
export const TWITTER_CARD = "summary_large_image";

// Fallback social image. Every banner under /images/banners is 1920x1072.
export const DEFAULT_OG_IMAGE = {
  url: "/images/banners/hemstadning.webp",
  width: 1920,
  height: 1072,
  type: "image/webp",
  alt: "Städare från Aurel Städ & Allservice i ett hem i Stockholm",
};

// Real company data, taken from the client's documents. Anything not listed
// here (opening hours, ratings, prices) is deliberately absent from the JSON-LD.
export const BUSINESS = {
  id: `${SITE_URL}/#business`,
  legalName: "Aurel Städ & Allservice AB",
  name: "Aurel Städ & Allservice",
  organizationNumber: "556725-2340",
  streetAddress: "Bredängs Allé 10 NB",
  postalCode: "127 32",
  addressLocality: "Skärholmen",
  addressRegion: "Stockholms län",
  addressCountry: "SE",
  telephones: ["+46760450228", "+46870897777"],
  email: "info@aurelservice.se",
  areaServed: "Stockholm",
  sameAs: ["https://www.instagram.com/aurel.allservice/"],
  logo: "/images/logo.png",
};

// route -> metadata. A `service` block turns the page into a schema.org Service
// linked back to the business; pages without it get no Service node.
export const PAGES = {
  "/": {
    title: "Städfirma i Stockholm – hem, kontor och flytt | Aurel",
    description:
      "Aurel Städ & Allservice utför hemstädning, flyttstädning, kontorsstädning och fönsterputs i Stockholm. Begär offert direkt eller ring 076-045 02 28.",
    keywords:
      "städfirma Stockholm, städbolag Stockholm, hemstädning Stockholm, flyttstädning Stockholm",
    image: "/images/banners/hemstadning.webp",
  },

  "/homecleaning": {
    title: "Hemstädning Stockholm – regelbunden städhjälp | Aurel",
    description:
      "Hemstädning i Stockholm varje vecka, varannan vecka, månadsvis eller vid enstaka tillfälle. Vi städar kök, badrum, golv och ytor. Räkna ut ditt pris här.",
    keywords: "hemstädning Stockholm, städhjälp Stockholm, veckostädning, RUT-avdrag städning",
    image: "/images/banners/hemstadning.webp",
    service: {
      name: "Hemstädning i Stockholm",
      serviceType: "Hemstädning",
      description:
        "Regelbunden eller enstaka hemstädning i Stockholm: kök, badrum, golv och ytor, anpassad efter bostadens storlek och dina behov.",
    },
  },

  "/deepcleaning": {
    title: "Storstädning Stockholm – grundlig städning av hemmet",
    description:
      "Storstädning i Stockholm där vi rengör hemmet på djupet, från golv till tak. Passar inför inflyttning, efter renovering eller när hemmet behöver en nystart.",
    keywords: "storstädning Stockholm, grundstädning, djuprengöring hem, storstädning pris",
    image: "/images/banners/storstadning.webp",
    service: {
      name: "Storstädning i Stockholm",
      serviceType: "Storstädning",
      description:
        "Grundlig storstädning av hela bostaden i Stockholm – vi rengör på djupet från golv till tak, även ytor som inte ingår i veckostädningen.",
    },
  },

  "/movecleaning": {
    title: "Flyttstädning Stockholm – pris och städ inför besiktning",
    description:
      "Flyttstädning i Stockholm som uppfyller kraven inför besiktning. Vi städar hela bostaden inför överlämningen. Se pris för din bostadsyta direkt här.",
    keywords: "flyttstädning Stockholm, flyttstädning Stockholm pris, flyttstäd besiktning",
    image: "/images/banners/flyttstadning.webp",
    service: {
      name: "Flyttstädning i Stockholm",
      serviceType: "Flyttstädning",
      description:
        "Komplett flyttstädning av bostaden i Stockholm inför besiktning och överlämning, med rengöring av kök, badrum, garderober, golv och fönster.",
    },
  },

  "/windowcleaning": {
    title: "Fönsterputs Stockholm – rena fönster i ditt hem | Aurel",
    description:
      "Fönsterputsning i Stockholm för villa, lägenhet och radhus. Vi putsar fönster utan ränder och fläckar så att hemmet får mer ljus. Räkna ut ditt pris här.",
    keywords: "fönsterputs Stockholm, fönsterputsning Stockholm, fönsterputs villa, fönsterputs pris",
    image: "/images/banners/fonsterputs.webp",
    service: {
      name: "Fönsterputsning i Stockholm",
      serviceType: "Fönsterputsning",
      description:
        "Fönsterputsning för privatpersoner i Stockholm: putsning av fönster, karmar och spröjs i villa, radhus och lägenhet.",
    },
  },

  "/officecleaning": {
    title: "Kontorsstädning Stockholm – städning för företag | Aurel",
    description:
      "Kontorsstädning i Stockholm anpassad efter era lokaler och er verksamhet. Vi håller arbetsplatsen ren för personal och besökare. Begär offert från oss.",
    keywords: "kontorsstädning Stockholm, städfirma företag Stockholm, lokalvård Stockholm",
    image: "/images/banners/kontorsstadning.webp",
    service: {
      name: "Kontorsstädning i Stockholm",
      serviceType: "Kontorsstädning",
      description:
        "Kontorsstädning och lokalvård i Stockholm för företag: arbetsplatser, mötesrum, pentry, toaletter och gemensamma ytor enligt överenskommet schema.",
    },
  },

  "/staircleaning": {
    title: "Trappstädning Stockholm – för BRF och fastighetsägare",
    description:
      "Trappstädning i Stockholm för bostadsrättsföreningar, fastighetsägare och företag. Vi håller trapphus, entré och gemensamma ytor rena. Begär offert av oss.",
    keywords: "trappstädning Stockholm, trapphusstädning BRF, fastighetsstädning Stockholm",
    image: "/images/banners/trappstadning.webp",
    service: {
      name: "Trappstädning i Stockholm",
      serviceType: "Trappstädning",
      description:
        "Återkommande trappstädning i Stockholm för bostadsrättsföreningar och fastighetsägare: trapphus, entré, hiss och gemensamma utrymmen.",
    },
  },

  "/containercleaning": {
    title: "Byggstädning Stockholm – bodstädning och slutstädning",
    description:
      "Byggstädning i Stockholm för entreprenörer och fastighetsägare: etableringsstädning, bodstädning och slutstädning vid renovering. Begär offert från oss.",
    keywords: "byggstädning, byggstädning Stockholm, bodstädning, etableringsstädning, slutstädning",
    image: "/images/Bodstädning.png",
    service: {
      name: "Byggstädning och bodstädning i Stockholm",
      serviceType: "Byggstädning",
      description:
        "Byggstädning i Stockholm under och efter projektet: etableringsstädning, löpande bodstädning av manskapsbodar och slutstädning vid renovering.",
    },
  },

  "/carpetwashing": {
    title: "Mattvätt Stockholm – professionell rengöring av mattor",
    description:
      "Mattvätt i Stockholm för privatpersoner, företag och bostadsrättsföreningar. Vi rengör mattan på djupet och återställer färg och fräschör. Begär offert.",
    keywords: "mattvätt Stockholm, mattrengöring Stockholm, tvätta matta Stockholm",
    image: "/images/banners/mattvatt.webp",
    service: {
      name: "Mattvätt i Stockholm",
      serviceType: "Mattvätt",
      description:
        "Professionell mattvätt i Stockholm för privatpersoner, företag och bostadsrättsföreningar – djuprengöring som återställer mattans fräschör.",
    },
  },

  "/floorcare": {
    title: "Golvvård Stockholm – behandling och underhåll av golv",
    description:
      "Golvvård i Stockholm för företag och privatpersoner. Vi behandlar och underhåller golvet så att det håller längre och ser bättre ut. Begär offert från oss.",
    keywords: "golvvård Stockholm, golvbehandling, polering golv Stockholm, golvunderhåll",
    image: "/images/banners/storstadning.webp",
    service: {
      name: "Golvvård i Stockholm",
      serviceType: "Golvvård",
      description:
        "Golvvård i Stockholm för företag och privatpersoner: behandling och underhåll som förlänger golvets livslängd och återställer dess utseende.",
    },
  },

  "/gardening": {
    title: "Trädgårdsskötsel Stockholm – hjälp med RUT-avdrag | Aurel",
    description:
      "Trädgårdsskötsel i Stockholm för privatpersoner, med RUT-avdrag. Vi håller trädgården välskött och i gott skick under hela säsongen. Begär offert från oss.",
    keywords: "trädgårdsskötsel Stockholm, trädgårdshjälp RUT, gräsklippning Stockholm",
    image: "/images/banners/tradgardsskotsel.webp",
    service: {
      name: "Trädgårdsskötsel i Stockholm",
      serviceType: "Trädgårdsskötsel",
      description:
        "Trädgårdsskötsel i Stockholm för privatpersoner: löpande skötsel som håller trädgården välskött och i gott skick under hela säsongen.",
    },
  },

  "/snowremoval": {
    title: "Snöröjning Stockholm – plogning och halkbekämpning | Aurel",
    description:
      "Snöröjning i Stockholm för företag, bostadsrättsföreningar och privatpersoner. Vi plogar, skottar och halkbekämpar så att ytorna blir säkra att gå på.",
    keywords: "snöröjning Stockholm, plogning Stockholm, halkbekämpning, sandning BRF",
    image: "/images/banners/snorojning.webp",
    service: {
      name: "Snöröjning i Stockholm",
      serviceType: "Snöröjning",
      description:
        "Snöröjning, plogning och halkbekämpning i Stockholm för företag, bostadsrättsföreningar och privatpersoner – gångvägar, entréer och parkeringar.",
    },
  },

  "/movinghelp": {
    title: "Flytthjälp Stockholm – smidig och säker flytt | Aurel",
    description:
      "Flytthjälp i Stockholm för privatpersoner, företag och bostadsrättsföreningar. Vi packar, bär och transporterar så att flytten går smidigt. Begär offert.",
    keywords: "flytthjälp Stockholm, flyttfirma Stockholm, bärhjälp flytt, flytt med RUT",
    image: "/images/banners/flytthjalp.webp",
    service: {
      name: "Flytthjälp i Stockholm",
      serviceType: "Flytthjälp",
      description:
        "Flytthjälp i Stockholm för privatpersoner, företag och bostadsrättsföreningar: packning, bärhjälp och transport av bohag och inventarier.",
    },
  },

  "/construction": {
    title: "Byggtjänster Stockholm – renovering för BRF och företag",
    description:
      "Byggtjänster i Stockholm för företag, bostadsrättsföreningar och privatpersoner. Vi utför bygg- och renoveringsarbeten med fokus på kvalitet. Begär offert.",
    keywords: "byggtjänster Stockholm, renovering Stockholm, byggfirma BRF Stockholm",
    image: "/images/banners/byggtjanster.webp",
    service: {
      name: "Byggtjänster i Stockholm",
      serviceType: "Byggtjänster",
      description:
        "Bygg- och renoveringsarbeten i Stockholm för företag, bostadsrättsföreningar och privatpersoner, utförda med fokus på kvalitet och noggrannhet.",
    },
  },

  "/movecleaningbusiness": {
    title: "Flyttstädning för företag i Stockholm – lokal och kontor",
    description:
      "Flyttstädning för företag i Stockholm när ni lämnar lokalen. Vi städar kontoret så att det uppfyller kraven vid överlämning och besiktning. Begär offert.",
    keywords:
      "flyttstädning företag Stockholm, kontorsflytt städning, lokalstädning vid avflyttning",
    image: "/images/Flyttstädning-kontor.png",
    service: {
      name: "Flyttstädning för företag i Stockholm",
      serviceType: "Flyttstädning för företag",
      description:
        "Flyttstädning av kontor och verksamhetslokaler i Stockholm inför överlämning och besiktning, anpassad efter lokalens storlek och skick.",
    },
  },

  "/windowcleaningbusiness": {
    title: "Fönsterputs för företag i Stockholm – kontor och butik",
    description:
      "Fönsterputsning för företag i Stockholm, anpassad efter era lokaler. Rena fönster i kontor, butik och entré ger ett professionellt intryck. Begär offert.",
    keywords: "fönsterputs företag Stockholm, fönsterputsning kontor, fasadfönster putsning",
    image: "/images/Fönsterputs_kontor.png",
    service: {
      name: "Fönsterputsning för företag i Stockholm",
      serviceType: "Fönsterputsning för företag",
      description:
        "Fönsterputsning för företag i Stockholm: kontor, butik och entré, med putsintervall anpassat efter lokalerna och verksamhetens behov.",
    },
  },

  "/services": {
    title: "Våra tjänster – städning och service i Stockholm | Aurel",
    description:
      "Alla tjänster från Aurel Städ & Allservice i Stockholm: hemstädning, flyttstädning, kontorsstädning, fönsterputs, trappstädning, flytthjälp och mycket mer.",
    keywords: "städtjänster Stockholm, allservice Stockholm, städfirma tjänster",
    image: "/images/services-bg.jpg",
  },

  "/private-services": {
    title: "Städning för privatpersoner i Stockholm – våra tjänster",
    description:
      "Städning för dig som privatperson i Stockholm: hemstädning, storstädning, flyttstädning och fönsterputs. Välj tjänst och få ett pris direkt i formuläret.",
    keywords: "städning privatpersoner Stockholm, hemstädning, storstädning, flyttstädning",
    image: "/images/banners/hemstadning.webp",
  },

  "/about-us": {
    title: "Om oss – Aurel Städ & Allservice, städfirma i Stockholm",
    description:
      "Lär känna Aurel Städ & Allservice AB, städ- och servicefirma i Skärholmen som arbetar i hela Stockholm åt privatpersoner, företag och bostadsrättsföreningar.",
    keywords: "Aurel Städ, städfirma Skärholmen, om oss städbolag Stockholm",
    image: "/images/banners/hemstadning.webp",
  },

  "/careers": {
    title: "Jobba hos oss – lediga jobb inom städ i Stockholm | Aurel",
    description:
      "Vill du arbeta med städning i Stockholm? Aurel Städ & Allservice söker engagerade medarbetare och erbjuder trygga villkor med kollektivavtal och försäkring.",
    keywords: "jobb städning Stockholm, lediga jobb städare, jobba som lokalvårdare",
    image: "/images/banners/kontorsstadning.webp",
  },

  "/contact": {
    title: "Kontakta Aurel Städ & Allservice i Stockholm | Offert",
    description:
      "Kontakta Aurel Städ & Allservice i Stockholm. Ring 076-045 02 28 eller 08-708 97 77, mejla info@aurelservice.se eller skicka din fråga via formuläret.",
    keywords: "kontakt städfirma Stockholm, offert städning, Aurel Städ kontakt",
    image: "/images/contact.png",
  },

  "/faq": {
    title: "Vanliga frågor om våra städtjänster – Aurel Städ Stockholm",
    description:
      "Svar på vanliga frågor om hemstädning, flyttstädning, bokning, nycklar, avbokning och RUT-avdrag hos Aurel Städ & Allservice i Stockholm. Hittar du inte svaret?",
    keywords: "vanliga frågor städning, RUT-avdrag frågor, boka städning Stockholm",
    image: "/images/page-title-bg-2.jpg",
  },

  "/privacy-policy": {
    title: "Integritetspolicy – så hanterar vi dina personuppgifter",
    description:
      "Integritetspolicy för Aurel Städ & Allservice AB: vilka personuppgifter vi samlar in, varför vi gör det, hur länge vi sparar dem och vilka rättigheter du har.",
    keywords: "integritetspolicy, GDPR personuppgifter, Aurel Städ integritet",
    image: "/images/page-title-bg-5.jpg",
  },

  "/terms-condition": {
    title: "Allmänna villkor för städtjänster – Aurel Städ i Stockholm",
    description:
      "Allmänna villkor för tjänster från Aurel Städ & Allservice AB i Stockholm: bokning, avbokning, betalning, ansvar och vad som ingår i ett städuppdrag hos oss.",
    keywords: "allmänna villkor städning, avbokningsregler städfirma",
    image: "/images/page-title-bg.jpg",
  },

  "/404": {
    title: "Sidan finns inte – Aurel Städ & Allservice i Stockholm",
    description:
      "Sidan du letar efter finns inte längre eller har flyttat. Gå tillbaka till startsidan för att hitta våra städtjänster i Stockholm, eller kontakta oss direkt.",
    noindex: true,
  },
};

// Real pages that must stay out of the sitemap.
export const SITEMAP_EXCLUDE = ["/404"];

// Must mirror `trailingSlash` in next.config.js. scripts/build-sitemap.mjs
// compares both and refuses to write the sitemap if they ever diverge, so
// canonical URLs and sitemap URLs can never disagree.
export const TRAILING_SLASH = false;

/** "/homecleaning" -> "/homecleaning" or "/homecleaning/", per TRAILING_SLASH. */
export function canonicalPath(route, trailingSlash = TRAILING_SLASH) {
  if (!route || route === "/") return "/";
  const path = route.startsWith("/") ? route : `/${route}`;
  const bare = path.replace(/\/+$/, "");
  return trailingSlash ? `${bare}/` : bare;
}

/** Absolute URL on the production domain for a route or a /public asset. */
export function absoluteUrl(target, trailingSlash = TRAILING_SLASH) {
  if (!target) return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(target)) return target;
  // Files under /public keep their exact path; only routes get the slash rule.
  if (/\.[a-z0-9]{2,5}$/i.test(target)) {
    return `${SITE_URL}${encodeURI(target.startsWith("/") ? target : `/${target}`)}`;
  }
  return `${SITE_URL}${canonicalPath(target, trailingSlash)}`;
}

export function getPageSeo(route) {
  return PAGES[route] || null;
}
