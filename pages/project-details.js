import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import ProjectDetailsContent from "../components/Projects/ProjectDetailsContent";
import Footer from "../components/Layouts/Footer";

const ProjectDetails = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Project Details"
        breadcrumbTextOne="Home"
        breadcrumbTextTwo="Project Details"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg.jpg"
      />

      <ProjectDetailsContent />

      <Footer />
    </>
  );
};

export default ProjectDetails;
