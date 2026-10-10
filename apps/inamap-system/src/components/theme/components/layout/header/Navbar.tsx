import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import { useSelector } from "react-redux";
import { LangSwitcher } from "dash-admin";
import { DarkToggleModeLight } from "dash-boilerplate";

const Navbar = ({ classOption }) => {

  const [scroll, setScroll] = useState(0);
  const [headerTop, setHeaderTop] = useState(0);

  const panelSettings = useSelector((state: any) => state.common.panelSettings);
  const horizontalLogo = panelSettings?.horizontalLogo;

  useEffect(() => {
    const stickyheader = document.querySelector(".header");
    if (stickyheader) {
      setHeaderTop((stickyheader as HTMLElement).offsetTop);
    }
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScroll = () => {
    setScroll(window.scrollY);
  };
  

  return (
    <>
      <header className={`header ${classOption}`}>
        <nav
          className={`navbar navbar-expand-lg fixed-top custom-nav white-bg ${scroll > headerTop ? "affix" : ""}`}
        >
        <LangSwitcher/>
       
        <DarkToggleModeLight/>
          <div className="container">
            <Link to="/" className="navbar-brand">
              {typeof horizontalLogo === "string" ? (
                <img
                  src={horizontalLogo}
                  width="300"
                  alt="logo"
                  className="img-fluid"
                />
              ) : (
                horizontalLogo || (
                  <img
                    src="/assets/img/logo-color-1x.png"
                    width="120"
                    alt="logo"
                    className="img-fluid"
                  />
                )
              )}
            </Link>
            
            <button
              className="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="ti-menu"></span>
            </button>
            <div
              className="collapse navbar-collapse main-menu"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <Link
                    to="/"
                    className="nav-link"
                    href="#"
                    role="button"
                  >
                    Home
                  </Link>
                </li>
                {/*<li className="nav-item">
                  <HashLink className="nav-link" smooth to='#about'>
                    About
                  </HashLink>
                </li>
                <li className="nav-item">
                  <HashLink className="nav-link" smooth to="#features">
                    Features
                  </HashLink>
                </li>
                <li className="nav-item">
                  <HashLink className="nav-link" smooth to="#pricing">
                    Pricing
                  </HashLink>
                </li>
                <li className="nav-item">
                  <HashLink className="nav-link" smooth to='#screenshots'>
                    Screenshots
                  </HashLink>
                </li>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link  dropdown-toggle"
                    href="#/"
                    id="navbarDropdownPage"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Pages
                  </a>
                  <div
                    className="dropdown-menu submenu"
                    aria-labelledby="navbarDropdownPage"
                  >
                    <Link className="dropdown-item" to="/login">
                      Login Page 1
                    </Link>
                    <Link className="dropdown-item" to="/login-two">
                      Login Page 2
                    </Link>
                    <Link className="dropdown-item" to="/basic-signup">
                      Signup Page 1
                    </Link>
                    <Link className="dropdown-item" to="/signup-two">
                      Signup Page 2
                    </Link>
                    <Link className="dropdown-item" to="/reset-password">
                      Password Reset
                    </Link>
                    <Link className="dropdown-item" to="/change-password">
                      Change Password
                    </Link>
                    <Link className="dropdown-item" to="/download">
                      Download Page
                    </Link>
                    <Link className="dropdown-item" to="/review">
                      Review Page
                    </Link>
                    <Link className="dropdown-item" to="/faq">
                      FAQ Page
                    </Link>
                    <Link to="*" className="dropdown-item">
                      404 Page
                    </Link>
                    <Link className="dropdown-item" to="/coming-soon">
                      Coming Soon
                    </Link>
                    <Link className="dropdown-item" to="/thank-you">
                      Thank You
                    </Link>
                    <Link className="dropdown-item" to="/our-team">
                      Team Page
                      <span className="badge badge-danger badge-pill ml-2">
                        New
                      </span>
                    </Link>
                    <Link className="dropdown-item" to="/team-details">
                      Team Single
                      <span className="badge badge-danger badge-pill ml-2">
                        New
                      </span>
                    </Link>
                  </div>
                </li>
                <li className="nav-item dropdown">
                  <Link
                    className="nav-link  dropdown-toggle"
                    to="/"
                    id="navbarBlogPage"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Blog
                    <span className="custom-nav-badge badge badge-danger badge-pill">
                      New
                    </span>
                  </Link>

                  <div
                    className="dropdown-menu submenu"
                    aria-labelledby="navbarBlogPage"
                  >
                    <Link className="dropdown-item" to="/blog-grid">
                      Blog Grid
                    </Link>
                    <Link className="dropdown-item" to="/blog-sidebar">
                      Blog Left Sidebar
                    </Link>
                    <Link className="dropdown-item" to="/blog-details">
                      Details Right Sidebar
                    </Link>
                  </div>
                </li>
                <li className="nav-item">
                  <HashLink className="nav-link" smooth to="#team">
                    Team
                  </HashLink>
                </li>
                <li className="nav-item">
                  <HashLink className="nav-link" smooth to="#contact">
                    Contact
                  </HashLink>
                </li>*/}
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
