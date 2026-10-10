import React from "react";

export default function FooterTwo() {
  return (
    <>
      <footer className="footer-section">
        <div
          className="footer-top pt-5 pb-5 background-img-2"
          style={{
           
          }}
        >
          <div className="container">
            <div className="row justify-content-between">
              <div className="col-lg-3 mb-3 mb-lg-0">
                <div className="footer-nav-wrap text-white">
                  <img
                    src="/assets/img/logo-white-1x.png"
                    alt="footer logo"
                    width="120"
                    className="img-fluid mb-3"
                  />
                  <p>
                    Holisticly empower premium architectures without value-added
                    ideas. Seamlessly evolve cross-platform experiences.
                  </p>

                  <div className="social-list-wrap">
                    <ul className="social-list list-inline list-unstyled">
                      <li className="list-inline-item">
                        <a href="#/" target="_blank" title="Facebook">
                          <span className="ti-facebook"></span>
                        </a>
                      </li>
                      <li className="list-inline-item">
                        <a href="#/" target="_blank" title="Twitter">
                          <span className="ti-twitter"></span>
                        </a>
                      </li>
                      <li className="list-inline-item">
                        <a href="#/" target="_blank" title="Instagram">
                          <span className="ti-instagram"></span>
                        </a>
                      </li>
                      <li className="list-inline-item">
                        <a href="#/" target="_blank" title="printerst">
                          <span className="ti-pinterest"></span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 ml-auto mb-4 mb-lg-0">
                <div className="footer-nav-wrap text-white">
                  <h5 className="mb-3 text-white">Others Links</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <a href="#about">About Us</a>
                    </li>
                    <li className="mb-2">
                      <a href="#contact">Contact Us</a>
                    </li>
                    <li className="mb-2">
                      <a href="#pricing">Pricing</a>
                    </li>
                    <li className="mb-2">
                      <a href="#/">Privacy Policy</a>
                    </li>
                    <li className="mb-2">
                      <a href="#/">Terms and Conditions</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3 ml-auto mb-4 mb-lg-0">
                <div className="footer-nav-wrap text-white">
                  <h5 className="mb-3 text-white">Support</h5>
                  <ul className="list-unstyled support-list">
                    <li className="mb-2 d-flex align-items-center">
                      <span className="ti-location-pin mr-2"></span>
                      121 King Melbourne
                      <br />
                      Australia 3000
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <span className="ti-mobile mr-2"></span>{" "}
                      <a href="tel:+61283766284"> +61 2 8376 6284</a>
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <span className="ti-email mr-2"></span>
                      <a href="mailto:mail@example.com"> mail@example.com</a>
                    </li>
                    <li className="mb-2 d-flex align-items-center">
                      <span className="ti-world mr-2"></span>
                      <a href="#/"> www.yourdomain.com</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="footer-nav-wrap text-white">
                  <h5 className="mb-3 text-white">Location</h5>
                  <img
                    src="/assets/img/map.png"
                    alt="location map"
                    className="img-fluid"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom gray-light-bg pt-4 pb-4">
          <div className="container">
            <div className="row text-center justify-content-center">
              <div className="col-md-6 col-lg-5">
                <p className="copyright-text pb-0 mb-0">
                  Copyrights © {new Date().getFullYear()} All rights reserved by
                  <a href="#/">ThemeTags</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
