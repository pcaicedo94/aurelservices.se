import React from "react";
import QuoteServicePage from "../../components/ServiceContent/QuoteServicePage";
import content from "../../content/services/flytthjalp";

const MovingHelp = () => (
  <QuoteServicePage
    route="/tjanster/flytthjalp"
    pageTitle="Flytthjälp"
    banner="/images/banners/flytthjalp.webp"
    service="Flytthjälp"
    quoteProps={{
      // The address the quote form asks for is where the move starts; where
      // it ends is the first of the service fields.
      addressLabel: "Adress du flyttar från",
      addressPlaceholder: "Ange adressen du flyttar från",
    }}
    content={content}
  />
);

export default MovingHelp;
