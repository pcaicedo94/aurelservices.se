import Image from "next/image";
import React from "react";

const Customers = () => {
  const partners = [
    { name: "Recab", delay: 50, src: "/images/partner/recab.jpeg" },
    { name: "Swerock", delay: 100, src: "/images/partner/swerock.jpeg" },
    { name: "Lambertsson", delay: 200, src: "/images/partner/lambertsson.jpeg" },
    
  ];
  return (
    <>
      <div className="partner-section pt-100 pb-70">
        <div className="container">
          <div className="partner-title">
            <h2>Våra kunder</h2>
          </div>

          <div className="partner-list" style={{display:'flex', justifyContent: "space-between"}}>
            {partners.map((partner, index) => (
              <div
                className="partner-item"
                data-aos="zoom-in"
                data-aos-delay={partner.delay}
                data-aos-duration="1200"
                key={index}
              >
                <Image
                  width={400}
                  height={100}
                  src={partner.src}
                  alt={partner.name}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="partner-shape"></div>
        <div className="partner-shape-img1">
          <img src="/images/shape/partnar-shape-2.png" alt="shape" />
        </div>
      </div>
    </>
  );
};

export default Customers;
