import React from "react";

// The photo half of the home hero. The slides are decorative stacking layers
// — the stylesheet cross-fades them — so they are not tab stops; the six
// controls of the hero all live in the copy panel.
const Banner = () => {
  return (
    <section className="carousel" aria-label="Bilder från våra uppdrag">
      <ol className="carousel__viewport">
        <li className="carousel__slide">
          <img
            src="/images/cover1.jpg"
            alt="Nystädad entré med blanka golv i en kontorsfastighet"
            loading="eager"
          />
        </li>
        <li className="carousel__slide">
          <img
            src="/images/cover2.jpg"
            alt="Städat vardagsrum med dammsugen matta och blankt trägolv"
            loading="lazy"
          />
        </li>
        <li className="carousel__slide">
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
