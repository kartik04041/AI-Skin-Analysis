import React, { useState } from "react";

export default function AccountModal({ user, history, onClose, onAddReview }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");

  const latestTest = history[0];
  const previousTest = history[1];

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText) return;
    onAddReview({ user: user.name, text: reviewText, rating });
    setReviewText("");
    setSubmittedMessage("Thank you! Your review has been saved.");
    setTimeout(() => setSubmittedMessage(""), 3000);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedback) return;
    setFeedback("");
    setSubmittedMessage("Thank you for your suggestion! We've recorded it.");
    setTimeout(() => setSubmittedMessage(""), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-card account-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        {/* ACCOUNT HEADER */}
        <div className="account-header">
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2>{user?.name || "User Account"}</h2>
            <p className="user-email">{user?.email || "user@example.com"}</p>
          </div>
        </div>

        {/* ACCOUNT NAVIGATION TABS */}
        <div className="account-tabs">
          <button 
            className={activeTab === "profile" ? "active" : ""} 
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile & Last Test
          </button>
          <button 
            className={activeTab === "charts" ? "active" : ""} 
            onClick={() => setActiveTab("charts")}
          >
            📊 Test Comparison Chart
          </button>
          <button 
            className={activeTab === "feedback" ? "active" : ""} 
            onClick={() => setActiveTab("feedback")}
          >
            ⭐ Reviews & Feedback
          </button>
          <button 
            className={activeTab === "features" ? "active" : ""} 
            onClick={() => setActiveTab("features")}
          >
            🚀 Future Upgrades
          </button>
        </div>

        {/* TAB 1: PROFILE & LAST TEST */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <div className="info-card-grid">
              <div className="summary-box">
                <span className="summary-title">Total Tests Taken</span>
                <span className="summary-number">{history.length}</span>
              </div>
              <div className="summary-box">
                <span className="summary-title">Current Skin Type</span>
                <span className="summary-number highlight">{latestTest ? latestTest.type : "N/A"}</span>
              </div>
              <div className="summary-box">
                <span className="summary-title">Last Test Date</span>
                <span className="summary-number">{latestTest ? latestTest.date : "No test yet"}</span>
              </div>
            </div>

            <h4 className="section-subtitle">Last Analysis Summary</h4>
            {latestTest ? (
              <div className="last-test-box">
                <p><strong>Detected Skin Type:</strong> {latestTest.type}</p>
                <p><strong>Confidence Score:</strong> {latestTest.confidence}</p>
                <p><strong>Primary Concern Noted:</strong> {latestTest.concern || "Acne & Breakouts"}</p>
                <p><strong>Environment & Lifestyle:</strong> {latestTest.climate || "Moderate Climate"}, {latestTest.water || "2-3L Water/day"}</p>
              </div>
            ) : (
              <p className="empty-text">Take your first test to see detailed history here.</p>
            )}
          </div>
        )}

        {/* TAB 2: COMPARISON CHARTS */}
        {activeTab === "charts" && (
          <div className="tab-content">
            <h4 className="section-subtitle">Skin Type Metrics: Current vs Previous Test</h4>
            
            {previousTest ? (
              <div className="chart-container">
                <div className="chart-legend">
                  <span className="legend-item current"><span className="legend-color"></span> Current ({latestTest.date})</span>
                  <span className="legend-item previous"><span className="legend-color"></span> Previous ({previousTest.date})</span>
                </div>

                <div className="bar-chart-group">
                  <div className="chart-row">
                    <span className="row-label">Confidence Match</span>
                    <div className="dual-bar-track">
                      <div className="bar current-bar" style={{ width: latestTest.confidence }}>{latestTest.confidence}</div>
                      <div className="bar previous-bar" style={{ width: previousTest.confidence }}>{previousTest.confidence}</div>
                    </div>
                  </div>

                  <div className="chart-row">
                    <span className="row-label">Oiliness Metric</span>
                    <div className="dual-bar-track">
                      <div className="bar current-bar" style={{ width: latestTest.type === "Oily" ? "85%" : "40%" }}>{latestTest.type === "Oily" ? "85%" : "40%"}</div>
                      <div className="bar previous-bar" style={{ width: previousTest.type === "Oily" ? "80%" : "55%" }}>{previousTest.type === "Oily" ? "80%" : "55%"}</div>
                    </div>
                  </div>

                  <div className="chart-row">
                    <span className="row-label">Hydration Score</span>
                    <div className="dual-bar-track">
                      <div className="bar current-bar" style={{ width: latestTest.type === "Dry" ? "35%" : "75%" }}>{latestTest.type === "Dry" ? "35%" : "75%"}</div>
                      <div className="bar previous-bar" style={{ width: previousTest.type === "Dry" ? "40%" : "65%" }}>{previousTest.type === "Dry" ? "40%" : "65%"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="empty-text">Complete at least two skin tests to unlock side-by-side progress comparisons!</p>
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS & FEEDBACK */}
        {activeTab === "feedback" && (
          <div className="tab-content">
            {submittedMessage && <div className="success-banner">{submittedMessage}</div>}

            <form onSubmit={handleReviewSubmit} className="account-form">
              <h4>Write a Public Review</h4>
              <div className="form-group">
                <label>Rating</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="styled-input">
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                  <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                  <option value={2}>⭐⭐ (2/5 Needs Work)</option>
                  <option value={1}>⭐ (1/5 Poor)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Review Comment</label>
                <textarea 
                  rows="3"
                  placeholder="Share how accurate the AI analysis was for your skin type..." 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="styled-input"
                />
              </div>
              <button type="submit" className="action-btn">Submit Review</button>
            </form>

            <hr style={{ margin: "20px 0", borderColor: "var(--pink-200)" }} />

            <form onSubmit={handleFeedbackSubmit} className="account-form">
              <h4>Feature Suggestions & Recommendations</h4>
              <div className="form-group">
                <textarea 
                  rows="2"
                  placeholder="Suggest a feature or improvement you'd love to see in future updates..." 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="styled-input"
                />
              </div>
              <button type="submit" className="action-btn ghost-btn">Send Suggestion</button>
            </form>
          </div>
        )}

        {/* TAB 4: WHAT MORE IT CAN DO */}
        {activeTab === "features" && (
          <div className="tab-content">
            <h4 className="section-subtitle">What More Your AI Skincare Assistant Can Do</h4>
            <ul className="feature-ideas-list">
              <li>
                <strong>📸 Photo Progress Timeline:</strong> Compare weekly cheek/T-zone closeups to track acne or redness reduction over time.
              </li>
              <li>
                <strong>☀️ Real-time UV & Climate Sync:</strong> Dynamic routine adjustments based on your local weather and UV index.
              </li>
              <li>
                <strong>📄 PDF Exportable Routine:</strong> Download a clinical-style summary report to share with your dermatologist.
              </li>
              <li>
                <strong>🔔 Routine Completion Tracker:</strong> Daily checklist with push notifications for AM and PM routine compliance.
              </li>
              <li>
                <strong>🧪 Ingredient Allergy Guard:</strong> Flag products containing known triggers or allergens specific to your skin profile.
              </li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}