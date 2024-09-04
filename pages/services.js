import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import Cards from "../components/Common/Cards";
import ServicesDetails from "../components/HomeOne/ServicesDetails";

const Services = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Tjänster"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Tjänster"
        breadcrumbUrl="/"
        bgImage="/images/services-bg.jpg"
      />
      <ServicesDetails/>
      <Footer />
    </>
  );
};

export default Services;
