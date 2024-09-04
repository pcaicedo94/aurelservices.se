import React from "react";

const Banner = () => {
  return (
    <section className="carousel" aria-label="Gallery">
      <ol className="carousel__viewport" style={{paddingLeft:'0 !important'}}>
        <li id="carousel__slide1" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover1.jpg"
            alt="Transportamos con responsabilidad y seguridad"
            loading="eager"
          />
        </li>
        <li id="carousel__slide2" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover2.jpg"
            alt="Cumplimos con altos estandares de calidad"
            loading="lazy"
          />
        </li>
        <li id="carousel__slide3" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover3.jpg"
            alt="Comprometidos con responsabilidad social y ambiental ceter"
            loading="lazy"
          />
        </li>
      </ol>
    </section>
  );
};

export default Banner;

