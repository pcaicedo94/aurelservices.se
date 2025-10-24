import React from "react";
import Link from "next/link";

const OurServices = () => {
  return (
    <>
      <div className="services-section pt-100 pb-70">
        <div className="container">
          <div className="section-title">
            <h2>Vad behöver du hjälp med?</h2>
          </div>

          <div className="row">
            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="200"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-big-data"></i>
                </div>

                <h3>Kontorstädning</h3>
                <p>
                  En ren och fräsch arbetsplats är stimulerande för de anställda
                  och är en förutsättning för att uträtta ett bra arbete.
                </p>

                <Link href="/services" className="service-btn">
                  Läs mer
                  <i className="flaticon-right"></i>
                </Link>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="300"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-data-analytics"></i>
                </div>

                <h3>Storstädning</h3>
                <p>
                  Vi ger ett rent och fräscht resultat, oavsett om det är inför
                  en speciell händelse eller bara för att få en nystart.
                </p>

                <Link href="/services" className="service-btn">
                  Läs Mer
                  <i className="flaticon-right"></i>
                </Link>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="400"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-document"></i>
                </div>
                <h3>Hemstädning</h3>
                <p>
                  Upplev känslan av total trivsel i ditt hem. Vår hemstädning
                  förvandlar ditt viktigaste utrymme till en fridfull oas, där
                  du kan slappna av och verkligen njuta av ditt hem.
                </p>

                <Link href="/services" className="service-btn">
                  Läs Mer
                  <i className="flaticon-right"></i>
                </Link>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="500"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-chart"></i>
                </div>
                <h3>Flyttstädning</h3>
                <p>
                  Gör din flytt stressfri. Vi tar hand om en grundlig rengöring
                  av din gamla eller nya bostad, så att du kan fokusera på din
                  nya början.
                </p>

                <Link href="/services" className="service-btn">
                  Läs Mer
                  <i className="flaticon-right"></i>
                </Link>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="600"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-science"></i>
                </div>
                <h3>Fönsterputsning</h3>
                <p>
                  Känner du att resultatet inte blir tillfredsställande när du
                  putsar själv? Låt våra skickliga fönsterputsare ta hand om det
                  åt dig och njut av att se solen stråla genom rutorna igen.
                </p>

                <Link href="/services" className="service-btn">
                  Läs Mer
                  <i className="flaticon-right"></i>
                </Link>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="700"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-data-management"></i>
                </div>
                <h3>Etableringsstädning, Bodstädning och Mer</h3>
                <p>
                  Vi erbjuder byggstädning för både privatpersoner och företag i
                  Stockholm, inklusive grovstädning, avtäckning, fönsterputs och
                  slutstädning. Vi anpassar oss efter dina behov.
                </p>

                <Link href="/services" className="service-btn">
                  Läs Mer
                  <i className="flaticon-right"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OurServices;
