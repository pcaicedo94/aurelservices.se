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
      name: "Hemstädning",
      description:
        "Brindamos tranquilidad y apoyo emocional en momentos difíciles. Nuestro Plan Exequial ofrece una solución integral para gastos funerarios, garantizando que tus seres queridos cuenten con respaldo financiero y asistencia en esos momentos sensibles.",
      infoText:
        "Vår ambition är att erbjuda prisvärd hemstädning som alla har råd med. Här är några exempel på vad hemstädning kan kosta.",
      table: [
        { tjänst: "Hemstädning", kvadratmeter: 50, pris: "1500 kr" },
        { tjänst: "Hemstädning", kvadratmeter: 75, pris: "2250 kr" },
        { tjänst: "Hemstädning", kvadratmeter: 100, pris: "3000 kr" },
      ],
    },
    {
      name: "Flyttstädning",
      description:
        "La seguridad de tus seres queridos es nuestra prioridad. Con nuestro Seguro de Vida, proporcionamos una red de protección financiera en caso de fallecimiento, asegurando que tus beneficiarios reciban el respaldo necesario para afrontar futuros desafíos.",
      infoText:
        "Vår ambition är att erbjuda prisvärd flyttstädning som alla har råd med. Här är några exempel på vad flyttstädning kan kosta.",
      table: [
        { tjänst: "Flyttstädning", kvadratmeter: 50, pris: "3321 kr" },
        { tjänst: "Flyttstädning", kvadratmeter: 75, pris: "4243 kr" },
        { tjänst: "Flyttstädning", kvadratmeter: 100, pris: "5166 kr" },
      ],
    },
    {
      name: "Stortädning",
      description:
        "Protege tu hogar con confianza. Nuestro servicio de Financiamiento para Póliza de Hogar facilita el acceso a seguros que resguardan tu vivienda, contenido y ofrecen tranquilidad ante eventualidades como robos, incendios y daños estructurales.",
      infoText:
        "Vår ambition är att erbjuda prisvärd stortädning som alla har råd med. Här är några exempel på vad stortädning kan kosta.",
      table: [
        { tjänst: "Stortädning", kvadratmeter: 50, pris: "2000 kr" },
        { tjänst: "Stortädning", kvadratmeter: 75, pris: "3000 kr" },
        { tjänst: "Stortädning", kvadratmeter: 100, pris: "4000 kr" },
      ],
    },
    {
      name: "Fönsterputsning",
      description:
        "La seguridad de tus seres queridos es nuestra prioridad. Con nuestro Seguro de Vida, proporcionamos una red de protección financiera en caso de fallecimiento, asegurando que tus beneficiarios reciban el respaldo necesario para afrontar futuros desafíos.",
      infoText:
        "Vår ambition är att erbjuda prisvärd flyttstädning som alla har råd med. Här är några exempel på vad flyttstädning kan kosta.",
      table: [
        { tjänst: "Fönsterputsning", kvadratmeter: 50, pris: "3321 kr" },
        { tjänst: "Fönsterputsning", kvadratmeter: 75, pris: "4243 kr" },
        { tjänst: "Fönsterputsning", kvadratmeter: 100, pris: "5166 kr" },
      ],
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
                  {servicios.map((item, index) => (
                    <AccordionItem key={index} uuid={index}>
                      <AccordionItemHeading>
                        <AccordionItemButton>{item.name}</AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        <p>{item.description}</p>
                        <p>{item.infoText}</p>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Tjänst</th>
                              <th>Kvadratmeter</th>
                              <th>Pris</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.table.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                <td>{row.tjänst}</td>
                                <td>{row.kvadratmeter}</td>
                                <td>{row.pris}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
