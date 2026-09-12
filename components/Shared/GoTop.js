import React, { useEffect, useState } from "react";

const GoTop = () => {
  // The back-to-top button is hidden at the beginning
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowButton(window.scrollY > 150);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    // The button unmounts at the top; hand focus to the start of the page so
    // keyboard users are not dropped on <body>.
    const firstLink = document.querySelector("#navbar a");
    if (firstLink) firstLink.focus({ preventScroll: true });
  };

  if (!showButton) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="go-top"
      aria-label="Till toppen av sidan"
    >
      <i className="fas fa-chevron-up" aria-hidden="true"></i>
      <i className="fas fa-chevron-up" aria-hidden="true"></i>
    </button>
  );
};

export default GoTop;
