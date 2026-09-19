import React from "react";
import Head from "next/head";
import {
  BUSINESS,
  DEFAULT_OG_IMAGE,
  PAGES,
  SITE_LOCALE,
  SITE_NAME,
  TWITTER_CARD,
  absoluteUrl,
} from "../../config/seo";

// Serializes JSON-LD safely: "<" is escaped so no piece of content can close
// the script tag early. JSON.parse still reads the payload back unchanged.
function serialize(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** The CleaningService (a LocalBusiness subtype) node for the whole company. */
export function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CleaningService",
    "@id": BUSINESS.id,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: absoluteUrl("/"),
    logo: absoluteUrl(BUSINESS.logo),
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    description: PAGES["/"].description,
    telephone: BUSINESS.telephones[0],
    email: BUSINESS.email,
    // Swedish company registration number, modelled as an identifier because
    // schema.org has no dedicated property for it.
    identifier: {
      "@type": "PropertyValue",
      propertyID: "organisationsnummer",
      value: BUSINESS.organizationNumber,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
    areaServed: { "@type": "City", name: BUSINESS.areaServed },
    contactPoint: BUSINESS.telephones.map((telephone) => ({
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone,
      email: BUSINESS.email,
      areaServed: "SE",
    })),
    sameAs: BUSINESS.sameAs,
  };
  // No openingHours, no aggregateRating, no review, no offers/price on purpose:
  // the client has not confirmed any of them and fake reviews are a manual
  // action from Google.
}

/** A Service node for one service route, linked to the business by @id. */
export function serviceSchema(route) {
  const page = PAGES[route];
  if (!page || !page.service) return null;
  const url = absoluteUrl(route);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: page.service.name,
    serviceType: page.service.serviceType,
    description: page.service.description,
    url,
    areaServed: { "@type": "City", name: BUSINESS.areaServed },
    provider: {
      "@type": "CleaningService",
      "@id": BUSINESS.id,
      name: BUSINESS.name,
      url: absoluteUrl("/"),
    },
  };
}

/**
 * Per-page <head>: title, description, canonical, Open Graph and Twitter card,
 * plus the JSON-LD this route needs.
 *
 * Usage: <Seo route="/homecleaning" /> — everything else comes from
 * config/seo.js. `schemas` adds page-specific JSON-LD (for example the
 * FAQPage derived from the questions already rendered on /faq).
 */
const Seo = ({ route, title, description, image, schemas = [] }) => {
  const page = PAGES[route] || {};
  const pageTitle = title || page.title || SITE_NAME;
  const pageDescription = description || page.description || "";
  const ogImage = image || page.image || DEFAULT_OG_IMAGE.url;
  const canonical = absoluteUrl(route);

  const jsonLd = [
    route === "/" ? businessSchema() : null,
    serviceSchema(route),
    ...schemas,
  ].filter(Boolean);

  return (
    <Head>
      <title key="title">{pageTitle}</title>
      {pageDescription ? (
        <meta key="description" name="description" content={pageDescription} />
      ) : null}
      {page.keywords ? <meta key="keywords" name="keywords" content={page.keywords} /> : null}
      <link key="canonical" rel="canonical" href={canonical} />
      {page.noindex ? <meta key="robots" name="robots" content="noindex, follow" /> : null}

      {/* Open Graph */}
      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:locale" property="og:locale" content={SITE_LOCALE} />
      <meta key="og:title" property="og:title" content={pageTitle} />
      {pageDescription ? (
        <meta key="og:description" property="og:description" content={pageDescription} />
      ) : null}
      <meta key="og:url" property="og:url" content={canonical} />
      <meta key="og:image" property="og:image" content={absoluteUrl(ogImage)} />
      <meta key="og:image:alt" property="og:image:alt" content={DEFAULT_OG_IMAGE.alt} />

      {/* Twitter */}
      <meta key="twitter:card" name="twitter:card" content={TWITTER_CARD} />
      <meta key="twitter:title" name="twitter:title" content={pageTitle} />
      {pageDescription ? (
        <meta key="twitter:description" name="twitter:description" content={pageDescription} />
      ) : null}
      <meta key="twitter:image" name="twitter:image" content={absoluteUrl(ogImage)} />

      {jsonLd.map((data, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialize(data) }}
        />
      ))}
    </Head>
  );
};

export default Seo;
