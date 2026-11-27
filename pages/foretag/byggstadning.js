import React from "react";
import QuoteServicePage from "../../components/ServiceContent/QuoteServicePage";
import content from "../../content/services/byggstadning";

// Byggstädning is sold by quote only (client Q74-Q77): the scope has to be
// seen on site before it can be priced, so no figure appears on this page.
// The banner is the flyttstädning-för-företag photo: final cleaning of an
// empty flat, which is what slutstädning looks like.

const ConstructionCleaning = () => (
  <QuoteServicePage
    route="/foretag/byggstadning"
    pageTitle="Byggstädning"
    banner="/images/banners/flyttstadning-foretag.webp"
    service="Byggstädning"
    bannerProps={{ breadcrumbTextOne: "Start", breadcrumbTextTwo: "Byggstädning", breadcrumbUrl: "/" }}
    quoteProps={{ addressPlaceholder: "Ange adressen för byggprojektet" }}
    content={content}
  />
);

export default ConstructionCleaning;
