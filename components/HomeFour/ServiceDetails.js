import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";
const ServiceDetails = () => {
  const servicios = [
    {
      name: "Plan Exequial",
      description:
        "Brindamos tranquilidad y apoyo emocional en momentos difíciles. Nuestro Plan Exequial ofrece una solución integral para gastos funerarios, garantizando que tus seres queridos cuenten con respaldo financiero y asistencia en esos momentos sensibles.",
    },
    {
      name: "Seguro de Vida",
      description:
        "La seguridad de tus seres queridos es nuestra prioridad. Con nuestro Seguro de Vida, proporcionamos una red de protección financiera en caso de fallecimiento, asegurando que tus beneficiarios reciban el respaldo necesario para afrontar futuros desafíos.",
    },
    {
      name: "Financiamiento Póliza Hogar",
      description:
        "Protege tu hogar con confianza. Nuestro servicio de Financiamiento para Póliza de Hogar facilita el acceso a seguros que resguardan tu vivienda, contenido y ofrecen tranquilidad ante eventualidades como robos, incendios y daños estructurales.",
    },
    {
      name: "Medicina Prepagada",
      description:
        "Tu bienestar es nuestra prioridad. Con la Medicina Prepagada, te ofrecemos acceso a servicios médicos de calidad sin preocupaciones financieras. Garantiza atención médica oportuna y especializada para ti y tu familia, promoviendo un enfoque preventivo de la salud.",
    },

    {
      name: "Financiamiento Póliza Autos",
      description:
        "Con nuestro servicio de Financiamiento para Pólizas de Autos, hacemos que la protección de tu vehículo sea accesible y adaptada a tus necesidades. Garantizamos que disfrutes de la carretera con la confianza de contar con respaldo financiero en caso de percances.",
    },
  ];

  return (
    <>
      <div className="tab-section ptb-100">
        <div className="container">
          <div
            className="row align-items-center"
            data-aos="fade-down"
            data-aos-delay="100"
            data-aos-duration="1100"
            data-aos-once="true"
          >
            <div className="col-lg-5">
              <div className="tab-image-left">
                <img src="/images/headquarters.jpeg" alt="salud" />
              </div>
            </div>

            <div className="col-lg-7">
            <div className="faq-accordion">
            <Accordion preExpanded={[1]}>
            {servicios.map((item,index) => (
              <AccordionItem key={item} uuid={index}>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    {item.name}
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <p>
                    {item.description}
                  </p>
                </AccordionItemPanel>
              </AccordionItem>
            ))}

            </Accordion>
          </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceDetails;
