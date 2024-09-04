import React from "react";
import Link from "next/link";

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
            >
              
            </div>
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
                <img src="/images/process/mision-img.jpg" alt="image" />

                <h2>Mission</h2>

                <h3>FLEXIBILITET, KVALITET OCH SERVICE</h3>

                <p>- Vi är ett effektivt städtjänsteföretag med stora ambitioner och höga krav på kvalitet.
                  Vi erbjuder en komplett städtjänst för företag och privatpersoner i Storstockholm.
                  Vi utför både stora och små uppgifter med samma energi och entusiasm.</p>

                <p>- Våra tjänster kännetecknas av skräddarsydda lösningar med hög flexibilitet, kvalitet och garanti.</p>

                <p>- Vi använder marknadens senaste och bästa utrustning samt produkter som har så liten miljöpåverkan som möjligt.</p>

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
                <img src="/images/process/vision-img.jpeg" alt="image" />

                <h2>Vision</h2>
                <p>
                  - Att vara ett nationellt erkänt prestigefyllt företag med administrativ autonomi, utmärkt städtjänst som erbjuder en produkt av utmärkt kvalitet, där kontinuerlig förbättring uppskattas av våra kunder.
                </p>
                  - Att vara ett konkurrenskraftigt företag med strategiskt partnerskap, nationellt och engagerad i kundservicen.
                  <p>
                  - Att fortsätta bidra till att förbättra miljön.
                  </p>
                  <p>
                  Värderingar:
                  </p>
                  <p>
                  - Respekt
                  </p>
                  <p>
                  - Empati
                  </p>
                  <p>
                  - Ansvar
                  </p>
                  <p>
                  - Vilja
                </p>

                {/* <Link href="/project-details">
                  <a className="process-btn">
                    Read More
                    <i className="flaticon-right"></i>
                  </a>
                </Link> */}
              </div>
            </div>

            {/* <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="300"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="process-item">
                <img src="/images/process/process3.png" alt="image" />

                <h3>Analytics Projects</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore
                </p>

                <Link href="/project-details">
                  <a className="process-btn">
                    Read More
                    <i className="flaticon-right"></i>
                  </a>
                </Link>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkingProcess;
