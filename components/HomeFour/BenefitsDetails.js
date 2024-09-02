import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

const BenefitsDetails = () => {
  const tabs = [
    "Reglamento Fondo de solidaridad",
    "Auxilio de Salud",
    "Auxilio Vacaciones",
    "Auxilio Exequial",
    "Reglamento Calamidad",
  ];
  return (
    <>
      <div
        className=" tab-section ptb-100"
        // style={{
        //   background:
        //     "linear-gradient( to bottom, #5249d6, #5674dc, #fffff0, #fffff0, #ffffe0 )",
        // }}
      >
        <div className="container">
          <div className="solutions-list-tab">
            <Tabs>
              <TabList>
                {tabs.map((value) => (
                  <Tab
                    data-aos="fade-up"
                    data-aos-delay="100"
                    data-aos-duration="1200"
                    data-aos-once="true"
                    style={{
                      padding: "10px",
                      display: "flex",
                      placeContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {value}
                  </Tab>
                ))}
              </TabList>

              <TabPanel>
                <div
                  className="row align-tems-center"
                  data-aos="fade-down"
                  data-aos-delay="100"
                  data-aos-duration="1100"
                  data-aos-once="true"
                >
                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Reglamento fondo de Solidaridad</h3>
                      <p>
                        El "Reglamento Fondo de Solidaridad" es un pilar
                        fundamental que nos une económicamente para respaldar a
                        aquellos que lo necesitan. A través de contribuciones
                        compartidas, creamos un fondo sólido que actúa como red
                        de apoyo financiero para situaciones imprevistas.
                      </p>

                      {/* <ul className="tab-list">
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
                      </ul> */}

                      {/* <div className="tab-btn">
                        <Link href="/service-details">
                          <a className="default-btn">
                            Read More <span></span>
                          </a>
                        </Link>
                      </div> */}
                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/associate/solidaridad.jpg" alt="solidaridad" />
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
                      <img src="/images/associate/salud.jpg" alt="salud" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Auxilio de Salud</h3>
                      <p>
                        La salud es una prioridad indiscutible, y nuestro
                        compromiso es asegurar que cada miembro tenga acceso a
                        los cuidados necesarios. Con el "Auxilio de Salud",
                        proporcionamos asistencia financiera para garantizar
                        tratamientos médicos adecuados, permitiendo que la salud
                        de nuestros miembros sea siempre una preocupación
                        compartida.
                      </p>
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
                      <h3>Auxilio de Vacaciones</h3>
                      <p>
                        El descanso y la recreación son componentes vitales para
                        un equilibrio de vida saludable. Nuestro "Auxilio
                        Vacaciones" está diseñado para brindar a nuestros
                        miembros la oportunidad de disfrutar de momentos de
                        tranquilidad y desconexión. Creemos en la importancia de
                        revitalizarse para enfrentar los desafíos diarios con
                        renovada energía.
                      </p>
                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/associate/vacaciones.jpeg" alt="vacaciones" />
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
                      <img src="/images/associate/exequial.jpg" alt="exequial" />
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="tab-solution-content">
                      <h3>Auxilio Exequial</h3>
                      <p>
                        En los momentos más difíciles, nuestra comunidad
                        extiende su mano solidaria a través del "Auxilio
                        Exequial". Este beneficio busca aliviar la carga
                        económica asociada a situaciones de pérdida,
                        proporcionando el apoyo necesario para hacer frente a
                        los gastos funerarios. Nos unimos en el duelo para
                        ofrecer consuelo y respaldo.
                      </p>
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
                      <h3>Reglamento Calamidad</h3>
                      <p>
                        La imprevisibilidad de las calamidades requiere una
                        respuesta organizada y efectiva. Con nuestro "Reglamento
                        Calamidad", establecemos protocolos para brindar
                        asistencia coordinada en situaciones de
                        emergencia. La seguridad y bienestar de nuestros
                        miembros son prioridades fundamentales en todo momento.
                      </p>

                    </div>
                  </div>

                  <div className="col-lg-5">
                    <div className="tab-image-right">
                      <img src="/images/associate/calamidad.jpg" alt="image" />
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

export default BenefitsDetails;
