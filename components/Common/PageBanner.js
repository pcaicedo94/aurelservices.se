import React from "react";
import Link from "next/link";

const PageBanner = ({
  pageTitle,
  breadcrumbTextOne,
  breadcrumbTextTwo,
  breadcrumbUrl,
  bgImage,
  bgPosition,
}) => {
  return (
    <>
      <div
        className="page-title-area"
        style={{
          backgroundImage: `url(${bgImage})`,
          // The strip is only 500px tall, so `cover` hides most of a photo's
          // height. Pages can move the visible band; unset keeps the
          // stylesheet's `center center`.
          ...(bgPosition && { backgroundPosition: bgPosition }),
        }}
      >
        <div className="d-table">
          <div className="d-table-cell">
            <div className="container">
              <div className="page-title-content">
                <h1>{pageTitle}</h1>
                {breadcrumbUrl && (
                  <ul>
                    <li>
                      <Link href={breadcrumbUrl}>{breadcrumbTextOne}</Link>
                    </li>
                    <li>{breadcrumbTextTwo}</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageBanner;
