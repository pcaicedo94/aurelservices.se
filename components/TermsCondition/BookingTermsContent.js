import React from "react";
import Link from "next/link";
import {
  CANCELLATION_NOTICE_HOURS,
  NO_ACCESS_FEE_MAX_PERCENT,
  TRIAL_CLEANING_ADJUST_DAYS,
} from "../../lib/pricing";

// Bokningsvillkor: the client's own text from Textosweb.docx, point 11
// (2026-11-26), kept word for word apart from the figures, which are read
// from config/prices.json so that this page, the allmänna villkor, the FAQ and
// the chatbot always quote the same deadline and ceiling.
//
// It is the page the "Skicka förfrågan" checkbox links to, so the request
// form and these terms have to describe the same flow: a free, non-binding
// förfrågan, then an offer by e-mail, binding only once accepted.
const BookingTermsContent = () => (
  <div className="privacy-policy ptb-100">
    <div className="container">
      <div className="single-privacy">
        <h2 className="mt-0">Bokningsvillkor</h2>
        <p>
          <strong>Aurel Städ &amp; Allservice AB</strong>
        </p>
        <p>
          Här hittar du information om hur bokningsförfrågningar, bokningar, provstädning och
          avbokningar fungerar hos oss.
        </p>
        <p>
          Vi vill att du som kund ska känna dig trygg och veta vad som gäller innan du bokar våra
          tjänster.
        </p>

        <h2>A. Bokningsförfrågan</h2>

        <h3>1. Preliminära priser</h3>
        <p>
          Priserna som visas i vår prisberäkning är preliminära och baseras på de uppgifter du
          lämnar, exempelvis bostadens storlek och önskad städfrekvens.
        </p>
        <p>
          Det slutliga priset fastställs efter att vi har gått igenom dina önskemål, städningens
          omfattning och övriga förutsättningar.
        </p>
        <p>Du får alltid information om det slutliga priset innan du bestämmer dig för att boka.</p>

        <h3>2. Serviceområde och resekostnader</h3>
        <p>Vi erbjuder städtjänster i stora delar av Stockholms län.</p>
        <p>Beroende på bostadens adress och avstånd kan ett resetillägg tillkomma.</p>
        <p>
          Eventuella resekostnader anges separat i vårt prisförslag och meddelas innan bokningen
          bekräftas.
        </p>
        <p>Resekostnader berättigar inte till RUT-avdrag.</p>

        <h3>3. Att skicka en bokningsförfrågan</h3>
        <p>
          Att skicka en bokningsförfrågan via vår webbplats är kostnadsfritt och innebär ingen
          bindande bokning eller betalningsskyldighet.
        </p>
        <p>
          När vi har tagit emot din förfrågan går vi igenom uppgifterna och återkommer med
          information om pris, tillgänglighet och eventuella tillägg.
        </p>
        <p>
          En bokning blir bindande först när vi har kommit överens om tjänstens omfattning, pris och
          tidpunkt och du har accepterat bokningen.
        </p>

        <h3>4. Provstädning och löpande hemstädning</h3>
        <p>
          Om du är intresserad av regelbunden hemstädning erbjuder vi möjlighet att börja med en
          provstädning.
        </p>
        <p>
          Provstädningen bokas och betalas som en enstaka städning. Du förbinder dig inte att
          fortsätta med regelbunden hemstädning.
        </p>
        <p>
          Om du är nöjd och vill fortsätta kan vi tillsammans komma överens om pris, städfrekvens och
          övriga villkor för löpande hemstädning.
        </p>
        <p>Ett separat skriftligt avtal upprättas för den återkommande tjänsten.</p>

        <h2>B. Bekräftad bokning</h2>

        <h3>5. Bokningsbekräftelse</h3>
        <p>
          När vi har tagit emot din bokningsförfrågan går vi igenom dina uppgifter och återkommer med
          ett prisförslag och information om tillgängliga tider.
        </p>
        <p>
          Innan bokningen bekräftas får du information om tjänstens omfattning, slutligt pris,
          eventuella resetillägg samt gällande boknings- och avbokningsvillkor.
        </p>
        <p>
          För att bekräfta bokningen behöver du skriftligen acceptera prisförslaget och
          bokningsvillkoren, exempelvis genom att svara på vårt mejl.
        </p>
        <p>
          Bokningen blir bindande först när du har accepterat erbjudandet och vi har bekräftat
          bokningen skriftligen.
        </p>
        <p>Information om eventuell ångerrätt lämnas innan ett bindande avtal ingås.</p>

        <h3>6. Provstädning och prisjustering</h3>
        <p>En provstädning debiteras enligt det överenskomna priset för enstaka städning.</p>
        <p>
          Om du inom {TRIAL_CLEANING_ADJUST_DAYS} kalenderdagar efter utförd provstädning tecknar
          avtal om löpande hemstädning hos oss, justerar vi priset för provstädningen till det
          överenskomna priset för motsvarande löpande hemstädning.
        </p>
        <p>Eventuell mellanskillnad krediteras eller dras av på kommande faktura.</p>
        <p>
          Prisjusteringen gäller städarbetet och omfattar inte eventuella resekostnader eller andra
          separat avtalade tillägg.
        </p>
        <p>Erbjudandet påverkar inte din lagstadgade ångerrätt.</p>

        <h3>7. Avbokning och ombokning</h3>
        <p>
          Behöver du avboka eller ändra din bokning ber vi dig kontakta oss så snart som möjligt,
          gärna via e-post.
        </p>
        <p>
          Avbokning kan göras kostnadsfritt senast {CANCELLATION_NOTICE_HOURS} timmar före avtalad
          starttid.
        </p>
        <p>
          Vid senare avbokning kan vi begära skälig ersättning för kostnader och förluster som uppstår
          till följd av avbokningen, i enlighet med tillämplig lag.
        </p>
        <p>Vi försöker alltid hjälpa dig att hitta en ny tid när det är möjligt.</p>
        <p>Dessa avbokningsvillkor begränsar inte din lagstadgade ångerrätt.</p>

        <h3>8. Tillträde till bostaden och uteblivet tillträde</h3>
        <p>
          Kunden ansvarar för att vår personal får tillträde till bostaden vid överenskommen tid.
        </p>
        <p>
          Om vi inte får tillträde försöker vi i första hand kontakta kunden för att lösa
          situationen.
        </p>
        <p>
          Om tillträde inte kan ordnas inom rimlig tid och städningen därför inte kan genomföras, kan
          en ersättning motsvarande högst {NO_ACCESS_FEE_MAX_PERCENT} % av det avtalade priset för
          städarbetet före eventuellt RUT-avdrag debiteras.
        </p>
        <p>
          Ersättningen ska vara skälig och motsvara de kostnader och förluster som uppstår till följd
          av det uteblivna tillträdet.
        </p>
        <p>Ersättningen berättigar inte till RUT-avdrag.</p>
        <p>Kundens lagstadgade rättigheter, inklusive eventuell ångerrätt, påverkas inte.</p>
        <p>
          Vi rekommenderar att du kontaktar oss så snart som möjligt om du får förhinder eller behöver
          ändra hur vi får tillträde till bostaden.
        </p>

        <h3>9. Förutsättningar för städningen</h3>
        <p>
          För att vi ska kunna utföra vårt arbete behöver det finnas tillgång till el och vatten samt
          en trygg och tillgänglig arbetsmiljö.
        </p>
        <p>
          Vilken städutrustning och vilka rengöringsprodukter som ska tillhandahållas av respektive
          part framgår av överenskommelsen för den aktuella tjänsten.
        </p>
        <p>
          Om det finns särskilda omständigheter som kan påverka städningen, exempelvis kraftig
          nedsmutsning eller känsliga material, ber vi dig informera oss i förväg.
        </p>

        <h3>10. Priser, betalning och RUT-avdrag</h3>
        <p>Alla priser till privatpersoner anges inklusive moms.</p>
        <p>
          När RUT-avdrag tillämpas framgår det av prisförslaget. Avdraget gäller endast arbete som
          uppfyller Skatteverkets villkor.
        </p>
        <p>
          Resekostnader och andra kostnader som inte berättigar till RUT-avdrag redovisas separat.
        </p>
        <p>
          Betalning sker enligt de betalningsvillkor som anges i bokningsbekräftelsen eller fakturan.
        </p>
        <p>
          Om Skatteverket helt eller delvis avslår RUT-utbetalningen på grund av omständigheter som
          kunden ansvarar för, kan kunden bli skyldig att betala motsvarande belopp enligt lag och
          avtal.
        </p>

        <h3>11. Om vi behöver ändra eller avboka</h3>
        <p>
          Om vi behöver ändra eller ställa in en bokad städning kontaktar vi dig så snart som möjligt.
        </p>
        <p>Vi försöker i första hand erbjuda en ny tid som passar dig.</p>
        <p>Du debiteras inte för arbete som inte har utförts på grund av vår avbokning.</p>

        <h3>12. Om du inte är nöjd</h3>
        <p>Din nöjdhet är viktig för oss.</p>
        <p>
          Om något inte motsvarar dina förväntningar ber vi dig kontakta oss så snart som möjligt och
          beskriva vad du inte är nöjd med.
        </p>
        <p>
          Vi undersöker ärendet och försöker hitta en lämplig lösning. Vid fel i tjänsten gäller dina
          rättigheter enligt konsumenttjänstlagen och annan tillämplig lagstiftning.
        </p>

        <h3>13. Ångerrätt</h3>
        <p>
          När du som privatperson ingår ett avtal på distans eller utanför våra affärslokaler har du
          som huvudregel 14 dagars ångerrätt enligt distansavtalslagen.
        </p>
        <p>
          Ångerfristen räknas normalt från dagen efter att avtalet ingicks, förutsatt att du har fått
          den information om ångerrätten som lagen kräver.
        </p>
        <p>
          Innan du blir bunden av ett avtal som omfattas av ångerrätt får du information om hur du kan
          ångra dig och tillgång till ett standardformulär för ångerrätt.
        </p>
        <p>
          Om du uttryckligen begär att städningen ska påbörjas under ångerfristen kan du, under de
          förutsättningar som anges i lagen, behöva betala en proportionell ersättning för det arbete
          som utförts innan du meddelar att du ångrar avtalet.
        </p>
        <p>
          För en enstaka städtjänst som har utförts fullständigt kan ångerrätten upphöra om de
          särskilda lagkraven för detta är uppfyllda.
        </p>
        <p>
          Du kan meddela oss att du vill använda din ångerrätt via e-post till{" "}
          <a href="mailto:info@aurelservice.se">info@aurelservice.se</a> eller genom att använda det
          ångerformulär som vi tillhandahåller.
        </p>
        <p>Dessa villkor begränsar inte dina rättigheter enligt tvingande konsumentlagstiftning.</p>

        <h3>14. Löpande hemstädning</h3>
        <p>
          Vid regelbunden hemstädning upprättar vi ett separat skriftligt avtal där pris,
          städfrekvens, uppsägningstid och övriga villkor framgår.
        </p>
        <p>Avtalet kan signeras elektroniskt eller på papper enligt överenskommelse.</p>
        <p>
          Villkoren för det löpande avtalet gäller tillsammans med tillämplig konsumentlagstiftning.
        </p>

        <h2>Kontakt</h2>
        <p>
          Aurel Städ &amp; Allservice AB
          <br />
          E-post: <a href="mailto:info@aurelservice.se">info@aurelservice.se</a>
          <br />
          Telefon: <a href="tel:+46760450228">076-045 0228</a>
          <br />
          Webbplats: <Link href="/">www.aurelservice.se</Link>
        </p>
        <p>Har du frågor om våra bokningsvillkor är du alltid välkommen att kontakta oss.</p>
        <p>
          Se även våra <Link href="/allmanna-villkor">allmänna villkor</Link> och vår{" "}
          <Link href="/integritetspolicy">integritetspolicy</Link>.
        </p>
      </div>
    </div>
  </div>
);

export default BookingTermsContent;
