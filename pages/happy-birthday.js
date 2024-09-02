import React from "react";
import Navbar from "../components/Layouts/Navbar";
import PageBanner from "../components/Common/PageBanner";
import Schedule from "../components/HomeFour/Schedule";
import Footer from "../components/Layouts/Footer";

const HappyBirthday = () => {
  return (
    <>
      <Navbar associates />
      <PageBanner bgImage="/images/hb.jpg" />
      <Schedule />
      <Footer />
    </>
  );
};

export default HappyBirthday;
