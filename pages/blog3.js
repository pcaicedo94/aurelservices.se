import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import BlogCardThree from "../components/Blog/BlogCardThree";
import Footer from "../components/Layouts/Footer";

const Blog3 = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Blog Left Sidebar"
        breadcrumbTextOne="Home"
        breadcrumbTextTwo="Blog Left Sidebar"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-5.jpg"
      />

      <BlogCardThree />

      <Footer />
    </>
  );
};

export default Blog3;
