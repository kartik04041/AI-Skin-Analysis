
import React from "react";

export default function Navbar({
  isLoggedIn = false,
  user = null,
  cartCount = 0,
  onOpenAuth = () => {},
  onOpenAccount = () => {},
  onLogout = () => {},
}) {
  const goToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const goToShop = (type) => {
    // Scroll to the Shop.jsx section
    goToSection("shop");

    // Tell Shop.jsx which tab to display
    window.dispatchEvent(
      new CustomEvent("skin-shop-action", {
        detail: { type },
      })
    );
  };

  return (
    <nav className="navbar">
      <a
        href="#hero"
        className="nav-logo"
        onClick={(e) => {
          e.preventDefault();
          goToSection("hero");
        }}
      >
        ✨ AI Skincare
      </a>

      <ul className="nav-links">
        <li>
          <a href="#hero">Home</a>
        </li>

        <li>
          <a href="#workspace">Analyzer</a>
        </li>

        <li>
          <a href="#model-used">AI Model</a>
        </li>

        <li>
          <button
            type="button"
            onClick={() => goToShop("shop")}
          >
            Shop
          </button>
        </li>

        <li>
          <a href="#about">About</a>
        </li>

        <li>
          <a href="#reviews">Reviews</a>
        </li>

        <li>
          <button
            type="button"
            onClick={() => goToShop("cart")}
          >
            🛒 Cart ({cartCount})
          </button>
        </li>
      </ul>

      <div className="nav-auth">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={onOpenAccount}
            >
              👤 {user?.name || user?.username || "My Account"}
            </button>

            <button
              type="button"
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onOpenAuth("login")}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth("signup")}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
