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
                  <h3>
                    <a>
                      Respekt
                    </a>
                      <p>
                        Vi tänker på våra medarbetares hälsa. Ingen är mindre än annan i vårt företag och alla ska bli behandlade på ett rättvis sätt.
                      </p>
                      {/* <i className="flaticon-right"></i> */}
                    {/* </Link> */}
                  </h3>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-science"></i>
                  </div>
                  <h3>
                    {/* <Link href="/service-details"> */}
                    <a>
                      Empati
                    </a>
                      <p>
                    Vi fokuserar på våra kunders behov och tänker alltid på uppfylla förväntningar vi skulle ha om vi var dem.
                      </p>
                      {/* <i className="flaticon-right"></i> */}
                    {/* </Link> */}
                  </h3>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-document"></i>
                  </div>
                  <h3>
                    {/* <Link href="/service-details"> */}
                    <a>
                      Ansvar
                    </a>
                      <p>
                        Vi gör vårt jobb i tid, på ett effektivt sätt och tar ansvar för allt som kan uppstå på vägen. 
                      </p>
                      {/* <i className="flaticon-right"></i> */}
                    {/* </Link> */}
                  </h3>
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
                  <h3>
                    {/* <Link href="/service-details"> */}
                    <a>
                      Vilja
                    </a>
                      <p>
                    Vi gör vårt jobb med passion och entusiasm. Vi är stolta över att vara en del av detta företag och gör jobbet som att vi skulle göra det till oss själva.
                      </p>
                      {/* <i className="flaticon-right"></i> */}
                    {/* </Link> */}
                  </h3>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-chart"></i>
                  </div>
                  <h3>
                    {/* <Link href="/service-details"> */}
                    <a>
                      Miljö
                    </a>
                      <p>
                        Vi är medvetna om vårt ansvar för att skydda miljön och tar alltid hänsyn till detta i vårt arbete. Vi använder miljövänliga produkter och metoder.
                      </p>
                      {/* <i className="flaticon-right"></i> */}
                    {/* </Link> */}
                  </h3>
                </div>

                <div className="single-data-service-box">
                  <div className="icon">
                    <i className="flaticon-right"></i>
                  </div>
                  <h3>
                    {/* <Link href="/service-details"> */}
                    <a>
                      Flexibilitet
                    </a>
                      <p>
                        Vi anpassar oss till våra kunders behov och tider. Vi är flexibla och gör allt för att passa in i våra kunders schema.
                      </p>
                      {/* <i className="flaticon-right"></i> */}
                    {/* </Link> */}
                  </h3>
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
