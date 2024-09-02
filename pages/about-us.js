import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import AboutUsContent from "../components/AboutUs/AboutUsContent";
import FunFacts from "../components/Common/FunFacts";
import GetStartedProject from "../components/Common/GetStartedProject";
import Testimonial from "../components/Common/Testimonial";
import TeamMember from "../components/Common/TeamMember";
import Customers from "../components/Common/Customers";
import Footer from "../components/Layouts/Footer";
import OurValues from "../components/HomeOne/OurValues";
import WorkingProcess from "../components/HomeOne/WorkingProcess";

const AboutUs = () => {
  return (
    <>
      <Navbar />
      <PageBanner
        pageTitle="Om oss"
        breadcrumbTextOne="start"
        breadcrumbTextTwo="Om oss"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />
      <AboutUsContent />
      <WorkingProcess />
      <FunFacts />
      <div className="pt-100">
        <OurValues />
      </div>

      <Customers />

      <Footer />
    </>
  );
};

export default AboutUs;
