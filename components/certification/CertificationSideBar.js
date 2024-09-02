import React from "react";
import Link from "next/link";

const CertificationSideBar = () => {
  return (
    <>
      <aside className="widget-area">
        <div className="widget widget_recent_comments">
          <h3 className="widget-title">Otros enlaces</h3>

          <ul>
            <li>
              <span className="comment-author-link">
                <Link href="/about-us">
                  <a>Acerca de Ceter</a>
                </Link>
              </span>
            </li>
            <li>
              <span className="comment-author-link">
                <Link href="/services">
                  <a>Estaciones de servicio</a>
                </Link>
              </span>
            </li>
            <li>
              <span className="comment-author-link">
                <Link href="/associates">
                  <a>Asociados</a>
                </Link>
              </span>
            </li>
            <li>
              <span className="comment-author-link">
                <Link href="/contact">
                  <a>Escríbenos</a>
                </Link>
              </span>
            </li>
            {/* <li>
              <span className="comment-author-link">
                <Link href="/">
                  <a></a>
                </Link>
              </span>
            </li> */}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default CertificationSideBar;
