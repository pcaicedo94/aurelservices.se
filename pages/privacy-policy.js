import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import PrivacyPolicyContent from "../components/PrivacyPolicy/PrivacyPolicyContent";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const PrivacyPolicy = () => {
  return (
    <>
      <Seo route="/privacy-policy" />

      <Navbar />

      <PageBanner
        pageTitle="Integritetspolicy"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Integritetspolicy"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-5.jpg"
      />

      <PrivacyPolicyContent />

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
