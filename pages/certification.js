import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";
import CertificationDetails from "../components/certification/certificationDetails";


const Certification = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Gestión certificada"
        breadcrumbTextOne="Inicio"
        breadcrumbTextTwo="Gestión certificada"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-4.jpg"
      />

      <CertificationDetails/>

      <Footer />
    </>
  );
};

export default Certification;
