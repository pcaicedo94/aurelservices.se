import React from "react";

const Banner = () => {
  return (
    <section className="carousel" aria-label="Bilder från våra uppdrag">
      <ol className="carousel__viewport" style={{padding:'0 !important'}}>
        <li id="carousel__slide1" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover1.jpg"
            alt="Nystädad entré med blanka golv i en kontorsfastighet"
            loading="eager"
          />
        </li>
        <li id="carousel__slide2" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover2.jpg"
            alt="Städat vardagsrum med dammsugen matta och blankt trägolv"
            loading="lazy"
          />
        </li>
        <li id="carousel__slide3" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover3.jpg"
            alt="Städat personalrum med rengjord köksdel på en arbetsplats"
            loading="lazy"
          />
        </li>
      </ol>
    </section>
  );
};

export default Banner;

