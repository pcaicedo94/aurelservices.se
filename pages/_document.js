import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }
  render() {
    return (
      <Html lang="sv">
        {/*
          next/document cannot be deduplicated against next/head, so anything
          that varies per page (title, description, canonical, Open Graph,
          Twitter, JSON-LD) is emitted by <Seo> instead. Only document-wide
          tags belong here.
        */}
        <Head>
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
