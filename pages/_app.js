import React from "react";
import AOS from "aos";
import "../node_modules/aos/dist/aos.css";
import "../styles/bootstrap.min.css";
import '../styles/flaticon.css';
import '../styles/fontawesome.min.css';
import "react-accessible-accordion/dist/fancy-example.css";
import 'react-tabs/style/react-tabs.css';
import "swiper/css/bundle";

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
        <title>Aurelservices</title>
        <meta charSet="UTF-8"></meta>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        <title>
          Aurelservices
        </title>
        <meta
          name="description"
          content="Cooperativa Multiactiva y de Transporte de Santander."
        />
        <meta name="keywords" content="ceter" />
        <meta property="og:title" content="Ceter - lineas de negocio " />
        <meta
          property="og:description"
          content="1. Estaciones de servicio 2.Transporte 3. Asociados "
        />
        <meta property="og:image" content="http://ceter.com.co/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="www.ceter.com.co" />
        <meta property="og:site_name" content="Ceter" />
        <meta name="author" content="jose caicedo" />
      </Head>


      <Component {...pageProps} />

      {/* Go Top Button */}
      <GoTop />
    </>
  );
}

export default MyApp;
