import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import TermsConditionContent from "../components/TermsCondition/TermsConditionContent";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const TermsCondition = () => {
  return (
    <>
      <Seo route="/terms-condition" />

      <Navbar />

      <PageBanner
        pageTitle="Allmänna villkor"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Allmänna villkor"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <TermsConditionContent />

      <Footer />
    </>
  );
};

export default TermsCondition;
