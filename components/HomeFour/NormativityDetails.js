import React from "react";
import Link from "next/link";

const NormativityDetails = () => {
  return (
    <div className="main-banner-four services-section pt-100 pb-70">
      <div
        className="container"
        data-aos="fade-down"
        data-aos-delay="100"
        data-aos-duration="1100"
        data-aos-once="true"
      >
        <div className="page-title-content pb-70 mt-0">
          <h2>Normatividad</h2>
        </div>

        <div className="row">
          <div className="col-lg-6 col-md-6">
            <Link href="/assets/estatutos.pdf" className="service-btn" download>
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-big-data"></i>
                </div>

                <h3>Estatutos</h3>
                <p>
                  Descubre cómo nuestros estatutos crean un marco robusto que
                  impulsa la equidad, la responsabilidad social y el éxito
                  colectivo en cada kilómetro de nuestro viaje como cooperativa.
                </p>

                <div className="service-btn">
                  Descargar
                  <i className="flaticon-right"></i>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-lg-6 col-md-6">
            <Link
              href="/assets/estatutos.pdf"
              className="service-btn"
              download
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-data-analytics"></i>
                </div>

                <h3>Reglamento Consejo de Administración</h3>
                <p>
                  Explora como este reglamento fortalece la dirección estratégica
                  de nuestro consejo, asegurando una administración sólida y
                  enfocada en el bienestar colectivo de nuestros asociados.
                </p>

                <div className="service-btn">
                  Descargar
                  <i className="flaticon-right"></i>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-lg-6 col-md-6">
            <Link
              href="/assets/estatutos.pdf"
              className="service-btn"
              download
            >
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-document"></i>
                </div>
                <h3>Reglamento Junta de Vigilancia</h3>
                <p>
                  Establece responsabilidades, asegura la transparencia y
                  refuerza la confianza de nuestros asociados al garantizar una
                  gestión responsable en todos los niveles de nuestra cooperativa
                  de transporte.
                </p>

                <div className="service-btn">
                  Descargar
                  <i className="flaticon-right"></i>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-lg-6 col-md-6">
            <Link href="/assets/rasociados.pdf" className="service-btn" download>
              <div className="single-services-box">
                <div className="icon">
                  <i className="flaticon-chart"></i>
                </div>
                <h3>Reglamento Asociados</h3>
                <p>
                  Refleja nuestro compromiso con la colaboración y la armonía,
                  delineando las normas y procedimientos que aseguran la
                  participación activa y el respeto mutuo de cada miembro en
                  nuestra cooperativa.
                </p>
                <div className="service-btn">
                  Descargar
                  <i className="flaticon-right"></i>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NormativityDetails;
