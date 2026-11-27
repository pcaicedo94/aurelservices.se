import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import BookingTermsContent from "../components/TermsCondition/BookingTermsContent";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";

const BookingTerms = () => (
  <>
    <Seo route="/bokningsvillkor" />
    <Navbar />
    <PageBanner
      pageTitle="Bokningsvillkor"
      breadcrumbTextOne="Start"
      breadcrumbTextTwo="Bokningsvillkor"
      breadcrumbUrl="/"
      bgImage="/images/page-title-bg.jpg"
    />
    <BookingTermsContent />
    <Footer />
  </>
);

export default BookingTerms;
