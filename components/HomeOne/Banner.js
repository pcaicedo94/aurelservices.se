import React from "react";

const Banner = () => {
  return (
    <section className="carousel" aria-label="Gallery">
      <ol className="carousel__viewport" style={{padding:'0 !important'}}>
        <li id="carousel__slide1" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover1.jpg"
            alt="cover 1"
            loading="eager"
          />
        </li>
        <li id="carousel__slide2" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover2.jpg"
            alt="Cover 2"
            loading="lazy"
          />
        </li>
        <li id="carousel__slide3" tabIndex="0" className="carousel__slide">
          <img
            src="/images/cover3.jpg"
            alt="Cover 3"
            loading="lazy"
          />
        </li>
      </ol>
    </section>
  );
};

export default Banner;

