import React from "react";
import Link from "next/link";

const CreditsDetails = () => {
  const tipos = [
    {
      title: "Crédito Consumo",
      path: "/images/associate/consumo.png",
      to: "credits/consumo",
      button: "¡Conoce más aquí!",
    },
    {
      title: "Crédito Educación",
      path: "/images/associate/educacion.jpg",
      to: "credits/educacion",
      button: "¡Conoce más aquí!",
    },
    {
      title: "Calamidad doméstica",
      path: "/images/associate/calamidad.jpg",
      to: "credits/calamidad",
      button: "¡Conoce más aquí!",
    },
    {
      title: "Crédito Comercial",
      path: "/images/associate/comercial.jpg",
      to: "credits/comercial",
      button: "¡Conoce más aquí!",
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
            <div className="agreements">
              <h1>Nuestro Objetivo</h1>
              <p>
                Conceder créditos a los asociados que cumplan los requisitos de
                los estatutos y el reglamento, para satisfacer las necesidades
                personales y familiares, financiando actividades de todo tipo,
                procurando la contribución al bienestar económico y social del
                asociado y su núcleo familiar.
              </p>
            </div>

            <h1 className="agreements pt-100" style={{ color: "#02428B" }}>
              Lineas de Crédito
            </h1>
            <div
              className="col-lg-12 ptb-100 d-flex"
              style={{
                flexWrap: "wrap",
                gap: "3rem",
                justifyContent: "center",
              }}
            >
              {tipos.map((val) => (
                <div className="d-flex creditsDetail" key={val.title}>
                  <img src={val.path} width={300} height={180} />
                  <div className="creditsBody">
                    <h5>{val.title}</h5>
                    <Link href={val.to} className="default-btn btnDetails">
                      {val.button}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreditsDetails;
