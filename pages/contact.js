import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import ContactInfo from "../components/Contact/ContactInfo";
import ContactForm from "../components/Contact/ContactForm";
import Footer from "../components/Layouts/Footer";
import FinancialDetails from "../components/FinancialStatements/FinancialDetails";

const Contact = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Contacto / Pqrs"
        breadcrumbTextOne="Inicio"
        breadcrumbTextTwo="Contacto/PQRS"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <ContactInfo />

      <ContactForm />
      <FinancialDetails/>
      <Footer />
    </>
  );
};

export default Contact;
