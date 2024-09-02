import React from "react";
import Navbar from "../components/Layouts/Navbar";
import Footer from "../components/Layouts/Footer";
import BenefitsDetails from "../components/HomeFour/BenefitsDetails";
import PageBanner from "../components/Common/PageBanner";

const BenefitsPage = () => {
  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Beneficios" bgImage="/images/associate/beneficios.webp" />
      <BenefitsDetails />

      <Footer />
    </>
  );
};

export default BenefitsPage;
