import React from "react";
import LineIcon from "../Common/LineIcon";

// Mission and vision. The AI-made illustrations were replaced by icons at the
// client's request (Textosweb, 2026-11-26, point 16); the text is unchanged.

const WorkingProcess = () => {
  return (
    <>
      <div className="process-section pb-70">
        <div className="container">
          <div className="section-title">
            <div
              className="col-lg-12 col-md-12"
              data-aos="zoom-in"
              data-aos-delay="100"
              data-aos-duration="1200"
              data-aos-once="true"
            ></div>
          </div>

          <div className="row justify-content-center">
            <div
              className="col-lg-6 col-md-12"
              data-aos="fade-up"
              data-aos-delay="100"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="process-item">
                <span className="about-icon">
                  <LineIcon name="mission" />
                </span>

                <h2>Mission</h2>

                <p>
                  Vi är ett effektivt städtjänsteföretag med stora ambitioner
                  och höga krav på kvalitet. Vi erbjuder en komplett städtjänst
                  för företag och privatpersoner i Storstockholm. Vi utför både
                  stora och små uppgifter med samma energi och entusiasm.
                </p>

                <p>
                  Våra tjänster kännetecknas av skräddarsydda lösningar med hög
                  flexibilitet, kvalitet och garanti.
                </p>

                <p>
                  Vi använder marknadens senaste och bästa utrustning samt
                  produkter som har så liten miljöpåverkan som möjligt.
                </p>
              </div>
            </div>

            <div
              className="col-lg-6 col-md-12"
              data-aos="fade-up"
              data-aos-delay="200"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="process-item">
                <span className="about-icon">
                  <LineIcon name="vision" />
                </span>

                <h2>Vision</h2>
                <p>
                  Att vara ett nationellt erkänt prestigefyllt företag med
                  administrativ autonomi, utmärkt städtjänst som erbjuder en
                  produkt av utmärkt kvalitet, där kontinuerlig förbättring
                  uppskattas av våra kunder.
                </p>
                <p>
                  Att vara ett konkurrenskraftigt företag med strategiskt
                  partnerskap, nationellt och engagerad i kundservicen.
                </p>
                <p>Att fortsätta bidra till att förbättra miljön.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkingProcess;
