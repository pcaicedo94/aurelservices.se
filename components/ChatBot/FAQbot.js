import React, { useState, useEffect, useRef } from "react";

const FAQbot = () => {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setTimeout(() => {
        addBotMessage(
          "Hej! Välkommen till Aurel Services. Hur kan jag hjälpa dig idag?",
          "service-selection"
        );
      }, 500);
    }
  }, [isOpen]);

  const addBotMessage = (text, optionsType = null) => {
    setMessages((prev) => [
      ...prev,
      { type: "bot", text, optionsType, timestamp: new Date() },
    ]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { type: "user", text, timestamp: new Date() },
    ]);
  };

  const handleOptionClick = (userChoice, nextStep) => {
    addUserMessage(userChoice);
    
    setTimeout(() => {
      if (typeof nextStep === "string") {
        addBotMessage(nextStep, null);
      } else if (typeof nextStep === "object") {
        addBotMessage(nextStep.message, nextStep.options);
      }
    }, 500);
  };

  const renderOptions = (optionsType) => {
    const optionsMap = {
      "service-selection": [
        {
          label: "Hemstädning",
          action: () =>
            handleOptionClick("Hemstädning", {
              message: "Vad vill du veta om hemstädning?",
              options: "hemstadning-options",
            }),
        },
        {
          label: "Flyttstädning",
          action: () =>
            handleOptionClick("Flyttstädning", {
              message: "Vad vill du veta om flyttstädning?",
              options: "flyttstadning-options",
            }),
        },
        {
          label: "Storstädning",
          action: () =>
            handleOptionClick("Storstädning", {
              message: "Vad vill du veta om storstädning?",
              options: "storstadning-options",
            }),
        },
        {
          label: "Fönsterputsning",
          action: () =>
            handleOptionClick("Fönsterputsning", {
              message: "Vad vill du veta om fönsterputsning?",
              options: "fonsterputs-options",
            }),
        },
        {
          label: "Kontorsstädning",
          action: () =>
            handleOptionClick("Kontorsstädning", {
              message: "Vad vill du veta om kontorsstädning?",
              options: "kontor-options",
            }),
        },
      ],
      "hemstadning-options": [
        {
          label: "Vad ingår i hemstädning?",
          action: () =>
            handleOptionClick(
              "Vad ingår i hemstädning?",
              "Vid varje hemstädning ingår dammsugning och golvtorkning av alla rum, avtorkning av ytor i kök och badrum, rengöring av speglar, möblernas fria ytor och fönsterbrädor samt tömning av hushållssopor. Du kan även beställa tilläggstjänster som fönsterputs, storstädning eller invändig rengöring av kyl och ugn."
            ),
        },
        {
          label: "Hur ofta kan jag boka?",
          action: () =>
            handleOptionClick(
              "Hur ofta kan jag boka?",
              "Du väljer själv hur ofta du vill ha städning – varje vecka, varannan vecka eller vid behov. Vi erbjuder flexibla avtal som anpassas efter ditt hem och dina önskemål."
            ),
        },
        {
          label: "Hur fungerar RUT-avdraget?",
          action: () =>
            handleOptionClick(
              "Hur fungerar RUT-avdraget?",
              "Som privatperson har du rätt till RUT-avdrag på 50% av arbetskostnaden. Aurel Städ AB hanterar hela processen direkt med Skatteverket – du betalar endast halva priset. På din faktura står både totalpriset och summan efter RUT-avdrag."
            ),
        },
        {
          label: "Måste jag skriva avtal?",
          action: () =>
            handleOptionClick(
              "Måste jag skriva avtal?",
              "Ja, vi använder ett enkelt serviceavtal för att allt ska vara tydligt och tryggt för både dig som kund och för oss som utförare. Avtalet kan signeras digitalt och innehåller inga dolda kostnader – bara en bekräftelse på vad vi redan kommit överens om."
            ),
        },
        {
          label: "Vad händer om jag behöver avboka?",
          action: () =>
            handleOptionClick(
              "Vad händer om jag behöver avboka?",
              "Avbokning ska ske minst 3 dagar innan planerat tillfälle, annars debiteras 50% av priset. Du kan enkelt avboka via sms, mejl eller telefon."
            ),
        },
        {
          label: "Tar ni med städmaterial?",
          action: () =>
            handleOptionClick(
              "Tar ni med städmaterial?",
              "Kunden tillhandahåller vanligtvis städprodukter, dammsugare och moppink. Om du önskar att vi tar med eget material går det bra mot en mindre avgift."
            ),
        },
        {
          label: "Vad kostar hemstädning?",
          action: () =>
            handleOptionClick(
              "Vad kostar hemstädning?",
              {
                message: "Våra tjänster startar från 180 kr/timme efter RUT-avdrag, beroende på veckodag och tid. Torsdagar och fredagar är mycket populära så här är priset 195 kr per timme. Standardpriset är 325 kr/timme inklusive moms (162,50 kr/timme efter RUT-avdrag). Alla våra medarbetare arbetar under trygga villkor och är anslutna till fackförbund, enligt gällande kollektivavtal.",
                options: "hemstadning-back"
              }
            ),
        },
        {
          label: "Är ni försäkrade?",
          action: () =>
            handleOptionClick(
              "Är ni försäkrade?",
              "Ja, Aurel Städ AB har full ansvarsförsäkring. Om något mot förmodan skulle hända täcks det av vår försäkring, och vi tar alltid ansvar för eventuella skador."
            ),
        },
        {
          label: "Hur fungerar nyckelhantering?",
          action: () =>
            handleOptionClick(
              "Hur fungerar nyckelhantering?",
              "Om du lämnar nyckel till oss upprättas en nyckelkvittens. Nyckeln märks endast med intern kod och förvaras säkert – utan namn eller adress. Vid avslutat avtal lämnas nyckeln tillbaka direkt till kunden."
            ),
        },
        {
          label: "Hur bokar jag hemstädning?",
          action: () =>
            handleOptionClick(
              "Hur bokar jag hemstädning?",
              "Hemstädning bokas enkelt via vårt kontaktformulär på hemsidan. Kunden väljer den dag som passar bäst, och vårt team hör av sig för att bekräfta detaljerna och planera den slutliga tiden."
            ),
        },
        {
          label: "Tillbaka till huvudmeny",
          action: () =>
            handleOptionClick("Tillbaka", {
              message: "Vad kan jag hjälpa dig med?",
              options: "service-selection",
            }),
        },
      ],
      "hemstadning-back": [
        {
          label: "Tillbaka till hemstädning",
          action: () =>
            handleOptionClick("Tillbaka", {
              message: "Vad vill du veta om hemstädning?",
              options: "hemstadning-options",
            }),
        },
      ],
      "flyttstadning-options": [
        {
          label: "Hur kan jag förbereda för flyttstädning?",
          action: () =>
            handleOptionClick(
              "Hur kan jag förbereda för flyttstädning?",
              "För bästa resultat är det bra om bostaden är helt tom när vi kommer, så att vi enkelt når alla ytor. Om du har känsliga material som marmor, mässing eller natursten, uppskattar vi om du meddelar oss i förväg. Lämna gärna el och vatten på under städningen – vi behöver båda för att kunna utföra arbetet ordentligt. Av arbetsmiljöskäl flyttar vi inte tunga vitvaror som kyl, frys eller spis."
            ),
        },
        {
          label: "Vad omfattar en flyttstädning?",
          action: () =>
            handleOptionClick(
              "Vad omfattar en flyttstädning?",
              "Flyttstädningen innebär en noggrann rengöring av hela bostaden – från golv till tak. Vi torkar av tak, fönster, väggar, dörrar, badrum, skåp, lådor, vitvaror och putsar fönster. Om du även vill ha städning av biytor som balkong, förråd eller garage kan du enkelt lägga till det vid bokningen."
            ),
        },
        {
          label: "Kan ni ta bort fläckar eller märken på väggar?",
          action: () =>
            handleOptionClick(
              "Kan ni ta bort fläckar eller märken på väggar?",
              "Vi torkar väggar från damm och smuts enligt vår städrutin, men väggmålning eller fläckar som sitter hårt kvar tas inte bort i standardstädningen."
            ),
        },
        {
          label: "Tar ni med städutrustning och rengöringsmedel?",
          action: () =>
            handleOptionClick(
              "Tar ni med städutrustning och rengöringsmedel?",
              "Ja! Vi tar alltid med allt som behövs för en komplett flyttstädning – professionella städprodukter, redskap och utrustning. Du behöver inte förbereda något, vi löser allt på plats."
            ),
        },
        {
          label: "Kan ni städa en lägenhet som inte är helt tom?",
          action: () =>
            handleOptionClick(
              "Kan ni städa en lägenhet som inte är helt tom?",
              "Självklart kan vi det – men meddela oss gärna innan, så planerar vi städningen efter förutsättningarna. Om möbler eller andra saker finns kvar städar vi runt dem enligt vår ordinarie momentlista, men vi flyttar inte."
            ),
        },
        {
          label: "Har ni någon garanti på flyttstädningen?",
          action: () =>
            handleOptionClick(
              "Har ni någon garanti på flyttstädningen?",
              "Ja, vi erbjuder alltid nöjd kund garanti på flyttstädning. Om något skulle missas eller om den nya boende inte är nöjd, kommer vi tillbaka inom 24–48 timmar och åtgärdar det utan extra kostnad."
            ),
        },
        {
          label: "Hur bokar jag flyttstädning?",
          action: () =>
            handleOptionClick(
              "Hur bokar jag flyttstädning?",
              "Du bokar enkelt via vårt kontaktformulär på hemsidan. Fyll i bostadens storlek, önskat datum och eventuella tillägg så återkommer vi snabbt för att bekräfta tiden och gå igenom detaljerna."
            ),
        },
        {
          label: "Arbetar era städare under kollektivavtal?",
          action: () =>
            handleOptionClick(
              "Arbetar era städare under kollektivavtal?",
              "Ja, hela vårt team arbetar under kollektivavtal och är anslutna till fackförbund. Det betyder att vi följer svenska regler för lön, försäkring och arbetsvillkor – något som ger trygghet både för dig som kund och för våra medarbetare."
            ),
        },
        {
          label: "Tillbaka till huvudmeny",
          action: () =>
            handleOptionClick("Tillbaka", {
              message: "Vad kan jag hjälpa dig med?",
              options: "service-selection",
            }),
        },
      ],
      "storstadning-options": [
        {
          label: "Vad innebär en storstädning?",
          action: () =>
            handleOptionClick(
              "Vad innebär en storstädning?",
              "En storstädning är en mer omfattande rengöring än den vanliga hemstädningen. Vi rensar ytor som ofta glöms bort i vardagen – bakom möbler, under sängar, ovanpå skåp, väggar, dörrar och detaljer. Kort sagt: ditt hem får en rejäl nystart!"
            ),
        },
        {
          label: "Vad ingår i en storstädning?",
          action: () =>
            handleOptionClick(
              "Vad ingår i en storstädning?",
              "Vid storstädning gör vi en grundlig rengöring av hela bostaden. Exempel på moment som ingår: Dammsugning och våttorkning av alla golv, Rengöring av köksliuckor, bänkar, spis, ugn, fläkt och kakel, Rengöring av badrum: dusch, kakel, toalett, tvättställ och speglar, Avtorkning av dörrar, lister, kontakter, element och fönsterbrädor, Dammtorkning av lampor, hyllor och möblernas fria ytor. Observera: Fönsterputsning ingår inte i storstädningen utan bokas som ett separat tilläggstjänst."
            ),
        },
        {
          label: "Hur ofta bör man boka storstädning?",
          action: () =>
            handleOptionClick(
              "Hur ofta bör man boka storstädning?",
              "De flesta kunder väljer att storstäda sitt hem ett par gånger per år, till exempel inför säsongsbytena, högtider eller efter renovering. Hur ofta som passar dig beror på hemmets storlek, antal personer och husdjur. Vi hjälper gärna till att hitta rätt intervall för just ditt hem."
            ),
        },
        {
          label: "Måste jag förbereda något innan ni kommer?",
          action: () =>
            handleOptionClick(
              "Måste jag förbereda något innan ni kommer?",
              "Nej, men det underlättar om du plockar undan personliga saker så att vi enkelt kommer åt alla ytor. Om du har känsliga material som marmor eller mässing – informera oss gärna innan. Vi tar alltid med eget städmaterial och professionella rengöringsmedel."
            ),
        },
        {
          label: "Tar ni med städmaterial och utrustning?",
          action: () =>
            handleOptionClick(
              "Tar ni med städmaterial och utrustning?",
              "Ja, vi tär med allt som behövs – från rengöringsmedel till tråsar och redskap. Vi använder professionella och miljövänliga produkter som ger bästa resultat utan starka kemikalier."
            ),
        },
        {
          label: "Är era medarbetare försäkrade och utbildade?",
          action: () =>
            handleOptionClick(
              "Är era medarbetare försäkrade och utbildade?",
              "Ja, alla våra medarbetare är anställda enligt kollektivavtal och omfattas av försäkring. Det betyder att du som kund alltid kan känna dig trygg med att arbetet utförs säkert, korrekt och professionellt."
            ),
        },
        {
          label: "Har ni garanti på storstädningen?",
          action: () =>
            handleOptionClick(
              "Har ni garanti på storstädningen?",
              "Ja! Vi lämnar alltid nöjd kund garanti. Om du mot förmodan inte skulle vara helt nöjd, kontaktar du oss inom 24 timmar så kommer vi tillbaka och rättar till det kostnadsfritt."
            ),
        },
        {
          label: "Hur bokar jag storstädning?",
          action: () =>
            handleOptionClick(
              "Hur bokar jag storstädning?",
              "Du bokar enkelt via vårt kontaktformulär på hemsidan. Fyll i bostadens storlek, önskat datum och eventuella tillägg så återkommer vi snabbt för att bekräfta tiden och gå igenom detaljerna."
            ),
        },
        {
          label: "Tillbaka till huvudmeny",
          action: () =>
            handleOptionClick("Tillbaka", {
              message: "Vad kan jag hjälpa dig med?",
              options: "service-selection",
            }),
        },
      ],
      "fonsterputs-options": [
        {
          label: "Vad ingår i fönsterputsningen?",
          action: () =>
            handleOptionClick(
              "Vad ingår i fönsterputsningen?",
              "I våra priser ingår rengöring av fönstrens glasrutor på in- och utsida, avtorkning av bågar samt dammtorkning av persienner. Priserna visas efter RUT-avdrag och inkluderar moms."
            ),
        },
        {
          label: "Vilka tillägg finns det?",
          action: () =>
            handleOptionClick(
              "Vilka tillägg finns det?",
              "Du kan välja till flera alternativ direkt i bokningsformuläret: Spröjs – +25%, Takhöjd över 280 cm – +25%, Treglasfönster eller fler – +25%, Inglasad balkong – +400 kr, Endast inglasad balkong – från 450 kr. Alla tillägg syns tydligt när du fyller i bokningen."
            ),
        },
        {
          label: "Behöver jag förbereda något?",
          action: () =>
            handleOptionClick(
              "Behöver jag förbereda något?",
              "Flytta gärna undan gardiner, blommor och föremål från fönsterbrädorna så att vi enkelt kommer åt. Lex. marmor eller natursten, uppskättar vi om du meddelar oss i förväg. Vi tar alltid med eget material som behövs för en komplett fönsterputsning – professionella städprodukter, redskap och utrustning. Du behöver inte förbereda något, vi löser allt på plats."
            ),
        },
        {
          label: "Hur ofta bör jag putsa fönster?",
          action: () =>
            handleOptionClick(
              "Hur ofta bör jag putsa fönster?",
              "De flesta kunder bokar fönsterputsning 2–4 gånger per år, till exempel på våren och hösten. Bor du nära väg eller vatten kan det behövas lite oftare för bästa resultat."
            ),
        },
        {
          label: "Tar ni med städutrustning och rengöringsmedel?",
          action: () =>
            handleOptionClick(
              "Tar ni med städutrustning och rengöringsmedel?",
              "Ja, vi har med oss allt som behövs – professionella verktyg och miljövänliga rengöringsmedel som ger ett skinande resultat utan ränder."
            ),
        },
        {
          label: "Hur bokar jag fönsterputsning?",
          action: () =>
            handleOptionClick(
              "Hur bokar jag fönsterputsning?",
              "Du bokar enkelt via vårt kontaktformulär på hemsidan. Ange antal rum, eventuella tillägg och önskat datum – vårt team bekräftar sedan din bokning och gå igenom detaljerna med dig."
            ),
        },
        {
          label: "Tillbaka till huvudmeny",
          action: () =>
            handleOptionClick("Tillbaka", {
              message: "Vad kan jag hjälpa dig med?",
              options: "service-selection",
            }),
        },
      ],
      "kontor-options": [
        {
          label: "Vad ingår?",
          action: () =>
            handleOptionClick(
              "Vad ingår?",
              "Kontorsstädning inkluderar dammsugning, golvtorkning, tömning av papperskorgar, rengöring av kök och toaletter samt dammtorkning av ytor."
            ),
        },
        {
          label: "Hur ofta?",
          action: () =>
            handleOptionClick(
              "Hur ofta?",
              "Vi erbjuder flexibla lösningar: daglig städning, veckovis eller efter behov. Kontakta oss för skräddarsydd offert."
            ),
        },
        {
          label: "Offert?",
          action: () =>
            handleOptionClick(
              "Offert?",
              "För kontorsstädning gör vi alltid ett kostnadsfritt hembesök för att ge dig bästa pris. Kontakta oss via formuläret eller ring oss direkt."
            ),
        },
        {
          label: "Tillbaka till huvudmeny",
          action: () =>
            handleOptionClick("Tillbaka", {
              message: "Vad kan jag hjälpa dig med?",
              options: "service-selection",
            }),
        },
      ],
    };

    return optionsMap[optionsType] || [];
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`faq-chat-button ${isOpen ? "hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Öppna FAQ chatbot"
      >
        <span>💬</span>
        <span className="chat-button-text">Frågor?</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="faq-chat-window">
          <div className="faq-chat-header">
            <h3>Aurel Services - FAQ</h3>
            <button
              className="faq-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Stäng chat"
            >
              ✕
            </button>
          </div>

          <div className="faq-chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`faq-message ${message.type}`}>
                <div className="faq-message-content">
                  <p>{message.text}</p>
                  {message.optionsType && (
                    <div className="faq-options">
                      {renderOptions(message.optionsType).map((option, optIndex) => (
                        <button
                          key={optIndex}
                          className="faq-option-button"
                          onClick={option.action}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="faq-chat-footer">
            <p>Behöver du mer hjälp? <a href="/contact">Kontakta oss</a></p>
          </div>
        </div>
      )}
    </>
  );
};

export default FAQbot;