import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }
  render() {
    return (
      <Html lang="sv">
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
            content="Aurel Städ AB - Din pålitliga partner för städning. Hemstädning, flyttstädning, storstädning och mer."
          />
          <meta name="keywords" content="Aurel, städning, hemstädning, flyttstädning, storstädning, fönsterputsning, Stockholm" />
          <meta property="og:title" content="Aurel - Din pålitliga partner för städning sedan 2007" />
          <meta
            property="og:description"
            content="Hemstädning, Flyttstädning, Storstädning, Fönsterputsning och mer"
          />
          <meta
            property="og:image"
            content="https://ebdd2f72b3.clvaw-cdnwnd.com/ca2b33d3f3f599895a9560be0604adf7/200000001-40b5b40b5d/450/logotyp.webp?ph=ebdd2f72b3"
          />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.aurelservice.se" />
          <meta property="og:site_name" content="Aurel Städ AB" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
