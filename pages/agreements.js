import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import ServiceDetails from "../components/HomeFour/ServiceDetails";
import AgreementsDetails from "../components/HomeFour/AgreementsDetails";




const agreements = () => {
  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Convenios" bgImage="/images/associate/servicios.jpeg" />
      <AgreementsDetails />
      <Footer />
    </>
  );
};

export default agreements;
