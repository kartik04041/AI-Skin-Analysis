import React from "react";

export default function Navbar({ isLoggedIn, onOpenAuth, onOpenHistory, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-logo">✨</span>
        <span className="brand-name">AI Skincare</span>
      </div>

      <ul className="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#analyzer">Skin Analysis</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#ai-model">AI Model</a></li>
        <li><a href="#reviews">Reviews</a></li>
      </ul>

      <div className="nav-auth">
        {isLoggedIn ? (
          <>
            <button className="nav-btn ghost-btn" onClick={onOpenHistory}>
              📋 History
            </button>
            <button className="nav-btn logout-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="nav-btn ghost-btn" onClick={() => onOpenAuth("login")}>
              Login
            </button>
            <button className="nav-btn primary-btn" onClick={() => onOpenAuth("signup")}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}