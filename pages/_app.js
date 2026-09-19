import React from "react";
import AOS from "aos";
import "../node_modules/aos/dist/aos.css";
import "../styles/bootstrap.min.css";
import '../styles/flaticon.css';
import '../styles/fontawesome.min.css';
import "react-accessible-accordion/dist/fancy-example.css";
import 'react-tabs/style/react-tabs.css';
import FAQbot from "../components/ChatBot/FAQbot";

// Globals CSS
import "../styles/style.css";
import "../styles/responsive.css";

import Head from "next/head";
import GoTop from "../components/Shared/GoTop";

function MyApp({ Component, pageProps }) {
  React.useEffect(() => {
    AOS.init();
  }, []);
  return (
    <>
      {/*
        Only viewport-level tags live here. Title, description, canonical,
        Open Graph, Twitter and JSON-LD belong to <Seo> (components/Common/Seo.js)
        so every page gets exactly one of each instead of a generic duplicate.
      */}
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>


      <Component {...pageProps} />

      {/* Go Top Button */}
      <GoTop />
      {/* FAQ Chatbot */}
      <FAQbot />

    </>
  );
}

export default MyApp;
