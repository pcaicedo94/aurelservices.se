import React from "react";
import Footer from "../../components/Layouts/Footer";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import Link from "next/link";
import whastAppAsociados from "../../utils/WhatsAppAsociados";
import Image from "next/image";

const Comercial = () => {
  const whastApp = whastAppAsociados();
  return (
    <>
      <Navbar associates />
      <PageBanner
        pageTitle="Crédito Comercial"
        bgImage="/images/associate/credits.jpg"
      />
      <div className="project-details-area pb-100">
        <div className="container">
          <div className="projects-details-desc">
            {/* <h3>Crédito de Consumo</h3> */}
            <div className="features-text">
              <h2>Crédito Comercial</h2>

              <p>
                Se entienden como créditos comerciales los otorgados a asociados
                para el desarrollo de actividades económicas organizadas,
                distintos a los otorgados bajo la modalidad de microcrédito,
                vivienda o consumo.
              </p>

              <h3>Requisitos:</h3>
              <p>
                Para el crédito de inversión se requiere el certificado de
                existencia y representación legal de la empresa, el RUT y el
                flujo de caja proyectado.
              </p>
            </div>

            <div className="project-details-info">
              <div className="single-info-box flex-center">
                Escríbenos
                <Link href={whastApp}>
                  <>
                    <a href={whastApp} className="btnDetails " target="_blank">
                      <Image
                        width={50}
                        height={50}
                        alt="icon whatsapp"
                        src="/images/whatsappIcon.webp"
                        decoding="async"
                      />
                    </a>
                  </>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Comercial;
