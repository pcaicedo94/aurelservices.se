import React from "react";
import Link from "next/link";

const GetStartedProject = () => {
  return (
    <>
      <div className="productive-section pt-100">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="productive-content">
                {/* <span>Let’s Get Started</span> */}
                <h3>Lita på oss för att förnya ditt utrymme och miljö!</h3>
                <p>
                Förvandla ditt utrymme till en fridfull oas av renhet och harmoni.
                Upplev freden som våra experttjänster ger!
                </p>

                <div className="productive-btn">
                  <Link href="/contact">
                    <a className="productive-btn-one">
                      Kontakta Oss
                      <span></span>
                    </a>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="productive-image">
                <img src="/images/peaceful.jpg" alt="image" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GetStartedProject;
