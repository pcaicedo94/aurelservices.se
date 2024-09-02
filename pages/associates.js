import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
// import CustomerStyleTwo from "../components/Common/CustomerStyleTwo";
// import Customers from "../components/Common/Customers";
// import SubscribeStyleThree from "../components/Common/SubscribeStyleThree";
import Associate from "../components/Common/Associate";
import Footer from "../components/Layouts/Footer";

const Partner = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Asociados"
        breadcrumbTextOne="Inicio"
        breadcrumbTextTwo="Asociados"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-3.jpg"
      />

      <div
        data-aos="fade-up"
        data-aos-delay="200"
        data-aos-duration="1200"
        data-aos-once="true"
      >
        <Associate />
      </div>

      <Footer />
    </>
  );
};

export default Partner;
