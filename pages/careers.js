import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const Careers = () => {
  return (
    <>
      <Navbar />
      <PageBanner
        pageTitle="Jobba hos oss"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Jobba hos oss"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <div className="ptb-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="about-content">
                <h2>Bli en del av Aurel Städ AB</h2>
                <p>
                  Vi letar alltid efter duktiga och engagerade medarbetare som
                  vill vara med och leverera förstklassig städservice. Hos oss
                  arbetar du under trygga villkor med kollektivavtal och
                  försäkring.
                </p>

                <h3>Vad vi erbjuder</h3>
                <ul>
                  <li>Anställning enligt kollektivavtal</li>
                  <li>Trygg arbetsmiljö med fullständig försäkring</li>
                  <li>Möjlighet till utveckling och utbildning</li>
                  <li>Flexibla arbetstider</li>
                  <li>Ett trevligt och stödjande team</li>
                </ul>

                <h3>Intresserad?</h3>
                <p>
                  Skicka din ansökan och CV till{" "}
                  <a href="mailto:info@aurelservice.se">
                    info@aurelservice.se
                  </a>{" "}
                  eller ring oss på{" "}
                  <a href="tel:+46760450228">+46 76 045 0228</a>.
                </p>
                <p>Vi ser fram emot att höra från dig!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Careers;
