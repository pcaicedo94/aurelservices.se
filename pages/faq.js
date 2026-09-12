import React from "react";
import Head from "next/head";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import FaqContent, { faqSchema } from "../components/Faq/FaqContent";
import ContactForm from "../components/Contact/ContactForm";
import Footer from "../components/Layouts/Footer";

// "<" is escaped so no answer text can close the script tag early.
const schemaJson = JSON.stringify(faqSchema()).replace(/</g, "\\u003c");

const Faq = () => {
  return (
    <>
      <Head>
        <title>{"Vanliga frågor – Aurel Städ & Allservice"}</title>
        <script
          key="faq-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      </Head>

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
