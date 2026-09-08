import React, { useState, useEffect } from "react";
import AnalyzerWorkspace from "./components/AnalyzerWorkspace";
import AuthModal from "./components/AuthModal";
import AccountModal from "./components/AccountModal";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:5001";

export default function App() {
  const [authModal, setAuthModal] = useState(null); // null, "login", or "signup"
  
  // PERSISTENT USER LOGIN DETAILS & JWT TOKEN WITH STRICT VALIDATION
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("glow_user");
    return savedUser && savedUser !== "undefined" && savedUser !== "null"
      ? JSON.parse(savedUser)
      : null;
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("glow_token");
    return savedToken && savedToken !== "null" && savedToken !== "undefined"
      ? savedToken
      : null;
  });

  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // USER SKIN PROFILE DATA DETAILS
  const [userData, setUserData] = useState({
    gender: "Female",
    age: "18-24",
    sleep: "7-9 hours",
    concern: "Acne & Breakouts",
    secondaryConcern: "Enlarged Pores",
    sensitivity: "Slightly Sensitive",
    waterIntake: "2L-3L",
    climate: "Moderate",
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
  
  // MONGODB PERSISTENT STATES
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);

  // FETCH REVIEWS & USER TEST HISTORY FROM MONGODB
  useEffect(() => {
    fetchReviews();
    if (token && token !== "null" && token !== "undefined") {
      fetchHistory(token);
    }
  }, [token]);

  // GET ALL COMMUNITY REVIEWS FROM MONGODB
  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Error fetching reviews from MongoDB:", err);
    }
  };

  // GET PREVIOUS TEST RESULTS FROM MONGODB
  const fetchHistory = async (authToken) => {
    if (!authToken || authToken === "null" || authToken === "undefined") return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.history);
      } else if (response.status === 401) {
        // Expired or invalid token: clean up session
        handleLogout();
      }
    } catch (err) {
      console.error("Error fetching history from MongoDB:", err);
    }
  };

  // STORE LOGIN DETAILS & TOKEN ON SUCCESS
  const handleAuthSuccess = (authData) => {
    setUser(authData.user);
    setToken(authData.token);
    localStorage.setItem("glow_user", JSON.stringify(authData.user));
    localStorage.setItem("glow_token", authData.token);
    setAuthModal(null);
    fetchHistory(authData.token);
  };

  // CLEAR LOGIN DETAILS & SESSION
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setHistory([]);
    setAnalysis(null);
    localStorage.removeItem("glow_user");
    localStorage.removeItem("glow_token");
  };

  const handleUserDataChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImagesUpdated = (images) => {
    setCapturedImages(images);
    setAnalysis(null);
    setError(null);
  };

  // POST NEW USER REVIEW TO MONGODB
  const handleAddReview = async (newReview) => {
    if (!token) {
      alert("Please log in to submit a review.");
      setAuthModal("login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newReview.text,
          rating: newReview.rating || 5,
          user: user?.name || "Anonymous",
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        alert("Session expired. Please log in again.");
        setAuthModal("login");
        return;
      }

      if (data.success) {
        setReviews((prev) => [data.review, ...prev]);
      } else {
        alert(data.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  // RUN SKIN SCAN AND SAVE TEST RESULT TO MONGODB
  const handleAnalyze = async () => {
    if (!token) {
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

    // Send full user profile details to backend
    formData.append("gender", userData.gender);
    formData.append("age", userData.age);
    formData.append("sleep", userData.sleep);
    formData.append("concern", userData.concern);
    formData.append("secondaryConcern", userData.secondaryConcern);
    formData.append("sensitivity", userData.sensitivity);
    formData.append("waterIntake", userData.waterIntake);
    formData.append("climate", userData.climate);
    formData.append("lighting", userData.lighting);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Links test result to current user
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        setError("Session expired. Please log in again.");
        setAuthModal("login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Analysis failed.");
      }

      setAnalysis(data);
      fetchHistory(token); // Reload test results history from MongoDB
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
        <div className="nav-logo">🌸 AI Skin Analysis & Recommendation System</div>

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
                👤 {user.name}
              </button>
              <button className="logout-btn" onClick={handleLogout}>
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
        <span className="hero-badge">✨ AI skin Analyst</span>
        <h1>Personalized Clinical AI & Diagnostics</h1>
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
          <p>At <strong>GlowAI Diagnostics</strong>, we combine intelligent computer vision with soft aesthetic skincare guidance to make skin diagnostic analysis effortless and accessible.</p>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="reviews" className="section-block reviews-section">
        <h2>⭐ Glowing User Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="no-reviews-text">No reviews stored yet. Be the first to post!</p>
        ) : (
          <div className="reviews-grid">
            {reviews.map((rev, idx) => (
              <div key={idx} className="pink-card review-card">
                <div className="stars-row">
                  {"⭐".repeat(rev.rating || 5)}
                </div>
                <p>"{rev.text}"</p>
                <div className="review-meta">
                  <h4>— {rev.user}</h4>
                  <small>{rev.date || "Verified User"}</small>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* USER ACCOUNT MODAL (SHOWS USER INFO & PREVIOUS TEST HISTORY) */}
      {isAccountOpen && user && (
        <AccountModal
          user={user}
          history={history}
          userData={userData}
          onClose={() => setIsAccountOpen(false)}
          onAddReview={handleAddReview}
        />
      )}

      <footer className="app-footer">
        <p>🎀 AI Skincare Analysis & Recommendation system © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}