import React from "react";
import Link from "next/link";

const BlogPost = () => {
  return (
    <>
      <div className="blog-section pt-100 pb-70">
        <div className="container">
          <div className="section-title">
            <span>Blog</span>
            <h2>Our Recent Post</h2>
          </div>

          <div className="row justify-content-center">
            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="200"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="blog-item">
                <Link href="/blog-details">
                  <img src="/images/blog/blog3.png" alt="image" />
                </Link>

                <div className="blog-content">
                  <ul className="meta-tags">
                    <li>
                      <Link href="/blog">
                        <i className="fa fa-user-alt"></i>
                        Admin
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog">
                        <i className="fas fa-calendar-week"></i>7 Dec 2020
                      </Link>
                    </li>
                    <li>
                      <i className="far fa-comments"></i>3 Comments
                    </li>
                  </ul>

                  <h3>
                    <Link href="/blog-details">
                      Startup marketing solution for business owner
                    </Link>
                  </h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod.
                  </p>

                  <Link href="/blog-details" className="read-more">
                    Read More
                    <i className="fa fa-chevron-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="350"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="blog-item">
                <Link href="/blog-details">
                  <img src="/images/blog/blog4.png" alt="image" />
                </Link>

                <div className="blog-content">
                  <ul className="meta-tags">
                    <li>
                      <Link href="/blog">
                        <i className="fa fa-user-alt"></i>
                        Admin
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog">
                        <i className="fas fa-calendar-week"></i>7 Dec 2020
                      </Link>
                    </li>
                    <li>
                      <i className="far fa-comments"></i>3 Comments
                    </li>
                  </ul>

                  <h3>
                    <Link href="/blog-details">
                      Web development best work in future world
                    </Link>
                  </h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod.
                  </p>

                  <Link href="/blog-details" className="read-more">
                    Read More
                    <i className="fa fa-chevron-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay="450"
              data-aos-duration="1200"
              data-aos-once="true"
            >
              <div className="blog-item">
                <Link href="/blog-details">
                  <img src="/images/blog/blog5.png" alt="image" />
                </Link>

                <div className="blog-content">
                  <ul className="meta-tags">
                    <li>
                      <Link href="/blog">
                        <i className="fa fa-user-alt"></i>
                        Admin
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog">
                        <i className="fas fa-calendar-week"></i>7 Dec 2020
                      </Link>
                    </li>
                    <li>
                      <i className="far fa-comments"></i>3 Comments
                    </li>
                  </ul>

                  <h3>
                    <Link href="/blog-details">
                      Creative solutions to improve your business!
                    </Link>
                  </h3>

                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                    do eiusmod.
                  </p>

                  <Link href="/blog-details" className="read-more">
                    Read More
                    <i className="fa fa-chevron-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
