import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <>
      <footer className="footer-section ptb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="single-footer-widget col-lg-9">
                <div className="footer-heading">
                  <h3>Aurel Städ AB</h3>
                </div>
                <p>
                Din pålitliga partner för städning sedan efter 2007.
                </p>
              </div>
            </div>

            

            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="single-footer-widget">
                <div className="footer-heading">
                  <h3>Menú</h3>
                </div>

                <ul className="footer-quick-links">
                  <li>
                    <Link href="/about-us">Om oss</Link>                  </li>
                  <li>
                    <Link href="/services">Tjänster</Link>                  </li>
                  <li>
                    <Link href="/contact">Kontakta Oss</Link>                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-sm-6">
              <div className="single-footer-widget">
                <div className="footer-heading">
                  <h3>Kontakta Oss</h3>
                </div>

                <div className="footer-info-contact">
                  <i className="flaticon-call-answer"></i>
                  <h3>Telefon</h3>

                  <br></br>
                  <span>
                    <a href="tel:+46 76 045 0228">+46 76 045 0228</a>
                  </span>
                </div>

                <div className="footer-info-contact">
                  <i className="flaticon-envelope"></i>
                  <h3>Email</h3>
                  <a href="mailto:info@aurelservice.se"><span>info@aurelservice.se </span></a>
                </div>

                <div className="footer-info-contact">
                  <i className="flaticon-maps-and-flags"></i>
                  <h3>Adress</h3>
                  <span>Bredängs Allé 10 NB
                  127 32 Skärholmen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>

        <div className="partner-shape-img1">
          <img src="/images/shape/partnar-shape-2.png" alt="image" />
        </div>
      </footer>
      {/* End Top Footer Section */}
    </>
  );
};

export default Footer;
