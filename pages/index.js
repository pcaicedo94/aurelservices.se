import React from "react";
import Script from "next/script";
import Navbar from "../components/Layouts/Navbar";
import MainBanner from "../components/HomeOne/MainBanner";
import OurServices from "../components/HomeOne/OurServices";
import AboutUs from "../components/HomeOne/AboutUs";
import FunFacts from "../components/Common/FunFacts";
import WorkingProcess from "../components/HomeOne/WorkingProcess";
import FeaturedService from "../components/HomeOne/FeaturedService";
import Testimonial from "../components/Common/Testimonial";
import SolutionsTab from "../components/Common/SolutionsTab";
import GetStartedProject from "../components/Common/GetStartedProject";
import BlogPost from "../components/Common/BlogPost";
import Customers from "../components/Common/Customers";
import Subscribe from "../components/Common/Subscribe";
import Footer from "../components/Layouts/Footer";

const Index = () => {
  return (
    <>
      <Navbar />

      <MainBanner />
                  {/* --- Start of Shapo Reviews Widget --- */}
      <div className="container pt-100">
        <div id="shapo-widget-72759a1d81b0785a4632"></div>
        <Script
          id="shapo-embed-js"
          type="text/javascript"
          src="https://cdn.shapo.io/js/embed.js"
          strategy="lazyOnload"
        />
      </div>
      {/* --- End of Shapo Reviews Widget --- */}

      <OurServices />

      <Customers />

      <AboutUs />

      <FunFacts />

      <div className="pb-100">
        <GetStartedProject />
      </div>

      <Footer />
    </>
  );
};

export default Index;
