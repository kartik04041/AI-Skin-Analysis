import React, { useMemo, useState } from "react";
import "./UserDashboard.css";

export default function UserDashboard({
  user = {},
  history = [],
  onClose,
  onAddReview,
  onLogout,
  onStartTest,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  /*
   * =========================================================
   * NORMALIZE HISTORY
   * =========================================================
   *
   * Backend may return:
   * test.type
   * test.prediction
   * test.label
   * test.analysis.prediction
   * test.result.prediction
   *
   * This function makes all of them work.
   */

  const normalizeTest = (test = {}) => {
    const analysis =
      test.analysis && typeof test.analysis === "object"
        ? test.analysis
        : {};

    const result =
      test.result && typeof test.result === "object"
        ? test.result
        : {};

    const prediction =
      test.prediction ||
      test.label ||
      test.type ||
      analysis.prediction ||
      analysis.label ||
      analysis.class ||
      analysis.type ||
      result.prediction ||
      result.label ||
      result.class ||
      result.type ||
      "";

    const concern =
      test.concern ||
      analysis.concern ||
      result.concern ||
      prediction ||
      "General";

    const confidence =
      test.confidence ??
      analysis.confidence ??
      analysis.confidence_score ??
      analysis.probability ??
      result.confidence ??
      result.confidence_score ??
      0;

    const water =
      test.water ||
      test.waterIntake ||
      test.userData?.waterIntake ||
      "Not recorded";

    const climate =
      test.climate ||
      test.userData?.climate ||
      "Not recorded";

    const date =
      test.date ||
      test.createdAt ||
      test.updatedAt ||
      null;

    return {
      ...test,
      prediction,
      type: prediction || "Skin Analysis",
      concern,
      confidence,
      water,
      climate,
      date,
    };
  };

  const normalizedHistory = useMemo(() => {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .map(normalizeTest)
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt || a.date || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.date || 0
        ).getTime();

        return dateB - dateA;
      });
  }, [history]);

  const latestTest =
    normalizedHistory.length > 0
      ? normalizedHistory[0]
      : null;

  const previousTest =
    normalizedHistory.length > 1
      ? normalizedHistory[1]
      : null;

  const totalTests =
    normalizedHistory.length;

  /*
   * =========================================================
   * CONFIDENCE
   * =========================================================
   */

  const getConfidenceNumber = (value) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return 0;
    }

    if (typeof value === "object") {
      value =
        value.value ??
        value.score ??
        value.confidence ??
        0;
    }

    let parsed = Number(
      String(value)
        .replace("%", "")
        .replace(",", ".")
        .trim()
    );

    if (Number.isNaN(parsed)) {
      return 0;
    }

    /*
     * If AI sends 0.94 instead of 94,
     * convert it to percentage.
     */
    if (parsed > 0 && parsed <= 1) {
      parsed *= 100;
    }

    return Math.round(
      Math.min(
        Math.max(parsed, 0),
        100
      )
    );
  };

  const confidence =
    getConfidenceNumber(
      latestTest?.confidence
    );

  const previousConfidence =
    getConfidenceNumber(
      previousTest?.confidence
    );

  const progressDifference =
    confidence - previousConfidence;

  const skinType =
    latestTest?.type ||
    latestTest?.prediction ||
    latestTest?.label ||
    "Not analyzed";

  const concern =
    latestTest?.concern ||
    latestTest?.prediction ||
    "No concern detected";

  const hydration =
    latestTest?.water ||
    latestTest?.waterIntake ||
    "Not recorded";

  const climate =
    latestTest?.climate ||
    "Not recorded";

  /*
   * =========================================================
   * SKIN SCORE
   * =========================================================
   */

  const skinScore = useMemo(() => {
    if (!latestTest) {
      return 0;
    }

    /*
     * Keep score based on real confidence.
     * Do not create fake 85/70 values.
     */
    return Math.round(
      Math.min(
        Math.max(confidence, 0),
        100
      )
    );
  }, [latestTest, confidence]);

  /*
   * =========================================================
   * MESSAGE
   * =========================================================
   */

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  /*
   * =========================================================
   * REVIEW
   * =========================================================
   */

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!reviewText.trim()) {
      showMessage(
        "Please enter your review."
      );
      return;
    }

    if (onAddReview) {
      await onAddReview({
        user:
          user?.name ||
          user?.username ||
          "User",

        text: reviewText.trim(),

        rating,
      });
    }

    setReviewText("");

    showMessage(
      "✓ Thank you! Your review has been submitted."
    );
  };

  /*
   * =========================================================
   * FEEDBACK
   * =========================================================
   */

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      showMessage(
        "Please enter your suggestion."
      );
      return;
    }

    setFeedback("");

    showMessage(
      "✓ Thank you! Your suggestion has been recorded."
    );
  };

  /*
   * =========================================================
   * START TEST
   * =========================================================
   */

  const handleStartTest = () => {
    if (onStartTest) {
      onStartTest();
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  /*
   * =========================================================
   * USER NAME
   * =========================================================
   */

  const displayName =
    user?.name ||
    user?.username ||
    "User";

  const getInitial = () => {
    return displayName
      .charAt(0)
      .toUpperCase();
  };

  /*
   * =========================================================
   * DATE FORMAT
   * =========================================================
   */

  const formatDate = (test) => {
    if (!test) {
      return "Recent";
    }

    const rawDate =
      test.createdAt ||
      test.date ||
      test.updatedAt;

    if (!rawDate) {
      return "Recent";
    }

    const date =
      new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return String(rawDate);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="user-dashboard-page">

      {/* HEADER */}

      <header className="user-dashboard-header">

        <div className="user-brand">

          <div className="user-logo">
            ✨
          </div>

          <div>
            <h1>
              AI Skincare{" "}
              <span>User Center</span>
            </h1>

            <p>
              Personal skin intelligence &
              wellness dashboard
            </p>
          </div>

        </div>

        <div className="user-header-right">

          <div className="user-online-status">
            <span />
            AI System Online
          </div>

          <div className="user-mini-profile">

            <div className="user-mini-avatar">
              {getInitial()}
            </div>

            <div>
              <strong>
                {displayName}
              </strong>

              <small>
                {user?.email ||
                  "Personal Account"}
              </small>
            </div>

          </div>

          {onLogout && (
            <button
              className="user-logout-btn"
              onClick={onLogout}
            >
              Logout
            </button>
          )}

          {onClose && (
            <button
              className="user-close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          )}

        </div>

      </header>

      {/* HERO */}

      <section className="user-hero">

        <div className="hero-glow" />

        <div className="hero-content">

          <span className="user-kicker">
            PERSONAL AI CONTROL CENTER
          </span>

          <h2>
            Welcome back, {displayName} 👋
          </h2>

          <p>
            Track your skin analysis,
            monitor changes, understand
            your skin profile and build
            a smarter skincare routine.
          </p>

          <div className="hero-actions">

            <button
              className="primary-user-btn"
              onClick={handleStartTest}
            >
              📸 Take New Skin Test
            </button>

            <button
              className="secondary-user-btn"
              onClick={() =>
                setActiveTab("history")
              }
            >
              🕘 View History
            </button>

          </div>

        </div>

        <div className="hero-score">

          <div
            className="score-ring"
            style={{
              background: `conic-gradient(
                #ff4fa3 ${skinScore}%,
                rgba(255,255,255,.06) 0
              )`,
            }}
          >
            <div>
              <strong>
                {skinScore}
              </strong>

              <span>
                Skin Score
              </span>
            </div>
          </div>

          <small>
            {latestTest
              ? "Based on your latest analysis"
              : "Complete a skin test to generate your score"}
          </small>

        </div>

      </section>

      {/* NAVIGATION */}

      <nav className="user-dashboard-tabs">

        {[
          ["overview", "🏠 Overview"],
          ["progress", "📊 Progress"],
          ["history", "🕘 Test History"],
          ["routine", "🧴 My Routine"],
          ["feedback", "⭐ Feedback"],
          ["future", "🚀 Future Tools"],
        ].map(([tab, label]) => (
          <button
            key={tab}
            className={
              activeTab === tab
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(tab)
            }
          >
            {label}
          </button>
        ))}

      </nav>

      {/* TOAST */}

      {message && (
        <div className="user-toast">
          {message}
        </div>
      )}

      {/* =====================================================
          OVERVIEW
          ===================================================== */}

      {activeTab === "overview" && (
        <main>

          <div className="user-stat-grid">

            <div className="user-stat-card">
              <div className="user-stat-icon">
                📸
              </div>

              <span>
                TOTAL TESTS
              </span>

              <strong>
                {totalTests}
              </strong>

              <small>
                Skin analyses completed
              </small>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-icon">
                🧠
              </div>

              <span>
                SKIN TYPE
              </span>

              <strong className="pink-value">
                {skinType}
              </strong>

              <small>
                Latest AI classification
              </small>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-icon">
                🎯
              </div>

              <span>
                AI CONFIDENCE
              </span>

              <strong>
                {confidence}%
              </strong>

              <small>
                Latest analysis confidence
              </small>
            </div>

            <div className="user-stat-card">
              <div className="user-stat-icon">
                💧
              </div>

              <span>
                HYDRATION
              </span>

              <strong>
                {hydration}
              </strong>

              <small>
                Recorded lifestyle data
              </small>
            </div>

          </div>

          <div className="user-main-grid">

            {/* LATEST ANALYSIS */}

            <section className="user-panel large">

              <div className="user-panel-header">

                <div>
                  <span>
                    LATEST ANALYSIS
                  </span>

                  <h3>
                    Your Skin Intelligence
                  </h3>

                  <p>
                    Data from your most recent
                    completed skin analysis.
                  </p>
                </div>

                {latestTest && (
                  <div className="live-badge">
                    ● ANALYZED
                  </div>
                )}

              </div>

              {latestTest ? (
                <div className="analysis-grid">

                  <div className="analysis-main">

                    <div className="skin-type-orb">

                      <div>
                        <span>
                          DETECTED
                        </span>

                        <strong>
                          {skinType}
                        </strong>

                        <small>
                          Skin Profile
                        </small>
                      </div>

                    </div>

                  </div>

                  <div className="analysis-details">

                    <div>
                      <span>
                        Primary Result
                      </span>

                      <strong>
                        {concern}
                      </strong>
                    </div>

                    <div>
                      <span>
                        AI Confidence
                      </span>

                      <strong>
                        {confidence}%
                      </strong>

                      <div className="mini-progress">
                        <div
                          style={{
                            width:
                              `${confidence}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <span>
                        Environment
                      </span>

                      <strong>
                        {climate}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Last Analysis
                      </span>

                      <strong>
                        {formatDate(
                          latestTest
                        )}
                      </strong>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="user-empty">

                  <div>
                    📸
                  </div>

                  <h3>
                    Your skin journey starts here
                  </h3>

                  <p>
                    Complete your first AI
                    skin analysis to unlock
                    your personalized dashboard.
                  </p>

                  <button
                    className="primary-user-btn"
                    onClick={handleStartTest}
                  >
                    Start My First Analysis
                  </button>

                </div>
              )}

            </section>

            {/* QUICK ACTIONS */}

            <section className="user-panel">

              <div className="user-panel-header">
                <div>
                  <span>
                    QUICK ACTIONS
                  </span>

                  <h3>
                    Your Tools
                  </h3>
                </div>
              </div>

              <div className="quick-action-list">

                <button
                  onClick={handleStartTest}
                >
                  <span>📸</span>

                  <div>
                    <strong>
                      New Skin Test
                    </strong>

                    <small>
                      Analyze your current skin
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    setActiveTab("progress")
                  }
                >
                  <span>📈</span>

                  <div>
                    <strong>
                      Track Progress
                    </strong>

                    <small>
                      Compare previous analyses
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    setActiveTab("routine")
                  }
                >
                  <span>🧴</span>

                  <div>
                    <strong>
                      Skincare Routine
                    </strong>

                    <small>
                      View your routine plan
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    setActiveTab("future")
                  }
                >
                  <span>🧪</span>

                  <div>
                    <strong>
                      Smart Skin Tools
                    </strong>

                    <small>
                      Explore upcoming features
                    </small>
                  </div>

                  <b>→</b>
                </button>

              </div>

            </section>

          </div>

          {/* INSIGHTS */}

          <div className="user-main-grid">

            <section className="user-panel">

              <div className="user-panel-header">
                <div>
                  <span>
                    SKIN INSIGHT
                  </span>

                  <h3>
                    Current Focus
                  </h3>
                </div>
              </div>

              <div className="focus-card">

                <div className="focus-icon">
                  🎯
                </div>

                <div>
                  <strong>
                    {latestTest
                      ? concern
                      : "No analysis yet"}
                  </strong>

                  <p>
                    {latestTest
                      ? "Continue following a consistent skincare routine and monitor changes through your next analysis."
                      : "Complete an AI skin analysis to receive personalized insights."}
                  </p>
                </div>

              </div>

            </section>

            <section className="user-panel">

              <div className="user-panel-header">

                <div>
                  <span>
                    LIFESTYLE
                  </span>

                  <h3>
                    Wellness Snapshot
                  </h3>
                </div>

              </div>

              <div className="wellness-grid">

                <div>
                  <span>💧</span>
                  <strong>
                    {hydration}
                  </strong>
                  <small>
                    Water
                  </small>
                </div>

                <div>
                  <span>🌤️</span>
                  <strong>
                    {climate}
                  </strong>
                  <small>
                    Environment
                  </small>
                </div>

                <div>
                  <span>😴</span>
                  <strong>
                    Track
                  </strong>
                  <small>
                    Sleep
                  </small>
                </div>

                <div>
                  <span>🧘</span>
                  <strong>
                    Track
                  </strong>
                  <small>
                    Stress
                  </small>
                </div>

              </div>

            </section>

          </div>

          <section className="user-privacy-banner">

            <div>🔐</div>

            <div>
              <strong>
                Your skin data stays personal
              </strong>

              <p>
                This dashboard displays only
                the analysis history associated
                with your account.
              </p>
            </div>

          </section>

        </main>
      )}

      {/* =====================================================
          PROGRESS
          ===================================================== */}

      {activeTab === "progress" && (
        <section>

          <div className="user-section-title">

            <span>
              PERSONAL ANALYTICS
            </span>

            <h2>
              Skin Progress
            </h2>

            <p>
              Compare your latest analysis
              with your previous result.
            </p>

          </div>

          <div className="progress-overview-grid">

            <div className="user-panel">

              <span className="user-panel-label">
                CURRENT CONFIDENCE
              </span>

              <div className="big-metric">
                {confidence}%
              </div>

              <div className="big-progress">
                <div
                  style={{
                    width:
                      `${confidence}%`,
                  }}
                />
              </div>

              <small>
                Latest AI analysis
              </small>

            </div>

            <div className="user-panel">

              <span className="user-panel-label">
                PREVIOUS CONFIDENCE
              </span>

              <div className="big-metric">
                {previousTest
                  ? `${previousConfidence}%`
                  : "N/A"}
              </div>

              <small>
                Previous analysis
              </small>

            </div>

            <div className="user-panel">

              <span className="user-panel-label">
                CHANGE
              </span>

              <div
                className={`big-metric ${
                  progressDifference >= 0
                    ? "positive"
                    : "negative"
                }`}
              >
                {previousTest
                  ? `${
                      progressDifference >= 0
                        ? "+"
                        : ""
                    }${progressDifference}%`
                  : "N/A"}
              </div>

              <small>
                Confidence change
              </small>

            </div>

          </div>

          <section className="user-panel">

            <div className="user-panel-header">

              <div>
                <span>
                  COMPARISON ENGINE
                </span>

                <h3>
                  Current vs Previous Analysis
                </h3>
              </div>

            </div>

            {previousTest ? (
              <div className="comparison-chart">

                <div className="comparison-item">

                  <div className="comparison-header">
                    <span>
                      Current
                    </span>

                    <strong>
                      {confidence}%
                    </strong>
                  </div>

                  <div className="comparison-track">

                    <div
                      className="current-progress"
                      style={{
                        width:
                          `${confidence}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="comparison-item">

                  <div className="comparison-header">

                    <span>
                      Previous
                    </span>

                    <strong>
                      {previousConfidence}%
                    </strong>

                  </div>

                  <div className="comparison-track">

                    <div
                      className="previous-progress"
                      style={{
                        width:
                          `${previousConfidence}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="comparison-details">

                  <div>
                    <span>
                      Previous Result
                    </span>

                    <strong>
                      {previousTest.type ||
                        previousTest.prediction ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Current Result
                    </span>

                    <strong>
                      {skinType}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Previous Concern
                    </span>

                    <strong>
                      {previousTest.concern ||
                        previousTest.prediction ||
                        "Not recorded"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Current Concern
                    </span>

                    <strong>
                      {concern}
                    </strong>
                  </div>

                </div>

              </div>
            ) : (
              <div className="user-empty">

                <div>
                  📊
                </div>

                <h3>
                  Not enough data yet
                </h3>

                <p>
                  Complete at least two skin
                  tests to unlock progress
                  comparison.
                </p>

              </div>
            )}

          </section>

        </section>
      )}

      {/* =====================================================
          HISTORY
          ===================================================== */}

      {activeTab === "history" && (
        <section>

          <div className="user-section-title">

            <span>
              ANALYSIS TIMELINE
            </span>

            <h2>
              Test History
            </h2>

            <p>
              Your previous AI skin analysis sessions.
            </p>

          </div>

          {normalizedHistory.length > 0 ? (

            <div className="history-list">

              {normalizedHistory.map(
                (test, index) => {

                  const testConfidence =
                    getConfidenceNumber(
                      test.confidence
                    );

                  return (
                    <div
                      className="history-card"
                      key={
                        test._id ||
                        test.id ||
                        index
                      }
                    >

                      <div className="history-number">
                        {String(
                          normalizedHistory.length -
                            index
                        ).padStart(2, "0")}
                      </div>

                      <div className="history-content">

                        <div className="history-top">

                          <div>

                            <span>
                              {formatDate(test)}
                            </span>

                            <h3>
                              {test.type ||
                                test.prediction ||
                                "Skin Analysis"}
                            </h3>

                          </div>

                          <div className="history-confidence">

                            {testConfidence}%

                            <small>
                              confidence
                            </small>

                          </div>

                        </div>

                        <div className="history-tags">

                          <span>
                            🧠{" "}
                            {test.type ||
                              test.prediction ||
                              test.label ||
                              "Unknown"}
                          </span>

                          <span>
                            🎯{" "}
                            {test.concern ||
                              test.prediction ||
                              "General"}
                          </span>

                          <span>
                            💧{" "}
                            {test.water ||
                              test.waterIntake ||
                              "Not recorded"}
                          </span>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <div className="user-panel">

              <div className="user-empty">

                <div>
                  🕘
                </div>

                <h3>
                  No test history
                </h3>

                <p>
                  Your completed skin analyses
                  will appear here.
                </p>

                <button
                  className="primary-user-btn"
                  onClick={handleStartTest}
                >
                  Take First Test
                </button>

              </div>

            </div>

          )}

        </section>
      )}

      {/* =====================================================
          ROUTINE
          ===================================================== */}

      {activeTab === "routine" && (
        <section>

          <div className="user-section-title">

            <span>
              PERSONAL CARE
            </span>

            <h2>
              My Skincare Routine
            </h2>

            <p>
              A simple structure based on
              your latest skin profile.
            </p>

          </div>

          <div className="routine-grid">

            <div className="routine-card morning">

              <div className="routine-time">
                ☀️ MORNING
              </div>

              <h3>
                Start Fresh
              </h3>

              {[
                "Gentle cleanser",
                "Hydrating product",
                "Moisturizer",
                "Broad-spectrum sunscreen",
              ].map((item, index) => (
                <div
                  className="routine-step"
                  key={item}
                >
                  <b>
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </b>

                  <span>
                    {item}
                  </span>
                </div>
              ))}

            </div>

            <div className="routine-card evening">

              <div className="routine-time">
                🌙 EVENING
              </div>

              <h3>
                Repair & Recover
              </h3>

              {[
                "Gentle cleanser",
                "Targeted treatment",
                "Moisturizer",
              ].map((item, index) => (
                <div
                  className="routine-step"
                  key={item}
                >
                  <b>
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </b>

                  <span>
                    {item}
                  </span>
                </div>
              ))}

            </div>

          </div>

          <div className="routine-warning">

            <strong>
              ⚠️ Smart Routine Reminder
            </strong>

            <p>
              Introduce new skincare products
              gradually. Patch-test new products
              and avoid combining multiple strong
              active ingredients without understanding
              their compatibility.
            </p>

          </div>

        </section>
      )}

      {/* =====================================================
          FEEDBACK
          ===================================================== */}

      {activeTab === "feedback" && (
        <section>

          <div className="user-section-title">

            <span>
              YOUR VOICE MATTERS
            </span>

            <h2>
              Reviews & Feedback
            </h2>

            <p>
              Help improve the AI Skincare platform.
            </p>

          </div>

          <div className="feedback-grid">

            <section className="user-panel">

              <div className="user-panel-header">

                <div>
                  <span>
                    PUBLIC REVIEW
                  </span>

                  <h3>
                    How was your experience?
                  </h3>
                </div>

                <span className="feedback-icon">
                  ⭐
                </span>

              </div>

              <form
                onSubmit={handleReviewSubmit}
                className="user-form"
              >

                <label>
                  Rating
                </label>

                <select
                  value={rating}
                  onChange={(e) =>
                    setRating(
                      Number(
                        e.target.value
                      )
                    )
                  }
                >
                  <option value="5">
                    ⭐⭐⭐⭐⭐ — Excellent
                  </option>

                  <option value="4">
                    ⭐⭐⭐⭐ — Very Good
                  </option>

                  <option value="3">
                    ⭐⭐⭐ — Average
                  </option>

                  <option value="2">
                    ⭐⭐ — Needs Work
                  </option>

                  <option value="1">
                    ⭐ — Poor
                  </option>
                </select>

                <label>
                  Your Review
                </label>

                <textarea
                  rows="5"
                  placeholder="Tell us how accurate and useful your AI analysis was..."
                  value={reviewText}
                  onChange={(e) =>
                    setReviewText(
                      e.target.value
                    )
                  }
                />

                <button
                  className="primary-user-btn"
                  type="submit"
                >
                  Submit Review
                </button>

              </form>

            </section>

            <section className="user-panel">

              <div className="user-panel-header">

                <div>
                  <span>
                    PRODUCT IMPROVEMENT
                  </span>

                  <h3>
                    Suggest a Feature
                  </h3>
                </div>

                <span className="feedback-icon">
                  💡
                </span>

              </div>

              <form
                onSubmit={handleFeedbackSubmit}
                className="user-form"
              >

                <label>
                  What should we build next?
                </label>

                <textarea
                  rows="8"
                  placeholder="Example: I would like a daily skincare reminder..."
                  value={feedback}
                  onChange={(e) =>
                    setFeedback(
                      e.target.value
                    )
                  }
                />

                <button
                  className="secondary-user-btn"
                  type="submit"
                >
                  Send Suggestion
                </button>

              </form>

            </section>

          </div>

        </section>
      )}

      {/* =====================================================
          FUTURE TOOLS
          ===================================================== */}

      {activeTab === "future" && (
        <section>

          <div className="user-section-title">

            <span>
              NEXT-GENERATION SKIN INTELLIGENCE
            </span>

            <h2>
              Future Smart Tools
            </h2>

            <p>
              Features that can turn your
              dashboard into a complete
              personal skincare companion.
            </p>

          </div>

          <div className="future-tools-grid">

            {[
              [
                "💧",
                "Water & Diet Journal",
                "Track hydration and food patterns to discover possible relationships with changes in your skin.",
              ],
              [
                "🧪",
                "Ingredient Conflict Checker",
                "Check whether selected skincare ingredients may be unsuitable to combine.",
              ],
              [
                "🧴",
                "Product Expiration Tracker",
                "Track opening dates and product replacement reminders.",
              ],
              [
                "😴",
                "Sleep & Stress Analytics",
                "Track sleep and stress alongside your personal skin-analysis history.",
              ],
              [
                "🧼",
                "Hygiene Reminder Engine",
                "Get reminders for pillowcases, makeup tools and skincare hygiene.",
              ],
              [
                "🔬",
                "Patch Test Assistant",
                "A guided patch-test workflow with timers and reaction tracking.",
              ],
              [
                "🤖",
                "AI Skin Trend Prediction",
                "Analyze multiple historical tests to visualize long-term changes.",
              ],
              [
                "📅",
                "Smart Skincare Reminders",
                "Personalized notifications for routine steps, testing and product usage.",
              ],
            ].map(
              ([icon, title, description]) => (
                <div
                  className="future-tool"
                  key={title}
                >
                  <span>{icon}</span>

                  <div>
                    <h3>{title}</h3>

                    <p>
                      {description}
                    </p>
                  </div>

                  <b>
                    PLANNED
                  </b>
                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* FOOTER */}

      <footer className="user-dashboard-footer">

        <span>
          ✨ AI Skincare Analysis System
        </span>

        <span>
          Personal User Center •{" "}
          {new Date().getFullYear()}
        </span>

      </footer>

    </div>
  );
}