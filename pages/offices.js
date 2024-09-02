import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import OfficesDetails from "../components/Offices/OfficesDetails";
const ProjectDetails = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Nuestras oficinas"
        breadcrumbTextOne="Inicio"
        breadcrumbTextTwo="Nuestras oficinas"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <OfficesDetails/>
      <Footer />
    </>
  );
};

export default ProjectDetails;
