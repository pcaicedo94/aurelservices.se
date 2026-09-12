import React from "react";
import Head from "next/head";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import PrivacyPolicyContent from "../components/PrivacyPolicy/PrivacyPolicyContent";
import Footer from "../components/Layouts/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Head>
        <title>{"Integritetspolicy – Aurel Städ & Allservice"}</title>
      </Head>

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
