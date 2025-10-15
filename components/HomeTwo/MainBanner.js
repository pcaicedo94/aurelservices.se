import React from "react";
import Link from "next/link";

const MainBanner = () => {
  return (
    <>
      <div className="main-banner-area">
        <div className="d-table">
          <div className="d-table-cell">
            <div className="container-fluid">
              <div className="row align-items-center">
                <div className="col-lg-6 col-md-12">
                  <div className="main-banner-content">
                    <div
                      data-aos="zoom-in-up"
                      data-aos-delay="100"
                      data-aos-duration="1200"
                      data-aos-once="true"
                    >
                      <h1>Data Science And Analytics</h1>
                    </div>

                    <div
                      data-aos="zoom-in-up"
                      data-aos-delay="200"
                      data-aos-duration="1200"
                      data-aos-once="true"
                    >
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore magna
                        aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                        ullamco laboris nisi ut aliquip.
                      </p>
                    </div>

                    <div
                      data-aos="zoom-in-up"
                      data-aos-delay="300"
                      data-aos-duration="1200"
                      data-aos-once="true"
                    >
                      <div className="banner-btn">
                        <Link href="/about-us" className="default-btn-one">
                          About Us
                          <span></span>
                        </Link>

                        <Link href="/contact" className="default-btn">
                          Contact Us
                          <span></span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-md-12">
                  <div className="banner-image">
                    {/* Shape images */}
                    <img
                      src="/images/home-one/home-one-shape1.png"
                      alt="image"
                      data-aos="zoom-in"
                      data-aos-delay="100"
                      data-aos-duration="1200"
                    />

                    <img
                      src="/images/home-one/home-one-shape2.png"
                      alt="image"
                      data-aos="fade-up"
                      data-aos-delay="100"
                      data-aos-duration="1200"
                    />

                    <img
                      src="/images/home-one/home-one-shape3.png"
                      alt="image"
                      data-aos="zoom-in"
                      data-aos-delay="100"
                      data-aos-duration="1200"
                    />

                    <img
                      src="/images/home-one/home-one-shape4.png"
                      alt="image"
                      data-aos="zoom-in-up"
                      data-aos-delay="100"
                      data-aos-duration="1200"
                    />

                    {/* Main image */}
                    <img
                      src="/images/home-one/main-image1.png"
                      alt="image"
                      data-aos="zoom-in"
                      data-aos-delay="100"
                      data-aos-duration="1200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shape Images */}
        <div className="creative-shape">
          <img
            src="/images/main-banner-shape/main-banner-shape1.png"
            alt="main-image"
          />
        </div>
        <div className="shape-img1">
          <img
            src="/images/main-banner-shape/main-banner-shape2.png"
            alt="main-image"
          />
        </div>
        <div className="shape-img2">
          <img
            src="/images/main-banner-shape/main-banner-shape3.png"
            alt="main-image"
          />
        </div>

        {/* Animation lines */}
        <div className="lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </div>
    </>
  );
};

export default MainBanner;
