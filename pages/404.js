import React from "react";
import Link from "next/link";
import Navbar from "../components/Layouts/Navbar";
import Footer from "../components/Layouts/Footer";
const CoustomErorPage = () => {
  return (
    <>
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
              <img src="/images/404.png" alt="Image" />

              <h3>Página No Encontrada 🔍</h3>
              <h4>
                La página que esta buscando no está disponible.
              </h4>

              <Link href="/" className="default-btn-one">Regresar al Inicio</Link>            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CoustomErorPage;
