import React from "react";
import Footer from "../../components/Layouts/Footer";
import Navbar from "../../components/Layouts/Navbar";
import PageBanner from "../../components/Common/PageBanner";
// import Footer from "../components/Layouts/Footer";
import CreditsDetails from "../../components/HomeFour/CreditsDetails";




const Details = () => {
  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Detalles del Crédito" bgImage="/images/associate/credits.jpg" />
      <CreditsDetails />
      <Footer />
    </>
  );
};

export default Details;
