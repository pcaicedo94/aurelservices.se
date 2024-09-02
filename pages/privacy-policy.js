import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import PrivacyPolicyContent from "../components/PrivacyPolicy/PrivacyPolicyContent";
import Footer from "../components/Layouts/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Privacy Policy"
        breadcrumbTextOne="Home"
        breadcrumbTextTwo="Privacy Policy"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-5.jpg"
      />

      <PrivacyPolicyContent />

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
