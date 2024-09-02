import React from "react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <footer className="footer-section ptb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="single-footer-widget col-lg-9">
                <div className="footer-heading">
                  <h3>Nosotros</h3>
                </div>
                <p>
                  CETER - Cooperativa Multiactiva y de Transporte de Santander.
                </p>
                <p>
                  Entidad confiable y comprometida en el transporte de carga.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="single-footer-widget">
                <div className="footer-heading">
                  <h3>Links importantes</h3>
                </div>

                <ul className="footer-quick-links">
                  <li>
                    <Link href="/certification">
                      <a>Certificaciones</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/associates">
                      <a>Documentación Requerida</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/services">
                      <a>Rastreo de Carga</a>
                    </Link>
                  </li>
                  {/* <li>
                    <Link href="/team">
                      <a>Equipo</a>
                    </Link>
                  </li> */}
                </ul>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="single-footer-widget">
                <div className="footer-heading">
                  <h3>Menú</h3>
                </div>

                <ul className="footer-quick-links">
                  <li>
                    <Link href="/about-us">
                      <a>Nosotros</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/services">
                      <a>Estaciones de servicio</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/offices">
                      <a>Transporte de carga</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/associates">
                      <a>Asociados</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact">
                      <a>Contáctenos</a>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="single-footer-widget">
                <div className="footer-heading">
                  <h3>Contáctanos</h3>
                </div>

                <div className="footer-info-contact">
                  <i className="flaticon-call-answer"></i>
                  <h3>Teléfonos</h3>
                  <span>
                    <a href="tel:+576076472750">607 6472750 </a>
                  </span>
                  <br></br>
                  <span>
                    <a href="tel:3142745782">3142745782</a>
                  </span>
                </div>

                <div className="footer-info-contact">
                  <i className="flaticon-envelope"></i>
                  <h3>Email</h3>
                  <span>comercial@ceter.com.co</span>
                </div>

                <div className="footer-info-contact">
                  <i className="flaticon-maps-and-flags"></i>
                  <h3>Dirección</h3>
                  <span>Carrera 36 # 54-42 B/manga</span>
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

      {/* Bottom Footer Section */}
      <div className="copyright-area">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-6">
              <p>
                &copy; {currentYear} Todos los derechos reservados por
                <a href="https://ceter.com.co/" target="_blank">
                  Ceter - Cooperativa Multiactiva y de Transporte de Santander
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
