import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import ContactInfo from "../components/Contact/ContactInfo";
import ContactForm from "../components/Contact/ContactForm";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const Contact = () => {
  return (
    <>
      <Seo route="/contact" />

      <Navbar />

      <PageBanner
        pageTitle="Kontakt/Funderingar"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Kontakt/Funderingar"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <ContactInfo />

      <ContactForm />
      <Footer />
    </>
  );
};

export default Contact;
