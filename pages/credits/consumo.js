import React from "react";
import Footer from "../../components/Layouts/Footer";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
import Link from "next/link";
import whastAppAsociados from "../../utils/WhatsAppAsociados";
import Image from "next/image";

const Consumo = () => {
  const whastApp = whastAppAsociados();
  return (
    <>
      <Navbar associates />
      <PageBanner
        pageTitle="Crédito de Consumo"
        bgImage="/images/associate/credits.jpg"
      />
      <div className="project-details-area pb-100">
        <div className="container">
          <div className="projects-details-desc">
            <div className="features-text">
              <h2>Crédito de Consumo</h2>
              <p>
                Se entienden como créditos de consumo las operaciones activas de
                crédito otorgadas a asociados cuyo objeto sea financiar:
              </p>
              <ol>
                <li>Compra de cartera</li>
                <li>Adquisición de bienes de consumo</li>
                <li>
                  El pago de servicios para fines no comerciales o empresariales
                </li>
              </ol>
              <h3>Requisitos:</h3>
              <ol>
                <li>Diligenciar la solicitud de crédito FA-012.</li>
                <li>Tener la Actualización de Datos FA-OOI</li>
                <li>
                  Anexar Certificación de Ingresos y/o el último desprendible de
                  nómina (empleados e independiente) o copia de la colilla de
                  pago (pensionados).
                </li>
                <li>
                  Diligenciar el Formato de autorización de consulta a las
                  Centrales de Riesgos FA-002.
                </li>
                <li>
                  Diligenciar el Formato de Constancia de Información FA-006.
                </li>
                <li>
                  Cumplir los criterios básicos para el otorgamiento de créditos
                  contemplados en el Art. 8 de este reglamento.
                </li>
                <li>
                  Cumplir con los requisitos generales para acceder a créditos
                  enunciados en el Artículo No 12 de este Reglamento.
                </li>
                <li>Firma de Pagaré.</li>
                <li>Adjuntar anexos según la línea.</li>
              </ol>

              <p>
                Los créditos de consumo que se ofrecen en la cooperativa son:
              </p>

              <h4>a) Libre Inversión:</h4>
              <p>
                Tiene por objeto facilitar a los Asociados recursos destinados a
                satisfacer sus necesidades sin tener en cuenta su naturaleza o
                destinación.
              </p>

              <h4>b) Especiales Activos Fijos:</h4>
              <p>
                Son aquellos créditos destinados para compra de artículos para
                el hogar (electrodoméstico, muebles y enseres, equipos de
                cómputo, etc.)
              </p>

              <h4>c) Vivienda:</h4>
              <p>
                Este crédito está dirigido a la compra de Vivienda nueva o
                usada, lote para construir vivienda, a las reformas y
                ampliaciones de la vivienda, al pago de impuestos o deudas de
                vivienda a una corporación o entidad financiera por préstamo o
                hipoteca del asociado y su grupo familiar.
              </p>

              <h5>Requisitos:</h5>
              <ol>
                <li>Certificado de libertad y tradición no mayor a 30 días.</li>
                <li>Copia autenticada de la promesa de compraventa.</li>
                <li>
                  Contrato de obra autenticado y firmado por ambas partes, (Se
                  girará el valor al asociado)
                </li>
                <li>
                  Facturas originales de compra ya canceladas de materiales (Se
                  girará el valor al asociado)
                </li>
                <li>
                  Cotización del Proveedor de los materiales (se girará al
                  Proveedor que la expida)
                </li>
                <li>Recibo de cobro del impuesto.</li>
                <li>
                  Certificación de deuda expedida por la entidad financiera no
                  mayor a 30 días.
                </li>
                <li>
                  En casos de mejora de vivienda la parte correspondiente a la
                  mano de obra será entregado el valor al asociado
                </li>
              </ol>

              <h4>d) Vehículo:</h4>
              <p>
                Este crédito está dirigido a la Compra de vehículo nuevo, o
                usado hasta 5 años menos del año de la solicitud, Reparaciones o
                Mantenimientos del vehículo.
              </p>

              <h5>Requisitos:</h5>
              <ol>
                <li>
                  Factura original expedida por el concesionario ya cancelada
                  (Se girará al asociado) o copia de la promesa de compra -
                  venta autenticada, (se girará al Concesionario, o vendedor)
                </li>
                <li>Copia autenticada del formulario de traspaso.</li>
                <li>Copia autenticada del SOAT.</li>
                <li>
                  Copia autenticada de la Tarjeta de propiedad del vehículo.
                </li>
                <li>
                  Póliza de seguro contra todo riesgo asignando como
                  beneficiario a CETER
                </li>
                <li>
                  Factura y/o 2 cotizaciones del mantenimiento o arreglo del
                  vehículo.
                </li>
              </ol>

              <h4>e) Especiales Productos Ceter y Otros:</h4>
              <p>
                Son aquellos créditos otorgados a los asociados para financiar
                servicios especiales como Medicina Pre-pagada, Exequias, Póliza
                de Vehículos, Póliza de Hogar, Seguro de Vida y para aquellos
                que no se encuentran clasificados dentro del sistema financiero
                de la cooperativa tales como Expedición de Soat, compra de
                insumos para vehículo, Servicio de celular, Costos Judiciales,
                etc.
              </p>

              <h5>Requisitos:</h5>
              <p>Firmar Pagaré en Blanco</p>

              <h4>f) Compra de cartera:</h4>
              <p>
                Tiene por objeto brindar al Asociado la oportunidad de recoger
                sus obligaciones con el sector financiero a un menor costo en el
                pago de los intereses.
              </p>

              <h5>Requisitos:</h5>
              <p>
                Certificación de la entidad bancaria de la deuda. (Se gira a la
                entidad bancaria)
              </p>

              <h4>g) Turismo:</h4>
              <p>
                Tiene como finalidad financiar planes turísticos, locales,
                nacionales e internacionales; compra de tiquetes aéreos o
                terrestres o para alojamiento
              </p>

              <h5>Anexos:</h5>
              <ul>
                <li>Cotización del plan vacacional</li>
                <li>Cotización de pasajes</li>
                <li>Cotización expedida por el lugar de alojamiento</li>
              </ul>
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

export default Consumo;
