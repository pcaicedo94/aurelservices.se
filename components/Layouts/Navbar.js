import React from "react";
import Link from "next/link";

const Navbar = ({ associates }) => {
  const [menu, setMenu] = React.useState(true);
  const toggleNavbar = () => {
    setMenu(!menu);
  };

  React.useEffect(() => {
    let elementId = document.getElementById("navbar");
    document.addEventListener("scroll", () => {
      if (window.scrollY > 170) {
        elementId.classList.add("is-sticky");
      } else {
        elementId.classList.remove("is-sticky");
      }
    });
  });

  const classOne = menu
    ? "collapse navbar-collapse mean-menu"
    : "collapse navbar-collapse show";
  const classTwo = menu
    ? "navbar-toggler navbar-toggler-right collapsed"
    : "navbar-toggler navbar-toggler-right";

  return (
    <>
      <div id="navbar" className="navbar-area">
        <div className="main-nav">
          <div className="container">
            <nav className="navbar navbar-expand-md navbar-light">
              <Link href="/" className="navbar-brand">
                <img
                  src="/images/logo.png"
                  className="white-logo"
                  alt="logo"
                  loading="lazy"
                />
                <img
                  src="/images/logo-white.png"
                  className="black-logo"
                  alt="logo"
                  loading="lazy"
                />
              </Link>

              <button
                onClick={toggleNavbar}
                className={classTwo}
                type="button"
                data-toggle="collapse"
                data-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="icon-bar top-bar"></span>
                <span className="icon-bar middle-bar"></span>
                <span className="icon-bar bottom-bar"></span>
              </button>

              <div className={classOne} id="navbarSupportedContent">
                <ul className="navbar-nav m-auto">
                  <li className="nav-item">
                    <Link
                      href="/about-us"
                      className="nav-link"
                    >
                      Om Oss
                    </Link>
                  </li>

                  <li className="nav-item submenu">
                    <Link href="/private-services" className="nav-link">
                      Privata Tjänster
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link href="/homecleaning" className="dropdown-item">
                          Hemstädning
                        </Link>
                      </li>
                      <li>
                        <Link href="/movecleaning" className="dropdown-item">
                          Flyttstädning
                        </Link>
                      </li>
                      <li>
                        <Link href="/deepcleaning" className="dropdown-item">
                          Storstädning
                        </Link>
                      </li>
                      <li>
                        <Link href="/windowcleaning" className="dropdown-item">
                          Fönsterputsning
                        </Link>
                      </li>
                    </ul>
                  </li>

                                    <li className="nav-item submenu">
                    <Link href="/services" className="nav-link">
                       Företag och BRF
                    </Link>
                    <ul className="dropdown-menu">
                      <li>
                        <Link href="/officecleaning" className="dropdown-item">
                          Kontorsstädning
                        </Link>
                      </li>
                      <li>
                        <Link href="/deepcleaning" className="dropdown-item">
                          Bod- och Etableringstädning
                        </Link>
                      </li>
                      <li>
                        <Link href="/windowcleaning" className="dropdown-item">
                          Fönsterputsning
                        </Link>
                      </li>
                      <li>
                        <Link href="/staircleaning" className="dropdown-item">
                          Trappstädning
                        </Link>
                      </li>
                    </ul>
                  </li>

                  <li className="nav-item">
                    <Link
                      href="/contact"
                      className="nav-link"
                    >
                      Kontakta Oss
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
