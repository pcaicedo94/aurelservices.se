import React from "react";
import Link from "next/link";

const Cards = () => {
  return (
    <div className="blog-section ptb-100">
      <div className="container">
        <div className="section-title">
          <h2>Nuestras estaciones de servicio</h2>
        </div>
        <div className="row justify-content-center">
          <div
            className="col-lg-9 col-md-12 pb-100"
            data-aos="fade-up"
            data-aos-delay="100"
            data-aos-duration="1200"
            data-aos-once="true"
          >
            <h6>
              Operamos en diversas ciudades del país para brindarte un servicio
              de calidad, somos distribuidores minoristas de combustible,
              lubricantes y venta de SOAT.
            </h6>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6 col-md-6">
            <div className="blog-item">
              <Link href="https://ibit.ly/VnZhu" passHref>
                <a target="_blank" rel="noopener">
                  <img src="/images/edselcerro.PNG" alt="edselcerro" />
                </a>
              </Link>

              <div className="blog-content">
                <h3>
                  <Link href="https://ibit.ly/VnZhu" passHref>
                    <a target="_blank" rel="noopener">
                      Estación de servicio El Cerro
                    </a>
                  </Link>
                </h3>

                <p>Carrera 40 Km 2 vía al mar, Cerro de los Chivos</p>
                <p>Aguachica - Cesar</p>
                <p>Celular: 313 376 3095</p>

                <Link href="https://ibit.ly/VnZhu" passHref>
                  <a target="_blank" rel="noopener" className="read-more">
                    📌 Como llegar
                    <i className="fa fa-chevron-right"></i>
                  </a>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-6">
            <div className="blog-item">
              <Link href="https://ibit.ly/wzRfh" passHref>
                <a target="_blank" rel="noopener">
                  <img src="/images/edspelaya.jpeg" alt="edspelaya" />
                </a>
              </Link>

              <div className="blog-content">
                <h3>
                  <Link href="https://ibit.ly/wzRfh" passHref>
                    <a target="_blank" rel="noopener">
                      Estación de servicio Pelaya
                    </a>
                  </Link>
                </h3>

                <p>Carrera 8 N° 5-44 Barrio San José</p>
                <p>Celular 313 404 1422</p>
                <p>Pelaya - Cesar</p>

                <Link href="https://ibit.ly/wzRfh" passHref>
                  <a target="_blank" rel="noopener" className="read-more">
                    📌 Como llegar
                    <i className="fa fa-chevron-right"></i>
                  </a>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-6">
            <div className="blog-item">
              <Link href="https://ibit.ly/dY4z9" passHref>
                <a target="_blank" rel="noopener">
                  <img src="/images/edslapaz.jpeg" alt="edslapaz" />
                </a>
              </Link>

              <div className="blog-content">
                <h3>
                  <Link href="https://ibit.ly/dY4z9" passHref>
                    <a target="_blank" rel="noopener">
                      Estación de servicio La Paz
                    </a>
                  </Link>
                </h3>

                <p>Cruce a Puerto Parra, Vía Panamericana</p>
                <p>Celular 310 245 8842</p>
                <p>Puerto Parra - Santander</p>

                <Link href="https://ibit.ly/dY4z9" passHref>
                  <a target="_blank" rel="noopener" className="read-more">
                    📌 Como llegar
                    <i className="fa fa-chevron-right"></i>
                  </a>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-6">
            <div className="blog-item productive-content">
              <Link href="https://ibit.ly/CaWUR" passHref>
                <a target="_blank" rel="noopener">
                  <img src="/images/edspalmasol.jpeg" alt="edspalmasol" />
                </a>
              </Link>

              <div className="blog-content">
                <h3>
                  <Link href="https://ibit.ly/CaWUR">
                    <a target="_blank" rel="noopener">
                      Estación de servicio Palmasol
                    </a>
                  </Link>
                </h3>

                <p>Vereda Campo 23, Vía Lizama - Puerto Araujo</p>
                <p>Celular 312 582 9307</p>
                <p>Barracabermeja - Santander</p>

                <Link href="https://ibit.ly/CaWUR" passHref>
                  <a target="_blank" rel="noopener" className="read-more ">
                    📌 Como llegar
                    <i className="fa fa-chevron-right"></i>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cards;
