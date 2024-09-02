import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import CreditsDetails from "../components/HomeFour/CreditsDetails";




const credits = () => {
  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Créditos" bgImage="/images/associate/credits.jpg" />
      <CreditsDetails />
      <Footer />
    </>
  );
};

export default credits;
