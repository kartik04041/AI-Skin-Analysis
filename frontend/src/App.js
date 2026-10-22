import React, { useState, useEffect } from "react";

import AnalyzerWorkspace from "./components/AnalyzerWorkspace";
import AuthModal from "./components/AuthModal";
import AccountModal from "./components/AccountModal";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import Shop from "./components/Shop";

import "./App.css";

const API_BASE_URL = "http://localhost:5000";
const normalizeAuthToken = (value) => {
  if (!value) return "";

  let result = value;

  // Handle a JSON-stringified token or object.
  if (typeof result === "string") {
    result = result.trim();

    try {
      const parsed = JSON.parse(result);

      if (typeof parsed === "string") {
        result = parsed.trim();
      } else if (parsed && typeof parsed === "object") {
        result =
          parsed.token ||
          parsed.accessToken ||
          parsed.access_token ||
          parsed.jwt ||
          parsed.data?.token ||
          "";
      }
    } catch {
      // The value is an ordinary string.
    }
  }

  // Handle an auth response object.
  if (result && typeof result === "object") {
    result =
      result.token ||
      result.accessToken ||
      result.access_token ||
      result.jwt ||
      result.data?.token ||
      "";
  }

  if (typeof result !== "string") return "";

  result = result.trim().replace(/^Bearer\s+/i, "");

  // A JWT must contain three dot-separated sections.
  if (result.split(".").length !== 3) return "";

  return result;
};

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

  if (!savedToken) return null;

  const cleanToken = normalizeAuthToken(savedToken);

  if (!cleanToken) {
    localStorage.removeItem("glow_token");
    return null;
  }

  return cleanToken;
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
  // Support either a separate token argument or a token
  // included in the authentication response/user object.
  const cleanToken =
    normalizeAuthToken(authToken) ||
    normalizeAuthToken(loggedInUser?.token) ||
    normalizeAuthToken(loggedInUser?.accessToken) ||
    normalizeAuthToken(loggedInUser?.access_token) ||
    normalizeAuthToken(loggedInUser?.jwt) ||
    normalizeAuthToken(loggedInUser?.data?.token);

  if (!cleanToken) {
    console.error(
      "Authentication completed, but no valid JWT was received.",
      {
        hasUser: Boolean(loggedInUser),
        hasSeparateToken: Boolean(authToken),
      }
    );

    setError("Login did not return a valid session token. Please try logging in again.");
    localStorage.removeItem("glow_token");
    setToken(null);
    return;
  }

  if (loggedInUser) {
    setUser(loggedInUser);
    localStorage.setItem("glow_user", JSON.stringify(loggedInUser));

    const adminUser =
      loggedInUser.isAdmin === true ||
      loggedInUser.role === "admin";

    localStorage.setItem("isAdmin", adminUser ? "true" : "false");
  }

  localStorage.setItem("glow_token", cleanToken);
  setToken(cleanToken);
  setAuthModal(null);
  setError(null);
};

  // =========================================================
  // FETCH REVIEWS
  // =========================================================

 
  // =========================================================
  // FETCH REVIEWS — FIXED
  // =========================================================

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Reviews request failed: ${response.status}`
        );
      }

      // Support different common API response formats.
      const fetchedReviews = Array.isArray(data)
        ? data
        : Array.isArray(data.reviews)
          ? data.reviews
          : Array.isArray(data.data?.reviews)
            ? data.data.reviews
            : Array.isArray(data.data)
              ? data.data
              : [];

      setReviews(fetchedReviews);

      return fetchedReviews;
    } catch (err) {
      console.error("Reviews loading error:", err);
      return [];
    }
  };


  // =========================================================
  // FETCH USER HISTORY
  // =========================================================

  const fetchHistory = async (authToken) => {
    if (isAdmin) {
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
        handleLogout();
      }
    } catch (err) {
      console.error("History error:", err);
    }
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchReviews();

    if (token && !isAdmin) {
      fetchHistory(token);
    }
  }, [token, isAdmin]);

  // =========================================================
  // USER DATA
  // =========================================================

  const handleUserDataChange = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = JSON.parse(
          localStorage.getItem("skin_shop_cart") || "[]"
        );

        setCartCount(
          cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        );
      } catch {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("skin-cart-updated", updateCount);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("skin-cart-updated", updateCount);
    };
  }, []);

  // =========================================================
  // IMAGE UPDATE
  // =========================================================

  const handleImagesUpdated = (images) => {
    setCapturedImages(images);
    setAnalysis(null);
    setError(null);
  };

  // =========================================================
  // ADD REVIEW
  // =========================================================

  const handleAddReview = async (newReview) => {
    if (!token) {
      alert("Please login to submit a review.");
      setAuthModal("login");
      return;
    }

    if (isAdmin) {
      alert("Admin accounts cannot submit user reviews.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: newReview.text,
            rating: newReview.rating || 5,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        setAuthModal("login");
        alert("Session expired. Please login again.");
        return;
      }

      if (data.success) {
        setReviews((prev) => [
          data.review || newReview,
          ...prev,
        ]);
        fetchReviews();
      } else {
        alert(data.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      alert("Unable to submit review.");
    }
  };

  // =========================================================
  // ANALYZE SKIN
  // =========================================================

 
const handleAnalyze = async () => {
  // Read both React state and saved login data.
  const activeToken =
    normalizeAuthToken(token) ||
    normalizeAuthToken(localStorage.getItem("glow_token"));

  if (!activeToken) {
    setError("Please login again before starting skin analysis.");
    setAuthModal("login");
    return;
  }

  if (isAdmin) {
    setError("Admin accounts are for dashboard management only.");
    return;
  }

  const hasImage =
    capturedImages?.front ||
    capturedImages?.left ||
    capturedImages?.right;

  if (!hasImage) {
    setError("Please capture or upload at least one facial angle.");
    return;
  }

  setLoading(true);
  setError(null);
  setAnalysis(null);

  try {
    const formData = new FormData();

    if (capturedImages.front) {
      formData.append("front", capturedImages.front);
    }

    if (capturedImages.left) {
      formData.append("left", capturedImages.left);
    }

    if (capturedImages.right) {
      formData.append("right", capturedImages.right);
    }

    Object.entries(userData).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
      body: formData,
    });

    // Read as text first to handle JSON and plain-text errors.
    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText };
    }

    if (response.status === 401) {
      handleLogout();
      setError("Your login session has expired. Please login again.");
      setAuthModal("login");
      return;
    }

    if (response.status === 403) {
      throw new Error(
        data.message || "You do not have permission to analyze skin."
      );
    }

    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error(
        "The AI analysis service is unavailable. Check that your Node.js backend and Python AI service are running."
      );
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || `Analysis failed. Server returned ${response.status}.`
      );
    }

    const result = data.analysis || data.result || data;

    setAnalysis(result);

    // Refresh history with the same valid token.
    await fetchHistory(activeToken);
  } catch (err) {
    console.error("Analysis error:", err);
    setError(err.message || "Unable to complete skin analysis.");
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
        onRefreshReviews={fetchReviews}
        onLogout={handleLogout}
        API_BASE_URL={API_BASE_URL}
      />
    );
  }

  // =========================================================
  // NORMAL USER WEBSITE
  // =========================================================

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-logo">
          AI Skin Analysis & Recommendation System
        </div>

        
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
      onClick={() => {
        document.getElementById("shop")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        window.dispatchEvent(
          new CustomEvent("skin-shop-action", {
            detail: { type: "shop" },
          })
        );
      }}
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
      onClick={() => {
        document.getElementById("shop")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        window.dispatchEvent(
          new CustomEvent("skin-shop-action", {
            detail: { type: "cart" },
          })
        );
      }}
    >
      🛒 Cart ({cartCount})
    </button>
  </li>
</ul>


        <div className="nav-auth">
          {user ? (
            <div className="user-profile-badge">
              <button
                className="profile-btn"
                onClick={() => setIsAccountOpen(true)}
              >
                👤 {user.name || user.username || "User"}
              </button>

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              className="pink-login-btn"
              onClick={() => setAuthModal("login")}
            >
              Login / Signup
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <header id="hero" className="hero-section">
        <span className="hero-badge">AI Skin Analyst</span>
        <h1>Personalized Skin Analysis</h1>
        <p>
          Analyze skin features, capture multi-angle scans, and receive
          personalized skincare guidance.
        </p>
      </header>

      {/* WORKSPACE */}
      ```
  {/* WORKSPACE */}
  <section id="workspace" className="workspace-section">
    {!user && (
      <div className="auth-prompt-banner">
        🔒 <strong>Account Required:</strong> You must{" "}
        <span onClick={() => setAuthModal("login")}>Sign In</span> or{" "}
        <span onClick={() => setAuthModal("signup")}>
          Create an Account
        </span>{" "}
        to unlock skin scanning.
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
      isLoggedIn={!!token}
      onOpenAuth={(mode = "login") => setAuthModal(mode)}
    />

    <Shop
      onOpenAuth={(mode = "login") => setAuthModal(mode)}
    />
  </section>
```


      {/* MODEL */}
     <section id="model-used" className="section-block model-section">
  <h2>Model Used & AI Engine</h2>

  <div className="model-details-grid">
    <div className="pink-card">
      <h4>MobileNetV2 Architecture</h4>
      <p>
        The system uses MobileNetV2, a convolutional neural network (CNN)
        implemented with TensorFlow and Keras, to analyze facial images
        and generate skin-related predictions.
      </p>
    </div>

    <div className="pink-card">
      <h4>Transfer Learning</h4>
      <p>
        MobileNetV2 uses pretrained weights as the foundation for the
        image-classification model, which is trained to recognize the
        classes represented in the project dataset.
      </p>
    </div>

    <div className="pink-card">
      <h4>Image Preprocessing</h4>
      <p>
        Uploaded images are converted to RGB and resized to 224 × 224 pixels.
        MobileNetV2 preprocessing prepares the image data for model inference.
      </p>
    </div>

    <div className="pink-card">
      <h4>Softmax Classification</h4>
      <p>
        The model produces class probabilities. The class with the highest
        predicted probability is selected as the model's prediction, and
        its probability is returned as the confidence score.
      </p>
    </div>

    <div className="pink-card">
      <h4>Multi-View Probability Averaging</h4>
      <p>
        Predictions from the available Front, Left, and Right facial images
        are combined by averaging their class probabilities to produce
        a consolidated result.
      </p>
    </div>

    <div className="pink-card">
      <h4>Python AI Engine</h4>
      <p>
        The AI service uses Python, Flask, TensorFlow, and Keras to process
        uploaded images, run model predictions, and return results to the
        application backend.
      </p>
    </div>
  </div>
</section>

      {/* ABOUT */}
      <section id="about" className="section-block about-section">
        <h2>About Us</h2>
        <div className="pink-card">
          <p>
            At <strong>AI Skin Analysis System</strong>, we combine computer
            vision, artificial intelligence and skincare guidance.
          </p>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="section-block reviews-section">
        <h2>User Reviews ({reviews.length})</h2>

        {reviews.length === 0 ? (
          <p className="no-reviews-text">No reviews stored yet.</p>
        ) : (
          <div className="reviews-grid">
            {reviews.map((rev, idx) => (
              <div key={rev._id || idx} className="pink-card review-card">
                <div className="stars-row">
                  {"⭐".repeat(
                    Math.min(Math.max(Number(rev.rating || 5), 1), 5)
                  )}
                </div>
                <p>"{rev.text}"</p>
                <div className="review-meta">
                  <h4>— {rev.user || rev.name || "Verified User"}</h4>
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

      {/* ACCOUNT MODAL */}
      {isAccountOpen && user && (
        <AccountModal
          user={user}
          history={history}
          userData={userData}
          onClose={() => setIsAccountOpen(false)}
          onAddReview={handleAddReview}
        />
      )}

      {/* FOOTER */}
      <footer className="app-footer">
        <p>
          AI Skincare Analysis & Recommendation System ©{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}