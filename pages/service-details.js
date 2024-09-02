import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import ServiceDetailsContent from "../components/Services/ServiceDetailsContent";
import Footer from "../components/Layouts/Footer";

const ServiceDetails = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Service Details"
        breadcrumbTextOne="Home"
        breadcrumbTextTwo="Service Details"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-3.jpg"
      />

      <ServiceDetailsContent />

      <Footer />
    </>
  );
};

export default ServiceDetails;
