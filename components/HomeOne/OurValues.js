import React from "react";
import LineIcon from "../Common/LineIcon";

// Våra värderingar on Om oss. The AI-made compass illustration was removed and
// the template's unrelated font icons (charts, "big data") replaced by line
// icons that match each value (Textosweb, 2026-11-26, points 16 and 18). The
// text is unchanged.
const VALUES = [
  {
    icon: "respect",
    title: "Respekt",
    text: "Vi tänker på våra medarbetares hälsa. Ingen är mindre än en annan i vårt företag och alla ska bli behandlade på ett rättvist sätt.",
  },
  {
    icon: "empathy",
    title: "Empati",
    text: "Vi fokuserar på våra kunders behov och tänker alltid på att uppfylla förväntningar vi skulle ha om vi var dem.",
  },
  {
    icon: "responsibility",
    title: "Ansvar",
    text: "Vi gör vårt jobb i tid, på ett effektivt sätt och tar ansvar för allt som kan uppstå på vägen.",
  },
  {
    icon: "will",
    title: "Vilja",
    text: "Vi gör vårt jobb med passion och entusiasm. Vi är stolta över att vara en del av detta företag och gör jobbet som om vi skulle göra det till oss själva.",
  },
  {
    icon: "environment",
    title: "Miljö",
    text: "Vi är medvetna om vårt ansvar för att skydda miljön och tar alltid hänsyn till detta i vårt arbete. Vi använder miljövänliga produkter och metoder.",
  },
  {
    icon: "flex",
    title: "Flexibilitet",
    text: "Vi anpassar oss till våra kunders behov och tider. Vi är flexibla och gör allt för att passa in i våra kunders schema.",
  },
];

const OurValues = () => (
  <div className="container pb-70 our-values-v2">
    <h2 className="svc-block-title">Våra värderingar</h2>
    <div className="about-values about-values-6">
      {VALUES.map((value) => (
        <article key={value.title} className="info-card about-value">
          <span className="about-icon">
            <LineIcon name={value.icon} />
          </span>
          <h3>{value.title}</h3>
          <p>{value.text}</p>
        </article>
      ))}
    </div>
  </div>
);

export default OurValues;
