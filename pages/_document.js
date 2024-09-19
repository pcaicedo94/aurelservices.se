import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }
  render() {
    return (
      <Html lang="es">
        <Head>
          <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i&display=swap"
            rel="preconnect"
          />
          <link
            href="https://fonts.googleapis.com/css?family=Dosis:200,300,400,500,600,700,800&display=swap"
            rel="preconnect"
          />
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
          <meta
            property="og:image"
            content="http://ceter.com.co/img/logo.png"
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="www.ceter.com.co" />
          <meta property="og:site_name" content="Ceter" />
          <meta name="author" content="joseluiscl@gmail.com" />
          <link rel="preconnect" type="image/png" href="images/favicon.png" />
        </Head>
        <body>
        <script async type='module' src='https://interfaces.zapier.com/assets/web-components/zapier-interfaces/zapier-interfaces.esm.js'></script>
        <zapier-interfaces-chatbot-embed is-popup='true' chatbot-id='cm15025ns0021k2fihjtlkpms' height='600px' width='400px'></zapier-interfaces-chatbot-embed>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
