import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import TeamMemberContent from "../components/Team/TeamMemberContent";
import Testimonial from "../components/Common/Testimonial";
import SubscribeStyleThree from "../components/Common/SubscribeStyleThree";
import Footer from "../components/Layouts/Footer";

const Team = () => {
  return (
    <>
      <Navbar />

      <PageBanner
        pageTitle="Team"
        breadcrumbTextOne="Home"
        breadcrumbTextTwo="Our Team Member"
        breadcrumbUrl="/"
        bgImage="/images/page-title-bg-5.jpg"
      />

      <TeamMemberContent />

      <Testimonial />

      <div className="ptb-100">
        <SubscribeStyleThree />
      </div>

      <Footer />
    </>
  );
};

export default Team;
