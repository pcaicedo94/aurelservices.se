import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import FaqContent, { faqSchema } from "../components/Faq/FaqContent";
import ContactForm from "../components/Contact/ContactForm";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

// The FAQPage JSON-LD is derived from the questions rendered on this page, so
// the markup and the structured data can never drift apart.
const Faq = () => {
  return (
    <>
      <Seo route="/faq" schemas={[faqSchema()]} />

      <Navbar />

      <PageBanner
        pageTitle="Vanliga frågor"
        breadcrumbTextOne="Start"
        breadcrumbTextTwo="Vanliga frågor"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-2.jpg"
      />

      <FaqContent />

      <ContactForm />

      <Footer />
    </>
  );
};

export default Faq;
