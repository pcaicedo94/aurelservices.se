import React from "react";
import Link from "next/link";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

const SolutionsTab = () => {
  return (
    <>
      <div className="tab-section ptb-100">
        <div className="container">
          <div className="solutions-list-tab">
            <Tabs>
              <TabList>
                <Tab
                  data-aos="fade-up"
                  data-aos-delay="100"
                  data-aos-duration="1200"
                  data-aos-once="true"
                >
                  Estaciones de Servicio
                </Tab>
                <Tab
                  data-aos="zoom-in-left"
                  data-aos-delay="1200"
                  data-aos-duration="1200"
                  data-aos-once="true"
                >
                  Transporte
                </Tab>
                <Tab
                  data-aos="zoom-in-left"
                  data-aos-delay="1400"
                  data-aos-duration="1200"
                  data-aos-once="true"
                >
                  Asociados
                </Tab>
              </TabList>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>
                        Estaciones de servicio para transportadores a nivel
                        nacional
                      </h3>
                      <p>
                        En nuestras estaciones de servicio, brindamos una amplia
                        gama de servicios especializados a transportadores de
                        todo el país, se ofrecen varios servicios relacionados
                        principalmente con el suministro de combustible y la
                        comodidad de los clientes. Algunos de los servicios
                        comunes que se prestan en una estación de gasolina son:
                      </p>

                      <ul className="tab-list">
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Suministro de Combustible
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Artículos para el automóvil.
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Servicio de Mantenimiento Básico.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/estaciones.png" alt="image" />
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-5">
                    <div className="tab-image-left">
                      <img src="/images/truckceter.png" alt="image" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>
                        Transporte de carga seca y líquida: experiencia y
                        excelencia
                      </h3>
                      <p>
                        Con más de 40 años de experiencia en el transporte de
                        carga seca y líquida, nos hemos consolidado como líderes
                        en la industria. Nuestro enfoque en la seguridad y el
                        respaldo en todos nuestros procesos nos permite ofrecer
                        un servicio confiable y de calidad a nuestros clientes.
                      </p>

                      <ul className="tab-list">
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Equipo altamente capacitado.
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Manejo cuidadoso de líquidos sensibles.
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Entrega puntual de sus productos.
                        </li>
                      </ul>

                      <div className="tab-btn">
                        <Link href="/services" className="default-btn">
                          Conocer más <span></span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel>
                <div
                  className="row align-items-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Asociados: beneficios y convenios</h3>
                      <p>
                        En Ceter, nuestro objetivo es brindar a nuestros
                        asociados una experiencia única y completa, con ventajas
                        que contribuyan a mejorar su calidad de vida y bienestar
                        general. Entre los beneficios, destacamos:
                      </p>

                      <ul className="tab-list">
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Plan Exequial para garantizar la tranquilidad y
                          protección de sus seres queridos.
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Seguro de Vida para asegurar un respaldo financiero en
                          momentos difíciles.
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Financiamiento de Póliza Hogar para proteger su
                          vivienda y pertenencias.
                        </li>
                        <li>
                          <i className="flaticon-tick-1"></i>
                          Medicina Prepagada para acceder a atención médica de
                          calidad.
                        </li>
                      </ul>

                      <div className="tab-btn">
                        <Link href="/associates" className="default-btn">
                          Leer Más <span></span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/associates.png" alt="image" />
                    </div>
                  </div>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default SolutionsTab;
