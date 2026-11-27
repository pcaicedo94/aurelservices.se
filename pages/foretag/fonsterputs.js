import React from "react";
import QuoteServicePage from "../../components/ServiceContent/QuoteServicePage";
import content from "../../content/services/fonsterputsForetag";

const WindowCleaningBusiness = () => (
  <QuoteServicePage
    route="/foretag/fonsterputs"
    pageTitle="Fönsterputsning för företag"
    banner="/images/banners/fonsterputs-foretag.webp"
    service="Fönsterputsning för företag"
    quoteProps={{ addressPlaceholder: "Ange lokalens adress" }}
    content={content}
  />
);

export default WindowCleaningBusiness;
