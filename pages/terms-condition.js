import React from "react";
import Head from "next/head";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import TermsConditionContent from "../components/TermsCondition/TermsConditionContent";
import Footer from "../components/Layouts/Footer";

const TermsCondition = () => {
  return (
    <>
      <Head>
        <title>{"Allmänna villkor – Aurel Städ & Allservice"}</title>
      </Head>

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
