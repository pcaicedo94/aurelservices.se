import React from "react";
import Link from "next/link";

export default function Office({
  link,
  title,
  address,
  cel,
  cel2,
  city,
  callToAction,
}) {
  return (
    <div
      className="col-lg-6 col-md-6"
      data-aos="fade-up"
      data-aos-delay="100"
      data-aos-duration="1200"
      data-aos-once="true"
    >
      <div className="blog-item">
        <div className="blog-content">
          <h3>
            <Link href={link} passHref>
              <a target="_blank" rel="noopener">
                {title}
              </a>
            </Link>
          </h3>

          <p>{address}</p>
          <p>
            <a href={link}>{cel}</a> <a href={`tel:${cel2}`}>{cel2}</a>
          </p>
          <p>{city}</p>

          <Link href={link} passHref>
            <a target="_blank" rel="noopener" className="read-more">
              {callToAction}
              <i className="fa fa-chevron-right"></i>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
