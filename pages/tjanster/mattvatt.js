import React from "react";
import QuoteServicePage from "../../components/ServiceContent/QuoteServicePage";
import content from "../../content/services/mattvatt";

const CarpetWashing = () => (
  <QuoteServicePage
    route="/tjanster/mattvatt"
    pageTitle="Mattvätt"
    banner="/images/banners/mattvatt.webp"
    service="Mattvätt"
    content={content}
  />
);

export default CarpetWashing;
