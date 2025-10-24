import React from "react";
import AOS from "aos";
import "../node_modules/aos/dist/aos.css";
import "../styles/bootstrap.min.css";
import '../styles/flaticon.css';
import '../styles/fontawesome.min.css';
import "react-accessible-accordion/dist/fancy-example.css";
import 'react-tabs/style/react-tabs.css';
import "swiper/css/bundle";
import Chatbot from "../components/ChatBot/Chatbot";

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
      <Head>
        <title>Aurel Service AB</title>
        <meta charSet="UTF-8"></meta>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        <title>
          Aurel Service AB
        </title>
        <meta
          name="description"
          content="Din pålitliga partner för städning sedan efter 2007."
        />
        <meta name="keywords" content="Aurel" />
        <meta property="og:title" content="Aurelstäd - 18 års erfarenhet " />
        <meta
          property="og:description"
          content="1. Hemstädning 2. Flyttstädning 3. Storstädning "
        />
        <meta property="og:image" content="https://ebdd2f72b3.clvaw-cdnwnd.com/ca2b33d3f3f599895a9560be0604adf7/200000001-40b5b40b5d/450/logotyp.webp?ph=ebdd2f72b3" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="www.aurelservices.se" />
        <meta property="og:site_name" content="Aurelservices" />
        <meta name="author" content="pablo andres caicedo" />
      </Head>


      <Component {...pageProps} />

      {/* Go Top Button */}
      <GoTop />
      {/* Chatbot */}

    </>
  );
}

export default MyApp;
