import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import FaqContent from "../components/Faq/FaqContent";
import FaqContactForm from "../components/Faq/FaqContactForm";
import Footer from "../components/Layouts/Footer";

const Faq = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Frequently Asked Questions"
        breadcrumbTextOne="Home"
        breadcrumbTextTwo="Faq"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-2.jpg"
      />

      <FaqContent />

      <FaqContactForm />

      <Footer />
    </>
  );
};

export default Faq;
