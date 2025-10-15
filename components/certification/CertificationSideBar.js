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
                <Link href="/about-us">Acerca de Ceter</Link>              </span>
            </li>
            <li>
              <span className="comment-author-link">
                <Link href="/services">Estaciones de servicio</Link>              </span>
            </li>
            <li>
              <span className="comment-author-link">
                <Link href="/associates">Asociados</Link>              </span>
            </li>
            <li>
              <span className="comment-author-link">
                <Link href="/contact">Escríbenos</Link>              </span>
            </li>
            {/* <li>
              <span className="comment-author-link">
                <Link href="/"></Link>              </span>
            </li> */}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default CertificationSideBar;
