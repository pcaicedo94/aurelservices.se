import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="footer-section ptb-100">
      {/* Bubbles animation */}
      <div className="footer-bubbles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="bubble" />
        ))}
      </div>

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="row">
          <div className="col-lg-4 col-md-6 col-sm-6">
            <div className="single-footer-widget">
              <div className="footer-heading">
                <h3>Aurel Städ AB</h3>
              </div>
              <p>
                Din pålitliga partner för professionell städning sedan 2007.
                Vi levererar kvalitet, pålitlighet och noggrannhet i varje
                uppdrag.
              </p>
              <div className="footer-social">
                <a
                  href="https://www.instagram.com/aurelservices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <i className="flaticon-instagram"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-6">
            <div className="single-footer-widget">
              <div className="footer-heading">
                <h3>Meny</h3>
              </div>
              <ul className="footer-quick-links">
                <li>
                  <Link href="/about-us">Om oss</Link>
                </li>
                <li>
                  <Link href="/private-services">Privata Tjänster</Link>
                </li>
                <li>
                  <Link href="/services">Företag och BRF</Link>
                </li>
                <li>
                  <Link href="/careers">Jobba hos oss</Link>
                </li>
                <li>
                  <Link href="/contact">Kontakta Oss</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="single-footer-widget">
              <div className="footer-heading">
                <h3>Tjänster</h3>
              </div>
              <ul className="footer-quick-links">
                <li>
                  <Link href="/homecleaning">Hemstädning</Link>
                </li>
                <li>
                  <Link href="/movecleaning">Flyttstädning</Link>
                </li>
                <li>
                  <Link href="/deepcleaning">Storstädning</Link>
                </li>
                <li>
                  <Link href="/windowcleaning">Fönsterputsning</Link>
                </li>
                <li>
                  <Link href="/officecleaning">Kontorsstädning</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 col-sm-6">
            <div className="single-footer-widget">
              <div className="footer-heading">
                <h3>Kontakt</h3>
              </div>
              <div className="footer-info-contact">
                <i className="flaticon-call-answer"></i>
                <h3>Telefon</h3>
                <span>
                  <a href="tel:+46760450228">+46 76 045 0228</a>
                </span>
              </div>
              <div className="footer-info-contact">
                <i className="flaticon-envelope"></i>
                <h3>Email</h3>
                <span>
                  <a href="mailto:info@aurelservice.se">
                    info@aurelservice.se
                  </a>
                </span>
              </div>
              <div className="footer-info-contact">
                <i className="flaticon-maps-and-flags"></i>
                <h3>Adress</h3>
                <span>
                  Bredängs Allé 10 NB
                  <br />
                  127 32 Skärholmen
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Aurel Städ AB. Alla rättigheter
            förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
