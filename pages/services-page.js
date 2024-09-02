import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import ServiceDetails from "../components/HomeFour/ServiceDetails";


const servicePage = () => {
  return (
    <>
      <Navbar associates />
      <PageBanner pageTitle="Servicios" bgImage="/images/estaciones.png" />
      <ServiceDetails />
      <Footer />
    </>
  );
};

export default servicePage;
