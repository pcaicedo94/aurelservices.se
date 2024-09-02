"use Client";
import React from "react";
import Footer from "../../components/Layouts/Footer";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import Link from "next/link";
import whastAppAsociados from "../../utils/WhatsAppAsociados";
import Image from "next/image";

const Calamidad = () => {
  const whastApp = whastAppAsociados();
  return (
    <>
      <Navbar associates />
      <PageBanner
        pageTitle="Calamidad Doméstica"
        bgImage="/images/associate/credits.jpg"
      />

      <div className="project-details-area pb-100">
        <div className="container">
          <div className="projects-details-desc">
            {/* <h3>Crédito de Consumo</h3> */}
            <div className="features-text">
              <h2>Préstamos por Calamidad Doméstica</h2>

              <p>
                Se entiende como todo suceso imprevisto, repentino y ajeno a la
                voluntad del asociado que afecte desfavorablemente la integridad
                y la unidad de su grupo familiar y dependientes, comprobados en
                cualquiera de los siguientes aspectos: físico, moral, económico,
                civil, social o legal. Se excluyen las situaciones derivadas de:
              </p>
              <ol>
                <li>
                  Influencia del alcohol, drogas alucinógenas o estimulantes que
                  modifiquen el comportamiento habitual del individuo
                </li>
                <li>
                  Deuda suntuosa o no controlada por el asociado o su grupo
                  familiar.
                </li>
              </ol>

              <p>
                El trámite de este tipo de préstamo tendrá preferencia sobre
                cualquier línea de crédito de CETER.
              </p>

              <h3>Requisito:</h3>
              <p>
                Presentar documentos idóneos que verifiquen su situación; si el
                crédito corresponde a solucionar un embargo proveniente de la
                acción de codeudor, el cheque correspondiente al desembolso se
                hará a la entidad respectiva.
              </p>
            </div>

            <div className="project-details-info">
              <div
                className="single-info-box flex-center" >
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

export default Calamidad;
