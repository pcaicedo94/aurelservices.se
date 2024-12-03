import React from "react";

const AboutUsContent = () => {
  return (
    <>
      <div className="about-section ptb-100">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="about-image">
                <img src="/images/aurel3.jpg" alt="image" />
              </div>
            </div>

            <div
              className="col-lg-6"
              data-aos="zoom-in"
              data-aos-delay="100"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="about-content">
                <h2>Om oss</h2>
                <p> 
                Vi är ett f företag som grundades år 2007 under namnet Xabia AB, och det var år 2012 
                då vi bytte namn till Aurel Städ AB under domännamnet (www.aurelservice.se) som följd av 
                en utveckling av bilder, produkter och tjänster.
                Våra ledare har över 15 års erfarenhet av städmarknaden, vilket gör Aurel Städ AB till 
                ett företag som bygger på kunskap om våra kunders behov. 
                År 2020 genomgick Aurel Städ en förändring, vilket ledde till att den nya generationen uppstod 
                för att fortsätta att utvecklas på städmarknaden, samtidigt som vi upprätthåller våra standarder:
                "Flexibilitet, kvalitet och service
                </p>
              </div>
            </div>
            <div
              className="col-lg-12 pt-100 about-content"
              data-aos="zoom-in"
              data-aos-delay="100"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <h2 className="about-content">Våra Standarder:</h2>
              <ul className="about-list">
                <li>
                  <i className="flaticon-tick"></i>
                Flexibilitet: Vi anpassar oss till din tid och dina behov.
                </li>
                <li>
                  <i className="flaticon-tick"></i>
                Kvalitet: Vi använder oss av de bästa produkterna och teknikerna för att ge dig bästa resultat.
                </li>
                <li>
                  <i className="flaticon-tick"></i>
                Service: Vi strävar efter att ge dig bästa resultat och att du blir nöjd med vår tjänst.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUsContent;
