import React from "react";
import Link from "next/link";
import Navbar from "../components/Layouts/Navbar";
import Footer from "../components/Layouts/Footer";
import Seo from "../components/Common/Seo";
const CoustomErorPage = () => {
  return (
    <>
      <Seo route="/404" />

      <Navbar />
      <div className="error-area">
        <div className="d-table">
          <div className="container">
            <div
              className="error-content"
              data-aos="fade-up"
              data-aos-delay="100"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              {/* Decorative illustration: the heading below says the same. */}
              <img src="/images/404.png" alt="" />

              <h1>Sidan finns ej 🔍</h1>
              <p className="error-lead">
                Sidan du letar efter är inte tillgänglig.
              </p>

              {/* Keeps the outline H1 → H2 → H3 (the footer starts at H3). */}
              <h2>Vart vill du gå?</h2>
              <Link href="/" className="default-btn-one">Återgå till startsidan</Link>            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CoustomErorPage;
