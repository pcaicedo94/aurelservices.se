// Hemstädning — Textosweb.docx (2026-11-26), points 9 and 10, and the
// four-step model the client asked for (after Städade Hem): price, a home visit
// for houses only, a provstädning, then a written contract and follow-up.
//
// "Prova vår hemstädning" is the client's text word for word. The four step
// texts are Claude's wording of the client's description (in Spanish) and
// should be read by the client.
import { TRIAL_CLEANING_ADJUST_DAYS } from "../../lib/pricing";

export const hemSteps = {
  title: "Så går det till",
  intro:
    "Vill du ha regelbunden hemstädning börjar vi alltid med en provstädning, så att du kan se hur vi arbetar innan du bestämmer dig.",
  steps: [
    {
      title: "Beräkna pris",
      text: "Ange bostadens storlek och önskad städfrekvens och se ett preliminärt pris. Skicka sedan din förfrågan, så återkommer vi med ett prisförslag och tillgängliga tider.",
    },
    {
      title: "Hembesök vid behov",
      text: "Bor du i villa eller radhus kommer vi gärna förbi på ett kostnadsfritt hembesök, så att vi kan se bostaden och planera städningen. För lägenheter behövs det oftast inte.",
    },
    {
      title: "Provstädning",
      text: "Vi gör först en provstädning, som debiteras som en enstaka städning. Du förbinder dig inte att fortsätta.",
    },
    {
      title: "Avtal och uppföljning",
      text: "Känns allt bra tecknar vi ett skriftligt avtal om löpande hemstädning med pris, städfrekvens och villkor. Efter de första städningarna hör vi av oss för att höra hur du upplevde resultatet, och följer sedan upp regelbundet.",
    },
  ],
};

export const hemTrial = {
  title: "Prova vår hemstädning innan du bestämmer dig",
  paras: [
    "Vill du ha regelbunden hemstädning men först se hur vi arbetar?",
    "Vi erbjuder en provstädning som debiteras enligt priset för enstaka städning, utan krav på fortsatt städning.",
    `Om du inom ${TRIAL_CLEANING_ADJUST_DAYS} dagar efter provstädningen väljer att teckna avtal om löpande hemstädning justerar vi priset för provstädningen till det överenskomna priset för löpande hemstädning.`,
    "Eventuell mellanskillnad krediteras eller dras av på kommande faktura.",
    "Du får möjlighet att prova vår service i lugn och ro innan du bestämmer dig.",
  ],
};

export const hemTravel = {
  title: "Resetillägg",
  text: "Beroende på avståndet till din adress kan ett resetillägg tillkomma. Det bekräftas i ett mejl tillsammans med prisförslaget för städningen, innan något är bokat, och ger inte RUT-avdrag.",
};

export const HOUSING_TYPES = ["Lägenhet", "Villa", "Radhus"];
