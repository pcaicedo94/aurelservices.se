import React from "react";

const ContactInfo = () => {
  return (
    <>
      <div className="contact-box pt-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-3 col-md-6">
              <div className="single-contact-box">
                <i className="fa fa-map-marker"></i>
                <div className="content-title">
                  <a href="https://tinyurl.com/AurelstadAB">
                    <h3>Adress</h3>
                    <p>Aurel Städ AB</p>
                    <p>
                      Bredängs Allé 10 NB
                      <br />
                      127 32 Skärholmen
                    </p>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="single-contact-box">
                <i className="fa fa-envelope"></i>
                <div className="content-title">
                  <a href="mailto:info@aurelservice.se">
                    <h3>Email</h3>
                    <p>info@aurelservice.se</p>
                    <p>&nbsp;</p>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="single-contact-box">
                <i className="fa fa-phone"></i>
                <div className="content-title">
                  <a href="tel:+46 76 045 0228">
                    <h3>Telefon</h3>
                    <p>+46 76 045 0228</p>
                    <p>&nbsp;</p>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="single-contact-box">
                <i className="fab fa-instagram"></i>
                <div className="content-title">
                  <a
                    href="https://www.instagram.com/aurelstad_ab/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <h3>Instagram</h3>
                    <p>@AurelServices</p>
                    <p>&nbsp;</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactInfo;
