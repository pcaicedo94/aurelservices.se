import React from "react";
import Link from "next/link";

const AboutUs = () => {
  return (
    <>
      <div className="about-section overflow-hidden pb-100">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div
                className="about-image"
                data-aos="zoom-in"
                data-aos-delay="300"
                data-aos-duration="1200"
                data-aos-once="true"
              >
                <img src="/images/15-years-exp.png" alt="image" />
              </div>
            </div>

            <div className="col-lg-6">
              <div
                className="about-content"
                data-aos="zoom-in-left"
                data-aos-delay="300"
                data-aos-duration="1200"
                data-aos-once="true"
              >
                {/* <span>About Us</span> */}
                <h2>Vi har 18 års erfarenhet som backar upp oss</h2>
                <p>
                  Vi är ett effektivt städtjänsteföretag med stora ambitioner
                  och höga krav på kvalitet. Vi erbjuder en komplett städtjänst
                  för företag och privatpersoner i Storstockholm. Vi utför både
                  stora och små uppgifter med samma energi och entusiasm.
                </p>

                <ul className="about-list">
                  <li>
                    <i className="flaticon-tick"></i>
                    Flexibilitet
                  </li>
                  <li>
                    <i className="flaticon-tick"></i>
                    Kvalitet
                  </li>
                  <li>
                    <i className="flaticon-tick"></i>
                    Service
                  </li>
                  {/* <li>
                    <i className="flaticon-tick"></i>
                    Advanced Advisory Team
                  </li> */}
                </ul>

                <Link href="/contact" className="default-btn">
                  Kontakta Oss <span></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
