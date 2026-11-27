// Flyttstädning — client copy from Textosweb.docx, "FLYTTSTÄDNING" (2026-11-26).
// Prices are read from config/prices.json so the copy never drifts from the
// calculator: the client wrote "400 kr" for avfrostning, which is the extra's
// current price.
import { MOVE_CLEANING_EXTRAS } from "../../lib/pricing";

const DEFROST = `${MOVE_CLEANING_EXTRAS.kylFrysDefrost} kr`;

export const flyttIncluded = {
  title: "Vad ingår i vår flyttstädning?",
  intro:
    "När flyttlasset har gått finns det sällan energi kvar att städa. Vi ser till att din gamla bostad lämnas i ett skick som klarar besiktningen.",
  groups: [
    {
      title: "Generell städning i samtliga rum",
      items: [
        "Fönsterputsning.",
        "Dammsugning och rengöring av dörrar, dörrkarmar, golvlister, fönsterbrädor och övriga snickerier.",
        "Rengöring av garderober, skåp och bokhyllor, både invändigt och utvändigt.",
        "Rengöring av skenor och spår till skjutdörrar.",
        "Dammsugning och avtorkning av element, inklusive åtkomliga ytor bakom.",
        "Dammtorkning av väggar.",
        "Försiktig avtorkning av eluttag och strömbrytare.",
        "Dammtorkning av taklampor och andra lättåtkomliga armaturer.",
        "Rengöring och putsning av speglar.",
        "Rengöring av åtkomliga ytor i kakelugn och öppen spis, förutsatt att askan är borttagen.",
        "Avtorkning av ytterdörrar, både på in- och utsidan där det är möjligt.",
        "Noggrann dammsugning och fuktmoppning av samtliga golv.",
      ],
    },
    {
      title: "Kök",
      intro: "Utöver de generella städmomenten som ingår i samtliga rum utför vi även följande i köket:",
      items: [
        "Grundlig rengöring av kyl och frys, både invändigt och utvändigt.*",
        "Rengöring av spis och ugn, inklusive ugnsplåtar och galler.",
        "Rengöring av köksfläkt och fettfilter (kolfilter ingår ej).",
        "Avtorkning och rengöring av köksskåp, lådor och hyllor, både på insidan och utsidan.",
        "Rengöring av kakel och stänkskydd vid diskbänk och arbetsytor.",
        "Avtorkning av socklar och lättåtkomliga ytor under köksskåp.",
        "Rengöring av mikrovågsugn, både invändigt och utvändigt.",
        "Avtorkning av diskmaskin, både på insidan och utsidan.",
        "Tömning och rengöring av sopkärl.",
        "Rengöring och polering av diskho, blandare, sil och diskpropp.",
      ],
      notes: [
        `*Observera: Kyl och frys ska vara tömda och avfrostade inför städningen. Om avfrostning behövs erbjuder vi detta som en tilläggstjänst för ${DEFROST}, efter kundens godkännande. Om tjänsten inte önskas rengör vi så långt det är möjligt, men kan inte garantera fullständig rengöring där frost eller is hindrar arbetet.`,
      ],
    },
    {
      title: "Badrum",
      intro: "Utöver de generella städmomenten som ingår i samtliga rum utför vi även följande i badrummet:",
      items: [
        "Noggrann rengöring av väggar och golv.",
        "Rengöring och putsning av blandare, duschmunstycken och synliga rör.",
        "Borttagning av kalk- och tvålavlagringar på väggar, kakel och fogar i den mån det är möjligt.",
        "Rengöring av golvbrunn, inklusive åtkomliga delar.",
        "Grundlig rengöring av duschutrymme eller badkar.",
        "Rengöring av badrumsskåp och förvaringsutrymmen, både invändigt och utvändigt.",
        "Rengöring och putsning av handfat och vattenkranar.",
        "Noggrann rengöring av toalettstol, både invändigt och utvändigt.",
        "Utvändig rengöring av tvättmaskin och torktumlare samt rengöring av tvättmedelsfacket.",
        "Rengöring av luddfilter i torktumlare.",
      ],
      afterTitle: "Bra att veta:",
      afterItems: [
        "Mögelsanering ingår inte i vår ordinarie flyttstädning.",
        "Om badkaret har en löstagbar front behöver denna demonteras av kunden innan städningen, så att vi kommer åt att rengöra under och bakom badkaret.",
      ],
    },
    {
      title: "Hall",
      intro: "Utöver de generella städmomenten som ingår i samtliga rum utför vi även följande i hallen:",
      items: [
        "Noggrann dammtorkning och avtorkning av trappräcken, ledstänger och spjälor.",
        "Rengöring och avtorkning av hatthylla och andra lättåtkomliga förvaringsytor.",
        "Utvändig avtorkning av elcentral och proppskåp.",
      ],
    },
    {
      title: "Fönsterputs",
      intro:
        "Fönsterputsning ingår i vår flyttstädning. Vi ser till att dina fönster blir rena och fina inför överlämningen av bostaden.",
      items: [
        "Noggrann putsning av fönsterrutor på samtliga åtkomliga sidor.",
        "Putsning av öppningsbara fönster, inklusive mellan glasen där det är möjligt.",
        "Rengöring av vridbara takfönster som kan putsas säkert från insidan.",
        "Vi tar med all nödvändig utrustning och rengöringsmedel för fönsterputsningen.",
      ],
      afterTitle: "Bra att veta:",
      afterItems: [
        "Vi utför fönsterputs på höjder upp till 3,5 meter. Om stege eller särskild utrustning behövs kan en extra kostnad tillkomma.",
        "Rengöring av persienner och utvändiga fönsterbleck ingår inte.",
        "Vi putsar inte skadade fönster eller fönster som inte kan öppnas på ett säkert sätt. Informera oss gärna i förväg om sådana förhållanden.",
        "Fönster som kräver arbete från yttertaket omfattas inte av tjänsten.",
      ],
      subsections: [
        {
          title: "Inglasade balkonger och uterum",
          paras: [
            "Putsning av inglasade balkonger, glasräcken och uterum ingår inte i vår ordinarie flyttstädning. Dessa kan däremot bokas som tilläggstjänster mot en extra kostnad.",
            "Kontakta oss gärna i samband med bokningen om du önskar hjälp med detta.",
          ],
        },
      ],
    },
    {
      title: "Tilläggstjänster",
      intro: "Det här kan du lägga till i kalkylatorn nedan. Priserna är inklusive moms och efter RUT-avdrag.",
      items: [
        `Kyl och frys med avfrostning – ${MOVE_CLEANING_EXTRAS.kylFrysDefrost} kr`,
        `Rengöring av persienner – ${MOVE_CLEANING_EXTRAS.persienner} kr`,
        `Städning av biytor såsom förråd, garage och balkonger – ${MOVE_CLEANING_EXTRAS.biytor} kr/timme`,
        `Fönsterputsning av inglasade balkonger – ${MOVE_CLEANING_EXTRAS.inglasadBalkong} kr`,
      ],
    },
  ],
};

export const flyttWalls =
  "Vid flyttstädning ingår borttagning av synliga fläckar på väggar och tak i den mån det är möjligt utan att skada ytan. Kraftiga fläckar, missfärgningar, färg, fett eller skador på väggar ingår inte i standard flyttstädning.";

export const flyttPrepare = {
  title: "Inför flyttstädningen",
  intro: "Några saker som gör att vi kan ge bostaden den omsorg den behöver.",
  tips: [
    {
      title: "Förbered bostaden inför flyttstädningen",
      paras: [
        "För att vi ska kunna utföra en noggrann och effektiv flyttstädning behöver bostaden vara helt tömd på möbler och personliga tillhörigheter innan vi påbörjar arbetet. På så sätt kommer vi åt alla ytor och kan ge bostaden den omsorg den behöver.",
      ],
    },
    {
      title: "Töm och frosta av kyl och frys",
      paras: [
        "Kyl och frys ska vara tömda, avstängda och avfrostade innan städningen påbörjas. Vi rekommenderar att detta görs minst ett dygn i förväg.",
        `Om frysen inte är avfrostad när vi kommer erbjuder vi avfrostning som en tilläggstjänst för ${DEFROST} inkl. moms och efter RUT-avdrag. Vår personal informerar dig om detta på plats och tjänsten utförs endast efter ditt godkännande.`,
        "Om du väljer att avstå från tilläggstjänsten rengör vi frysen så gott det går utifrån förutsättningarna. Vi kan dock inte garantera ett fullständigt rengöringsresultat om is eller frost hindrar arbetet.",
      ],
    },
    {
      title: "Förbered för rengöring bakom vitvaror",
      paras: [
        "Vill du att vi rengör bakom spis, kyl eller frys behöver dessa vara framdragna innan städningen börjar. Av säkerhetsskäl flyttar vi inte tunga vitvaror, eftersom det kan innebära risk för skador på golv, installationer eller anslutningar.",
      ],
    },
    {
      title: "Plocka ur skåp och förvaringsutrymmen",
      paras: [
        "Kom ihåg att tömma köksskåp, lådor, garderober och andra förvaringsutrymmen. När dessa är tomma kan vi rengöra hyllor, insidor, luckor och övriga ytor ordentligt.",
      ],
    },
    {
      title: "Förbered eventuell eldstad",
      paras: [
        "Har bostaden en kamin eller öppen spis behöver den vara släckt, kall och tömd på aska innan vi kommer. Det gör att vi kan rengöra de tillgängliga ytorna på ett tryggt och säkert sätt.",
      ],
    },
    {
      title: "Kontrollera belysningen",
      paras: [
        "Se gärna till att det finns fungerande belysning i samtliga rum. God belysning hjälper oss att upptäcka smuts och detaljer som annars kan vara svåra att se, särskilt i utrymmen med begränsat dagsljus.",
      ],
    },
    {
      title: "Informera oss om ömtåliga ytor",
      paras: [
        "Finns det känsliga material i bostaden, exempelvis marmor, natursten, obehandlat trä eller andra ömtåliga ytor? Meddela oss gärna innan städningen så att vi kan välja lämpliga rengöringsmetoder och hantera materialen med extra försiktighet.",
      ],
    },
    {
      title: "Nöjd-kund-garanti – 48 timmar",
      paras: [
        "Din trygghet är viktig för oss! Vi utför alltid vår flyttstädning med målet att bostaden ska bli godkänd vid besiktningen.",
        "Skulle något ha missats har du 48 timmar efter avslutad städning på dig att kontakta oss. Vi åtgärdar eventuella brister som omfattas av vårt städuppdrag utan extra kostnad och så snart som möjligt.",
      ],
    },
  ],
};
