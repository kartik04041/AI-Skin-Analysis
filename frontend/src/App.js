import React, { useState } from "react";
import AnalyzerWorkspace from "./components/AnalyzerWorkspace";
import AuthModal from "./components/AuthModal";
import AccountModal from "./components/AccountModal";
import "./App.css";

export default function App() {
  const [authModal, setAuthModal] = useState(null); // null, "login", or "signup"
  const [user, setUser] = useState(null); // { name: string, email: string }
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [userData, setUserData] = useState({
    gender: "Female",
    age: "18-24",
    concern: "Acne & Breakouts",
    lighting: "Natural Daylight",
  });

  const [capturedImages, setCapturedImages] = useState({
    front: null,
    left: null,
    right: null,
  });

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // DYNAMIC HOMEPAGE REVIEWS STATE
  const [reviews, setReviews] = useState([
    {
      id: 1,
      user: "Sophia R.",
      text: "The baby pink layout is so cute and clean! The 3-angle scan caught dry areas on my cheeks instantly.",
      rating: 5,
      date: "2 days ago",
    },
    {
      id: 2,
      user: "Emma T.",
      text: "Loved the clear recommendations and custom routine breakdown. Super helpful for daily skincare!",
      rating: 5,
      date: "1 week ago",
    },
  ]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setAuthModal(null);
  };

  const handleUserDataChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImagesUpdated = (images) => {
    setCapturedImages(images);
    setAnalysis(null);
    setError(null);
  };

  // ADD NEW REVIEW FROM ACCOUNT MODAL TO HOME PAGE
  const handleAddReview = (newReview) => {
    const formattedReview = {
      id: Date.now(),
      user: newReview.user || user?.name || "Anonymous",
      text: newReview.text,
      rating: newReview.rating || 5,
      date: "Just now",
    };
    setReviews((prev) => [formattedReview, ...prev]);
  };

  // SCAN GUARD: BLOCK SCANNING WITHOUT LOGIN
  const handleAnalyze = async () => {
    if (!user) {
      setError("🔐 Account Required: Please log in or create an account to start skin scanning.");
      setAuthModal("login");
      return;
    }

    const hasAtLeastOne =
      capturedImages.front || capturedImages.left || capturedImages.right;

    if (!hasAtLeastOne) {
      setError("Please capture or upload at least 1 facial angle.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (capturedImages.front) formData.append("front", capturedImages.front);
    if (capturedImages.left) formData.append("left", capturedImages.left);
    if (capturedImages.right) formData.append("right", capturedImages.right);

    formData.append("gender", userData.gender);
    formData.append("age", userData.age);
    formData.append("concern", userData.concern);
    formData.append("lighting", userData.lighting);

    try {
      const response = await fetch("http://127.0.0.1:5001/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Analysis failed.");
      }

      setAnalysis(data);

      const historyEntry = {
        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: data.prediction,
        confidence: `${(data.confidence * 100).toFixed(1)}%`,
        concern: userData.concern,
        climate: "Moderate",
        water: "2-3L Water/day",
      };
      setHistory((prev) => [historyEntry, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to reach backend AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">🌸 GlowAI Diagnostics</div>

        <ul className="nav-links">
          <li><a href="#hero">Home</a></li>
          <li><a href="#workspace">Analyzer</a></li>
          <li><a href="#model-used">Model Tech</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#reviews">Reviews</a></li>
        </ul>

        <div className="nav-auth">
          {user ? (
            <div className="user-profile-badge">
              <button className="profile-btn" onClick={() => setIsAccountOpen(true)}>
                👤 {user.name || "My Account"}
              </button>
              <button className="logout-btn" onClick={() => setUser(null)}>
                Logout
              </button>
            </div>
          ) : (
            <button className="pink-login-btn" onClick={() => setAuthModal("login")}>
              ✨ Login / Signup
            </button>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <header id="hero" className="hero-section">
        <span className="hero-badge">✨ Baby Pink Skincare AI</span>
        <h1>Personalized Clinical Glow & Diagnostics</h1>
        <p>Analyze skin barrier, capture multi-angle scans, and receive custom routines.</p>
      </header>

      {/* WORKSPACE SECTION */}
      <section id="workspace" className="workspace-section">
        {!user && (
          <div className="auth-prompt-banner">
            🔒 <strong>Account Required:</strong> You must{" "}
            <span onClick={() => setAuthModal("login")}>Sign In</span> or{" "}
            <span onClick={() => setAuthModal("signup")}>Create an Account</span> to unlock skin scanning & save diagnostic history.
          </div>
        )}

        <AnalyzerWorkspace
          userData={userData}
          onUserDataChange={handleUserDataChange}
          onImagesUpdated={handleImagesUpdated}
          onAnalyze={handleAnalyze}
          loading={loading}
          analysis={analysis}
          error={error}
          isLoggedIn={!!user}
          onOpenAuth={() => setAuthModal("login")}
        />
      </section>

      {/* MODEL ARCHITECTURE SECTION */}
      <section id="model-used" className="section-block model-section">
        <h2>💖 Model Used & AI Engine</h2>
        <div className="model-details-grid">
          <div className="pink-card">
            <h4>Deep Convolutional Neural Network</h4>
            <p>Trained on high-resolution dermatological datasets using transfer learning to detect skin micro-textures.</p>
          </div>
          <div className="pink-card">
            <h4>Multi-View Vector Averaging</h4>
            <p>Aggregates soft probabilities across Front, Left, and Right scans to balance localized highlights and shadows.</p>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="section-block about-section">
        <h2>🌷 About Us</h2>
        <div className="pink-card">
          <p>At <strong>GlowAI Diagnostics</strong>, we combine intelligent computer vision with soft aesthetic skincare guidance to make skin diagnostic analysis effortles and accessible.</p>
        </div>
      </section>

      {/* DYNAMIC REVIEWS SECTION */}
      <section id="reviews" className="section-block reviews-section">
        <h2>⭐ Glowing User Reviews ({reviews.length})</h2>
        <div className="reviews-grid">
          {reviews.map((rev) => (
            <div key={rev.id} className="pink-card review-card">
              <div className="stars-row">
                {"⭐".repeat(rev.rating)}
              </div>
              <p>"{rev.text}"</p>
              <div className="review-meta">
                <h4>— {rev.user}</h4>
                <small>{rev.date}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AUTH MODAL */}
      {authModal && (
        <AuthModal
          authModal={authModal}
          setAuthModal={setAuthModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* USER ACCOUNT MODAL */}
      {isAccountOpen && user && (
        <AccountModal
          user={user}
          history={history}
          onClose={() => setIsAccountOpen(false)}
          onAddReview={handleAddReview}
        />
      )}

      <footer className="app-footer">
        <p>🎀 AI Skincare Analysis & Recommedation system  © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}