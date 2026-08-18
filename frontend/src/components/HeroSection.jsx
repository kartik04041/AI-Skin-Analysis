import React from "react";

export default function HeroSection({ onAnalyzeClick }) {
  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <span className="hero-badge">AI-Powered Dermatological Assistant</span>
        <h1>AI SKINCARE ASSISTANT</h1>
        <p>Instant precision skin profile analysis & clinical ingredient recommendations</p>
        <button className="cta-button" onClick={onAnalyzeClick}>
          🔍 Analyze My Skin
        </button>
      </div>
    </section>
  );
}