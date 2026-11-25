import React from "react";
import Link from "next/link";

// Page header of every inner page, in the glass + bento style of the home
// page: a frosted card with the breadcrumb and the H1, next to a photo tile.
// On a phone the photo becomes a short band above the card. The props are the
// same as before, so no page had to change.
const PageBanner = ({
  pageTitle,
  breadcrumbTextOne,
  breadcrumbTextTwo,
  breadcrumbUrl,
  bgImage,
  bgPosition,
}) => {
  return (
    <section className="page-hero">
      <div className="container page-hero-grid">
        <div className="glass-panel page-hero-card">
          {breadcrumbUrl ? (
            <nav aria-label="Brödsmulor">
              <ol className="page-hero-crumbs">
                <li>
                  <Link href={breadcrumbUrl}>{breadcrumbTextOne}</Link>
                </li>
                <li aria-current="page">{breadcrumbTextTwo}</li>
              </ol>
            </nav>
          ) : (
            <p className="page-hero-eyebrow">Aurel Städ &amp; Allservice</p>
          )}
          <h1>{pageTitle}</h1>
        </div>

        {bgImage && (
          <div
            className="page-hero-photo"
            style={{
              backgroundImage: `url(${bgImage})`,
              ...(bgPosition && { backgroundPosition: bgPosition }),
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </section>
  );
};

export default PageBanner;
