import React from "react";
//import Link from "next/link";
//import BlogSideBar from "./../../components/Blog/BlogSideBar";
//import Image from "next/image";
import CertificationPolitics from "./CertificationPolitics";
import CertificationSideBar from "./CertificationSideBar";

const CertificationDetails = () => {
  return (
    <>
      <div className="blog-details-area ptb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="blog-details-desc">
                <div className="article-content">
                  <h3>
                    Comprometidos con el medio ambiente, la seguridad y la
                    calidad
                  </h3>
                  <p>
                    El Departamento HSEQ-BASC se encarga de gestionar las
                    certificaciones en la organización lo cual permite prestar
                    un mejor servicio a los clientes, posicionando a CETER en un
                    segmento exclusivo del mercado.
                  </p>
                  <p>
                    El sistema integrado de Gestión SIG (ISO 9001:2015, ISO
                    14001:2015, ISO 45001:2018, NORSOK, RUC, BASC) proporciona
                    herramientas para gestionar riesgos y oportunidades, así
                    como riesgos ocupacionales e impactos ambientales reduciendo
                    fallas en las diferentes etapas de la prestación del
                    servicio de transporte de cara a nuestros clientes.
                  </p>
                  <blockquote>
                    <p>
                      Con el Departamento HSEQ-BASC impulsamos nuestro servicio
                      a niveles extraordinarios, permitiéndonos destacar en un
                      mercado exclusivo. Nuestra dedicación a la gestión de
                      riesgos y a proteger el medio ambiente eleva la
                      satisfacción de nuestros clientes en cada etapa de nuestro
                      servicio de transporte.
                    </p>
                    <cite>Gerente Ceter</cite>
                  </blockquote>

                  <h3>Certificados de gestión</h3>
                  <div className="article-image">
                    <img src="/images/logosHSEQ.png" alt="logos Certificaciones Ceter" />
                  </div>

                  <h3>Políticas de gestión integral</h3>
                  <p>
                    Con el objeto de enfocar su gestión Ceter ha desarrollado
                    las siguientes políticas:
                  </p>
                  <CertificationPolitics
                    text="Política Integral HSEQ - BASC"
                    link="/assets/PoliticaIntegralHSEQBASC.pdf"
                  />
                  <CertificationPolitics
                    text="Política para la Seguridad Vial"
                    link="/assets/PoliticaSeguridadVial.pdf"
                  />
                  <CertificationPolitics
                    text="Política de Convivencia Laboral."
                    link="/assets/PoliticaConvivenciaLaboral.pdf"
                  />
                  <CertificationPolitics
                    text="Política de No Alcohol, Drogas y Tabaco."
                    link="/assets/PoliticaAlcoholDrogasTabaco.pdf"
                  />
                  <CertificationPolitics
                    text="Política seguridad Informatica."
                    link="/assets/PoliticaSeguridadInformatica.pdf"
                  />
                  <CertificationPolitics
                    text="Política de Control Vehicular por Sobrepeso."
                    link="/assets/PoliticaControlVehicularSobrepeso.pdf"
                  />
                  <CertificationPolitics
                    text="Política de Confidencialidad y Seguridad."
                    link="/assets/PoliticaConfidencialidadSeguridad.pdf"
                  />
                  <CertificationPolitics
                    text="Política Anticorrupción."
                    link="/assets/PoliticaAnticorrupcion.pdf"
                  />
                  <CertificationPolitics
                    text="Política de protección de datos personales."
                    link="/assets/PoliticaProteccionDatosPersonales.pdf"
                  />
                  <CertificationPolitics
                    text="Políticas para La Administración Del Riesgo SIPLAF."
                    link="/assets/politica_Siplaf.pdf"
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <CertificationSideBar />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CertificationDetails;
