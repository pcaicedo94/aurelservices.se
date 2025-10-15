import React from "react";
import Link from "next/link";

const OurValues = () => {
  return (
    <>
      <div className="data-service-section pb-100">
        <div className="container">
          <div className="section-title">
            <h2>Våra Värderingar</h2>
          </div>

          <div className="row align-items-center justify-content-center">
            <div className="col-lg-4 col-md-6">
              <div className="data-services-item">
                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-big-data"></i>
                  </div>
                  <h3>Respekt</h3>
                  <p>
                    Vi tänker på våra medarbetares hälsa. Ingen är mindre än
                    annan i vårt företag och alla ska bli behandlade på ett
                    rättvist sätt.
                  </p>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-science"></i>
                  </div>
                  <h3>Empati</h3>
                  <p>
                    Vi fokuserar på våra kunders behov och tänker alltid på att
                    uppfylla förväntningar vi skulle ha om vi var dem.
                  </p>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-document"></i>
                  </div>
                  <h3>Ansvar</h3>
                  <p>
                    Vi gör vårt jobb i tid, på ett effektivt sätt och tar ansvar
                    för allt som kan uppstå på vägen.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="data-service-image">
                <img src="/images/values.jpeg" alt="image" />
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="data-services-item">
                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-data-analytics"></i>
                  </div>
                  <h3>Vilja</h3>
                  <p>
                    Vi gör vårt jobb med passion och entusiasm. Vi är stolta
                    över att vara en del av detta företag och gör jobbet som om
                    vi skulle göra det till oss själva.
                  </p>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-chart"></i>
                  </div>
                  <h3>Miljö</h3>
                  <p>
                    Vi är medvetna om vårt ansvar för att skydda miljön och tar
                    alltid hänsyn till detta i vårt arbete. Vi använder
                    miljövänliga produkter och metoder.
                  </p>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-right"></i>
                  </div>
                  <h3>Flexibilitet</h3>
                  <p>
                    Vi anpassar oss till våra kunders behov och tider. Vi är
                    flexibla och gör allt för att passa in i våra kunders
                    schema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OurValues;
