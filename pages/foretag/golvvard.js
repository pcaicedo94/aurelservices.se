import React from "react";
import QuoteServicePage from "../../components/ServiceContent/QuoteServicePage";
import content from "../../content/services/golvvard";

const FloorCare = () => (
  <QuoteServicePage
    route="/foretag/golvvard"
    pageTitle="Golvvård"
    banner="/images/banners/golvvard.webp"
    bannerPosition="center 30%"
    service="Golvvård"
    content={content}
  />
);

export default FloorCare;
