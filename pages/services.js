import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import Cards from "../components/Common/Cards";

const Services = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Estaciones de servicio"
        breadcrumbTextOne="Inicio"
        breadcrumbTextTwo="Estaciones de servicio"
        breadcrumbUrl="/"
        bgImage="/images/estaciones.png"
      />
      <Cards />
      <Footer />
    </>
  );
};

export default Services;
