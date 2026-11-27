import React from "react";
import QuoteServicePage from "../../components/ServiceContent/QuoteServicePage";
import content from "../../content/services/trappstadning";

const StairCleaning = () => (
  <QuoteServicePage
    route="/foretag/trappstadning"
    pageTitle="Trappstädning"
    banner="/images/banners/trappstadning.webp"
    bannerPosition="center 25%"
    service="Trappstädning"
    bannerProps={{ breadcrumbTextOne: "Start", breadcrumbTextTwo: "Trappstädning", breadcrumbUrl: "/" }}
    quoteProps={{ addressPlaceholder: "Ange fastighetens adress" }}
    content={content}
  />
);

export default StairCleaning;
