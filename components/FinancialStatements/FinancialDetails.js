import React from "react";
import Link from "next/link";

const FinantialDetails = () => {
  const documents = [
    {
      path: "/assets/finacieros/2MEMORIAECONOMICA2023.pdf",
      title: "Memoria económica 2023",
      p: "Haga clic sobre esta tarjeta para ver el documento",
    },
    {
      path: "/assets/finacieros/3INFORMEDEGESTION2023.pdf",
      title: "Informe de gestión 2023",
      p: "Haga clic sobre esta tarjeta para ver el documento",
    },
    {
      path: "/assets/finacieros/4ESTADOSFINANCIEROS2023.pdf",
      title: "Estados financieros 2023",
      p: "Haga clic sobre esta tarjeta para ver el documento",
    },
    {
      path: "/assets/finacieros/DICTAMENREVISORFISCAL2023.pdf",
      title: "Dictamen revisor fiscal 2023",
      p: "Haga clic sobre esta tarjeta para ver el documento",
    },
    {
      path: "/assets/finacieros/NOTASDEREVELACION2023.pdf",
      title: "Notas de revelación 2023",
      p: "Haga clic sobre esta tarjeta para ver el documento",
    },
  ];

  return (
    <div className="main-banner-two services-section pt-100 pb-70">
      <div
        className="container"
        data-aos="fade-down"
        data-aos-delay="100"
        data-aos-duration="1100"
        data-aos-once="true"
      >
        <div className="page-title-content pb-70 mt-0">
          <h2>Estados Financieros</h2>
        </div>

        <div className="row agreements">
          {documents.map((item) => {
            return (
              <div key={item.title} className="col-lg-4 col-md-4">
                <Link href={item.path} className="service-btn" download>
                  <div className="single-services-box">
                    <div className="icon">
                      <i className="flaticon-big-data"></i>
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.p}</p>

                    <div className="service-btn">
                      Descargar
                      <i className="flaticon-right"></i>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinantialDetails;
