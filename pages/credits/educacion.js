import React from "react";
import Footer from "../../components/Layouts/Footer";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import Link from "next/link";
import whastAppAsociados from "../../utils/WhatsAppAsociados";
import Image from "next/image";


const Educacion = () => {
  const whastApp = whastAppAsociados();

  return (
    <>
      <Navbar associates />
      <PageBanner
        pageTitle="Crédito de Educación"
        bgImage="/images/associate/credits.jpg"
      />
      <div className="project-details-area pb-100">
        <div className="container">
          <div className="projects-details-desc">
            <div className="features-text">
              <h2>Créditos de Educación</h2>

              <p>
                Este crédito se puede usar para educación formal y educación
                para el trabajo, como el pago de matrículas (Educación Primaria,
                Secundaria, Intermedia y/o Universitaria, Postgrados y
                Especializaciones) y pensiones tanto de asociados como de su
                grupo familiar inscrito en CETER.
              </p>

              <h3>Requisitos:</h3>
              <ol>
                <li>
                  Presentar los recibos de pago y constancia de matrícula o
                  polígrafo.
                </li>
                <li>
                  Factura original expedida por el establecimiento educativo y
                  se girará al respectivo centro educativo, o copia del recibo
                  de pago y se girará al asociado.
                </li>
              </ol>

              <p>
                Nota: Los créditos otorgados para estudios universitarios
                tendrán un plazo por semestre máximo hasta 6 meses, Diplomados
                hasta 12 meses y las Especializaciones, Maestrías, Doctorados,
                hasta 60 meses.
              </p>
            </div>

            <div className="project-details-info">
              <div className="single-info-box flex-center">
                Escríbenos
                <Link
                  href={whastApp}
                  className="btnDetails"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    width={50}
                    height={50}
                    alt="icon whatsapp"
                    src="/images/whatsappIcon.webp"
                    decoding="async"
                  />
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

export default Educacion;
