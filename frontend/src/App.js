import React, { useState, useEffect } from "react";

import AnalyzerWorkspace from "./components/AnalyzerWorkspace";
import AuthModal from "./components/AuthModal";
import AccountModal from "./components/AccountModal";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";

import "./App.css";

const API_BASE_URL = "http://localhost:5000";

export default function App() {
  const [authModal, setAuthModal] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("glow_user");

      if (
        savedUser &&
        savedUser !== "undefined" &&
        savedUser !== "null"
      ) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error("User loading error:", error);
      localStorage.removeItem("glow_user");
    }

    return null;
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("glow_token");

    if (
      savedToken &&
      savedToken !== "null" &&
      savedToken !== "undefined"
    ) {
      return savedToken;
    }

    return null;
  });

  const [isAccountOpen, setIsAccountOpen] = useState(false);

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
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);

  // =========================================================
  // ADMIN CHECK
  // =========================================================

  const isAdmin =
    user?.isAdmin === true ||
    user?.role === "admin" ||
    localStorage.getItem("isAdmin") === "true";

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setHistory([]);
    setAnalysis(null);
    setError(null);
    setIsAccountOpen(false);
    setAuthModal(null);

    setCapturedImages({
      front: null,
      left: null,
      right: null,
    });

    localStorage.removeItem("glow_user");
    localStorage.removeItem("glow_token");
    localStorage.removeItem("isAdmin");
  };

  // =========================================================
  // AUTH SUCCESS
  // =========================================================

  const handleAuthSuccess = (loggedInUser, authToken) => {
    console.log("=================================");
    console.log("AUTH SUCCESS");
    console.log("USER:", loggedInUser);
    console.log("ADMIN:", loggedInUser?.isAdmin);
    console.log("ROLE:", loggedInUser?.role);
    console.log("=================================");

    if (loggedInUser) {
      setUser(loggedInUser);

      localStorage.setItem(
        "glow_user",
        JSON.stringify(loggedInUser)
      );

      const adminUser =
        loggedInUser.isAdmin === true ||
        loggedInUser.role === "admin";

      localStorage.setItem(
        "isAdmin",
        adminUser ? "true" : "false"
      );
    }

    if (authToken) {
      setToken(authToken);
      localStorage.setItem(
        "glow_token",
        authToken
      );
    }

    setAuthModal(null);
    setError(null);
  };

  // =========================================================
  // FETCH REVIEWS
  // =========================================================

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reviews`
      );

      if (!response.ok) {
        console.warn(
          "Reviews request failed:",
          response.status
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error(
        "Reviews error:",
        err
      );
    }
  };

  // =========================================================
  // FETCH USER HISTORY
  // IMPORTANT:
  // ADMIN MUST NOT CALL THIS ROUTE
  // =========================================================

  const fetchHistory = async (authToken) => {
    if (isAdmin) {
      console.log(
        "Admin detected - skipping user history request."
      );
      return;
    }

    if (
      !authToken ||
      authToken === "null" ||
      authToken === "undefined"
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/history`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.history || []);
      } else if (response.status === 401) {
        console.warn(
          "User session expired."
        );

        handleLogout();
      }
    } catch (err) {
      console.error(
        "History error:",
        err
      );
    }
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchReviews();

    // NEVER fetch history for admin
    if (token && !isAdmin) {
      fetchHistory(token);
    }
  }, [token, isAdmin]);

  // =========================================================
  // USER DATA
  // =========================================================

  const handleUserDataChange = (
    field,
    value
  ) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // IMAGE UPDATE
  // =========================================================

  const handleImagesUpdated = (
    images
  ) => {
    setCapturedImages(images);
    setAnalysis(null);
    setError(null);
  };

  // =========================================================
  // ADD REVIEW
  // =========================================================

  const handleAddReview = async (
    newReview
  ) => {
    if (!token) {
      alert(
        "Please login to submit a review."
      );
      setAuthModal("login");
      return;
    }

    // Admin should not submit normal user reviews
    if (isAdmin) {
      alert(
        "Admin accounts cannot submit user reviews."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: newReview.text,
            rating:
              newReview.rating || 5,
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        handleLogout();
        setAuthModal("login");

        alert(
          "Session expired. Please login again."
        );

        return;
      }

      if (data.success) {
        setReviews((prev) => [
          data.review || newReview,
          ...prev,
        ]);

        fetchReviews();
      } else {
        alert(
          data.message ||
            "Failed to submit review."
        );
      }
    } catch (err) {
      console.error(
        "Review submission error:",
        err
      );

      alert(
        "Unable to submit review."
      );
    }
  };

  // =========================================================
  // ANALYZE SKIN
  // =========================================================

  const handleAnalyze = async () => {
    if (!token) {
      setError(
        "Please login or create an account before scanning."
      );

      setAuthModal("login");
      return;
    }

    if (isAdmin) {
      setError(
        "Admin accounts are for dashboard management only."
      );
      return;
    }

    const hasImage =
      capturedImages.front ||
      capturedImages.left ||
      capturedImages.right;

    if (!hasImage) {
      setError(
        "Please capture or upload at least one facial angle."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const formData =
      new FormData();

    if (capturedImages.front) {
      formData.append(
        "front",
        capturedImages.front
      );
    }

    if (capturedImages.left) {
      formData.append(
        "left",
        capturedImages.left
      );
    }

    if (capturedImages.right) {
      formData.append(
        "right",
        capturedImages.right
      );
    }

    Object.entries(userData).forEach(
      ([key, value]) => {
        formData.append(
          key,
          value
        );
      }
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        handleLogout();

        setError(
          "Session expired. Please login again."
        );

        setAuthModal("login");
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Analysis failed."
        );
      }

      setAnalysis(
        data.analysis || data
      );

      fetchHistory(token);
    } catch (err) {
      console.error(
        "Analysis error:",
        err
      );

      setError(
        err.message ||
          "Failed to reach AI service."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  if (isAdmin && user) {
    return (
      <AdminDashboard
        user={user}
        token={token}
        reviews={reviews}
        onRefreshReviews={
          fetchReviews
        }
        onLogout={handleLogout}
        API_BASE_URL={
          API_BASE_URL
        }
      />
    );
  }

  // =========================================================
  // NORMAL USER WEBSITE
  // =========================================================

  return (
    <div className="app-container">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="nav-logo">
          AI Skin Analysis &
          Recommendation System
        </div>

        <ul className="nav-links">

          <li>
            <a href="#hero">
              Home
            </a>
          </li>

          <li>
            <a href="#workspace">
              Analyzer
            </a>
          </li>

          <li>
            <a href="#model-used">
              Model Tech
            </a>
          </li>

          <li>
            <a href="#about">
              About Us
            </a>
          </li>

          <li>
            <a href="#reviews">
              Reviews
            </a>
          </li>

        </ul>

        <div className="nav-auth">

          {user ? (
            <div className="user-profile-badge">

              <button
                className="profile-btn"
                onClick={() =>
                  setIsAccountOpen(true)
                }
              >
                👤{" "}
                {user.name ||
                  user.username ||
                  "User"}
              </button>

              <button
                className="logout-btn"
                onClick={
                  handleLogout
                }
              >
                Logout
              </button>

            </div>
          ) : (
            <button
              className="pink-login-btn"
              onClick={() =>
                setAuthModal("login")
              }
            >
              Login / Signup
            </button>
          )}

        </div>

      </nav>

      {/* HERO */}

      <header
        id="hero"
        className="hero-section"
      >
        <span className="hero-badge">
          AI Skin Analyst
        </span>

        <h1>
          Personalized Skin Analysis
        </h1>

        <p>
          Analyze skin features,
          capture multi-angle scans,
          and receive personalized
          skincare guidance.
        </p>
      </header>

      {/* WORKSPACE */}

      <section
        id="workspace"
        className="workspace-section"
      >

        {!user && (
          <div className="auth-prompt-banner">

            🔒{" "}

            <strong>
              Account Required:
            </strong>{" "}

            You must{" "}

            <span
              onClick={() =>
                setAuthModal("login")
              }
            >
              Sign In
            </span>{" "}

            or{" "}

            <span
              onClick={() =>
                setAuthModal("signup")
              }
            >
              Create an Account
            </span>{" "}

            to unlock skin scanning.

          </div>
        )}

        <AnalyzerWorkspace
          userData={userData}
          onUserDataChange={
            handleUserDataChange
          }
          onImagesUpdated={
            handleImagesUpdated
          }
          onAnalyze={
            handleAnalyze
          }
          loading={loading}
          analysis={analysis}
          error={error}
          isLoggedIn={!!token}
          onOpenAuth={() =>
            setAuthModal("login")
          }
        />

      </section>

      {/* MODEL */}

      <section
        id="model-used"
        className="section-block model-section"
      >

        <h2>
          Model Used & AI Engine
        </h2>

        <div className="model-details-grid">

          <div className="pink-card">

            <h4>
              Deep Convolutional Neural Network
            </h4>

            <p>
              The system uses computer
              vision and deep learning
              techniques to analyze
              uploaded skin images and
              identify visible skin
              features.
            </p>

          </div>

          <div className="pink-card">

            <h4>
              Multi-View Vector Averaging
            </h4>

            <p>
              Predictions from Front,
              Left and Right scans can
              be combined to provide
              consolidated analysis.
            </p>

          </div>

        </div>

      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="section-block about-section"
      >

        <h2>
          About Us
        </h2>

        <div className="pink-card">

          <p>
            At{" "}
            <strong>
              AI Skin Analysis System
            </strong>
            , we combine computer
            vision, artificial
            intelligence and skincare
            guidance.
          </p>

        </div>

      </section>

      {/* REVIEWS */}

      <section
        id="reviews"
        className="section-block reviews-section"
      >

        <h2>
          User Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="no-reviews-text">
            No reviews stored yet.
          </p>
        ) : (
          <div className="reviews-grid">

            {reviews.map(
              (rev, idx) => (
                <div
                  key={
                    rev._id || idx
                  }
                  className="pink-card review-card"
                >

                  <div className="stars-row">
                    {"⭐".repeat(
                      Math.min(
                        Math.max(
                          Number(
                            rev.rating || 5
                          ),
                          1
                        ),
                        5
                      )
                    )}
                  </div>

                  <p>
                    "{rev.text}"
                  </p>

                  <div className="review-meta">

                    <h4>
                      —{" "}
                      {rev.user ||
                        rev.name ||
                        "Verified User"}
                    </h4>

                    <small>
                      {rev.date ||
                        "Verified User"}
                    </small>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

      {/* AUTH MODAL */}

      {authModal && (
        <AuthModal
          authModal={
            authModal
          }
          setAuthModal={
            setAuthModal
          }
          onClose={() =>
            setAuthModal(null)
          }
          onAuthSuccess={
            handleAuthSuccess
          }
        />
      )}

      {/* ACCOUNT MODAL */}

      {isAccountOpen &&
        user && (
          <AccountModal
            user={user}
            history={history}
            userData={userData}
            onClose={() =>
              setIsAccountOpen(false)
            }
            onAddReview={
              handleAddReview
            }
          />
        )}

      {/* FOOTER */}

      <footer className="app-footer">

        <p>
          AI Skincare Analysis &
          Recommendation System ©{" "}
          {new Date().getFullYear()}
        </p>

      </footer>

    </div>
  );
}