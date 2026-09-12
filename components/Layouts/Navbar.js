import React from "react";
import Link from "next/link";

// One list drives both the desktop dropdowns and the collapsed (mobile) menu,
// so labels only live here.
const MENU = [
  { label: "Om oss", href: "/about-us" },
  {
    id: "privata",
    label: "Privata tjänster",
    href: "/private-services",
    children: [
      { label: "Hemstädning", href: "/homecleaning" },
      { label: "Flyttstädning", href: "/movecleaning" },
      { label: "Storstädning", href: "/deepcleaning" },
      { label: "Fönsterputsning", href: "/windowcleaning" },
      { label: "Trädgårdsskötsel", href: "/gardening" },
    ],
  },
  {
    id: "foretag",
    label: "Företag och BRF",
    href: "/services",
    children: [
      { label: "Kontorsstädning", href: "/officecleaning" },
      { label: "Bod- och Etableringstädning", href: "/containercleaning" },
      { label: "Fönsterputsning", href: "/windowcleaningbusiness" },
      { label: "Trappstädning", href: "/staircleaning" },
      { label: "Flyttstädning", href: "/movecleaningbusiness" },
      { label: "Golvvård", href: "/floorcare" },
    ],
  },
  {
    // No landing page: the label itself is the submenu button.
    id: "andra",
    label: "Andra tjänster",
    children: [
      { label: "Byggtjänster", href: "/construction" },
      { label: "Snöröjning och plogning", href: "/snowremoval" },
      { label: "Flytthjälp", href: "/movinghelp" },
      { label: "Mattvätt", href: "/carpetwashing" },
    ],
  },
  { label: "Produkter", href: "https://yureco.com", external: true },
  { label: "Jobba hos oss", href: "/careers" },
  { label: "Kontakta oss", href: "/contact" },
];

// Same breakpoint as navbar-expand-xl and the collapsed-menu rules in
// responsive.css.
const DESKTOP_QUERY = "(min-width: 1200px)";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [openSubmenu, setOpenSubmenu] = React.useState(null);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const togglerRef = React.useRef(null);

  // Every page mounts its own Navbar, so the listener must be removed on
  // unmount or they pile up with each client-side navigation.
  React.useEffect(() => {
    const element = document.getElementById("navbar");
    const onScroll = () => {
      element.classList.toggle("is-sticky", window.scrollY > 170);
    };
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const sync = () => {
      setIsDesktop(query.matches);
      setOpenSubmenu(null);
      if (query.matches) setMenuOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const closeSubmenu = (id) =>
    setOpenSubmenu((current) => (current === id ? null : current));

  const toggleSubmenu = (id, event) => {
    // On desktop, hover has already opened the submenu under the pointer, so
    // a mouse click must not close it again. Keyboard activation (detail 0)
    // and taps on the collapsed menu toggle.
    if (isDesktop && event.detail > 0) {
      setOpenSubmenu(id);
      return;
    }
    setOpenSubmenu((current) => (current === id ? null : id));
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Escape") return;
    if (openSubmenu) {
      const trigger = document.getElementById(`submenu-toggle-${openSubmenu}`);
      setOpenSubmenu(null);
      if (trigger) trigger.focus();
    } else if (menuOpen) {
      setMenuOpen(false);
      if (togglerRef.current) togglerRef.current.focus();
    }
  };

  const renderLink = (item) =>
    item.external ? (
      <a
        href={item.href}
        className="nav-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.label}
      </a>
    ) : (
      <Link href={item.href} className="nav-link">
        {item.label}
      </Link>
    );

  const renderSubmenu = (item) => {
    const open = openSubmenu === item.id;
    const listId = `submenu-${item.id}`;
    const toggleId = `submenu-toggle-${item.id}`;

    return (
      <li
        key={item.id}
        className={`nav-item submenu${open ? " is-open" : ""}`}
        onMouseEnter={() => {
          if (isDesktop) setOpenSubmenu(item.id);
        }}
        onMouseLeave={(event) => {
          if (isDesktop && !event.currentTarget.contains(document.activeElement)) {
            closeSubmenu(item.id);
          }
        }}
        onFocus={(event) => {
          // Only when focus arrives from outside, so Escape (which moves focus
          // back to the trigger) does not reopen it.
          if (isDesktop && !event.currentTarget.contains(event.relatedTarget)) {
            setOpenSubmenu(item.id);
          }
        }}
        onBlur={(event) => {
          if (isDesktop && !event.currentTarget.contains(event.relatedTarget)) {
            closeSubmenu(item.id);
          }
        }}
      >
        {item.href ? (
          <>
            {renderLink(item)}
            <button
              type="button"
              id={toggleId}
              className="submenu-toggle"
              aria-expanded={open}
              aria-controls={listId}
              aria-label={`Undermeny för ${item.label}`}
              onClick={(event) => toggleSubmenu(item.id, event)}
            >
              <i className="fas fa-chevron-down" aria-hidden="true"></i>
            </button>
          </>
        ) : (
          <button
            type="button"
            id={toggleId}
            className="nav-link submenu-button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={(event) => toggleSubmenu(item.id, event)}
          >
            {item.label}
            <i className="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
        )}

        <ul id={listId} className="dropdown-menu">
          {item.children.map((child) => (
            <li key={child.href}>
              <Link href={child.href} className="dropdown-item">
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  return (
    <>
      <div id="navbar" className="navbar-area" onKeyDown={handleKeyDown}>
        <div className="main-nav">
          <div className="container">
            <nav
              className="navbar navbar-expand-xl navbar-light"
              aria-label="Huvudmeny"
            >
              <Link href="/" className="navbar-brand">
                <img
                  src="/images/logo.png"
                  className="white-logo"
                  alt="Aurel Städ AB – till startsidan"
                  loading="lazy"
                />
                <img
                  src="/images/logo-white.png"
                  className="black-logo"
                  alt="Aurel Städ AB – till startsidan"
                  loading="lazy"
                />
              </Link>

              <button
                ref={togglerRef}
                onClick={() => setMenuOpen((open) => !open)}
                className={`navbar-toggler navbar-toggler-right${menuOpen ? "" : " collapsed"}`}
                type="button"
                aria-controls="navbarSupportedContent"
                aria-expanded={menuOpen}
                aria-label="Meny"
              >
                <span className="icon-bar top-bar"></span>
                <span className="icon-bar middle-bar"></span>
                <span className="icon-bar bottom-bar"></span>
              </button>

              <div
                className={`collapse navbar-collapse${menuOpen ? " show" : ""}`}
                id="navbarSupportedContent"
              >
                <ul className="navbar-nav m-auto">
                  {MENU.map((item) =>
                    item.children ? (
                      renderSubmenu(item)
                    ) : (
                      <li className="nav-item" key={item.label}>
                        {renderLink(item)}
                      </li>
                    )
                  )}
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
