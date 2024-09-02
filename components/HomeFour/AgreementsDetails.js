import React from "react";
import Link from "next/link";

const AgreementsDetails = () => {
  const convenios = [
    {
      title: "DECAMERON",
      path: "/images/associate/decameron.webp",
      to: "https://www.decameron.com/",
      button: "¡Conoce más aquí!",
    },
    {
      title: "VISION PUNTUAL",
      path: "/images/associate/visionPuntual.png",
      to: "https://www.visionpuntual.com",
      button: "¡Conoce más aquí!",
    },
    {
      title: "TIERRA SANTA",
      path: "/images/associate/tierrasanta.png",
      to: "https://tierrasanta.com.co/",
      button: "¡Conoce más aquí!",
    },
    {
      title: "EMERMEDICA",
      path: "/images/associate/emermedica.png",
      to: "https://www.emermedica.com.co/",
      button: "¡Conoce más aquí!",
    },
    {
      title: "ZIRUS PIZZA",
      path: "/images/associate/zirus.png",
      to: "https://www.zirus.pizza/",
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
              <h1>Nuestros convenios</h1>
              <p>
                Pensando en nuestros asociados y sus familias contamos con las
                siguientes alianzas comerciales para la recreación, salud,
                protección y mas.
              </p>
            </div>

            <div
              className="col-lg-12 ptb-100 d-flex"
              style={{
                flexWrap: "wrap",
                gap: "2.5rem",
                justifyContent: "center",
              }}
            >
              {convenios.map((val) => (
                <div
                  className="d-flex agreementsDetail"
                  key={val.title}
                >
                  {/* <h4>{val.title}</h4> */}
                  <img src={val.path} width={200} height={100} />
                  <Link href={val.to}>
                    <a className="default-btn">{val.button}</a>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgreementsDetails;
