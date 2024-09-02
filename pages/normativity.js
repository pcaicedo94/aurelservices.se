import React from "react";
import Navbar from "../components/Layouts/Navbar";
// import MainBanner from "../components/HomeFour/MainBanner";
// import SolutionsTab from "../components/Common/SolutionsTab";
import Footer from "../components/Layouts/Footer";
import NormativityDetails from "../components/HomeFour/NormativityDetails";
import PageBanner from "../components/Common/PageBanner";

const Normativity = () => {
  return (
    <>
      <Navbar associates />
      {/* <MainBanner /> */}
      <PageBanner bgImage="/images/associate/normatividad.jpg" />
      <NormativityDetails />
      {/* <AboutUs /> */}
      {/* <SolutionsTab />*/}

      <Footer />
    </>
  );
};

export default Normativity;
