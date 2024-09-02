import React from "react";
import Link from "next/link";
import Office from "../Office/Office";

const OfficesDetails = () => {
  const offices = [
    {
      link: "tel:3125217493",
      title: "Oficina Aguazul",
      address: "Calle 12 # 25-20 Barrio los Angeles",
      cel: "3125217493",
      city: "Aguazul - Casanare",
      callToAction: "📲 Clic para llamar",
    },
    {
      link: "tel:3203940796",
      title: "Oficina Bogotá",
      address: "Carrera 80D # 13-20 piso 2 Barrio el vergel",
      cel: "3203940796",
      city: 'Bogotá - Cundinamarca',
      callToAction: "📲 Clic para llamar",
    },
    {
      link: "tel:3132612174",
      title: "Oficina Barranquilla",
      address: "Cra 8B # 5-325 Local 7F Barrio Pasadena",
      cel: "3132612174",
      city: "Barranquilla - Atlántico",
      callToAction: "📲 Clic para llamar",
    },
    {
      link: 'tel:3102539734',
      title: 'Oficina Bucaramanga Carga líquida',
      address: 'Cra 36 No. 54-42 Barrio Cabecera',
      cel: '3102539734',
      city: 'Bucaramanga, Santander',
      callToAction: '📲 Clic para llamar'
    },
    {
      link: 'tel:3228460769',
      title: 'Oficina Bucaramanga Carga seca',
      address: 'Cra 36 No. 54-42 Barrio Cabecera',
      cel: '3228460769',
      city: 'Bucaramanga, Santander',
      callToAction: '📲 Clic para llamar'
    }
  ];
  return (
    <div className="blog-section ptb-100">
      <div className="container">
        <div className="section-title">
          <h2>Nuestras oficinas</h2>
        </div>
        <div className="row justify-content-center">
          <div
            className="col-lg-8 col-md-12 pb-100"
            data-aos="fade-up"
            data-aos-delay="100"
            data-aos-duration="1200"
            data-aos-once="true"
          >
            <p>
              Ceter se especializa en brindar soluciones logísticas integrales
              para satisfacer las necesidades de nuestros clientes, asegurando
              la entrega oportuna y confiable de sus mercancías.
            </p>

            <p>
              Nos complace ofrecer una amplia gama de servicios de transporte de
              carga líquida y seca para satisfacer las necesidades logísticas de
              nuestros clientes. Con un enfoque en la eficiencia y la seguridad,
              garantizamos la entrega oportuna y confiable de mercancías en
              cualquier destino. Nuestro compromiso con la excelencia en el
              servicio nos ha permitido establecer diversas sucursales
              estratégicas para atender de manera efectiva a nuestros clientes
              en todo el país:
            </p>
          </div>
        </div>
        <div className="row">
          {offices.map((office, index) => (
            <Office
              key={index}
              link={office.link}
              title={office.title}
              address={office.address}
              cel={office.cel}
              cel2={office.cel2}
              city={office.city}
              callToAction={office.callToAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OfficesDetails;
