import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Footer from "../components/Layouts/Footer";

const Team = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Trappstädning"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Trappstädning"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-5.jpg"
      />

      

      

      <div className="ptb-100">
        
      </div>

      <Footer />
    </>
  );
};

export default Team;
