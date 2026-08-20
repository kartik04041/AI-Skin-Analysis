import React from "react";
import SkinImageInput from "./SkinImageInput";

export default function AnalyzerWorkspace({
  userData,
  onUserDataChange,
  onImagesUpdated,
  onAnalyze,
  loading,
  analysis,
  error,
  isLoggedIn,
  onOpenAuth,
}) {
  const getRecommendations = (type) => {
    switch (type) {
      case "Oily":
        return {
          ingredients: "Salicylic Acid (BHA), Niacinamide, Zinc PCA, Tea Tree",
          avoid: "Heavy mineral oils, occlusive waxes, rich creams",
          tips: "Focus on oil control without stripping natural moisture barrier.",
        };
      case "Dry":
        return {
          ingredients: "Hyaluronic Acid, Ceramides, Glycerin, Squalane",
          avoid: "Harsh sulfates, alcohol-based toners, physical scrubs",
          tips: "Apply hydrating serums on damp skin and seal with barrier cream.",
        };
      case "Combination":
        return {
          ingredients: "Niacinamide, Polyhydroxy Acids (PHA), Centella Asiatica",
          avoid: "Astringent cleansers over non-oily areas",
          tips: "Multi-mask: gel formulas on T-Zone and hydrating creams on cheeks.",
        };
      default:
        return {
          ingredients: "Hyaluronic Acid, Vitamin C, Mild Peptides",
          avoid: "Over-exfoliating acids",
          tips: "Maintain skin barrier homeostasis with gentle cleanser and SPF.",
        };
    }
  };

  const getRoutine = (type) => {
    switch (type) {
      case "Oily":
        return {
          am: [
            "Gentle Gel Cleanser",
            "Niacinamide 10% Serum",
            "Lightweight Oil-Free Gel",
            "SPF 50 Matte Sunscreen",
          ],
          pm: [
            "Salicylic Cleanser",
            "BHA Exfoliating Toner (2x/week)",
            "Hydrating Water Cream",
          ],
        };
      case "Dry":
        return {
          am: [
            "Hydrating Cream Cleanser",
            "Hyaluronic Acid Serum",
            "Ceramide Moisture Lotion",
            "Dewy Finish SPF 50",
          ],
          pm: [
            "Cleansing Balm",
            "Gentle Hydrating Cleanser",
            "Squalane Oil / Rich Balm",
          ],
        };
      case "Combination":
        return {
          am: [
            "Foaming Cleanser",
            "Balancing Toner",
            "Lightweight Lotion",
            "Broad Spectrum SPF 50",
          ],
          pm: [
            "Gentle Cleanser",
            "Niacinamide + PHA Treatment",
            "Barrier Repair Cream",
          ],
        };
      default:
        return {
          am: [
            "Gentle Cleanser",
            "Vitamin C Serum",
            "Hydrating Moisturizer",
            "SPF 50 Sunscreen",
          ],
          pm: ["Double Cleanse", "Peptide Serum", "Nourishing Night Cream"],
        };
    }
  };

  const currentRecs = analysis ? getRecommendations(analysis.prediction) : null;
  const currentRoutine = analysis ? getRoutine(analysis.prediction) : null;

  return (
    <div className="three-containers-wrapper">
      {/* CONTAINER 1: USER DETAILS & EMBEDDED CAMERA SCANS */}
      <div className="pink-container container-scans">
        <div className="container-header">
          <span className="container-num">01</span>
          <h3>User Details & Facial Scans 📸</h3>
        </div>

        <div className="quiz-grid">
          <div className="form-group">
            <label>Gender</label>
            <select
              value={userData.gender}
              onChange={(e) => onUserDataChange("gender", e.target.value)}
              className="pink-input"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other / Non-Binary</option>
            </select>
          </div>

          <div className="form-group">
            <label>Age Group</label>
            <select
              value={userData.age}
              onChange={(e) => onUserDataChange("age", e.target.value)}
              className="pink-input"
            >
              <option value="Under 18">Under 18</option>
              <option value="18-24">18–24</option>
              <option value="25-34">25–34</option>
              <option value="35-44">35–44</option>
              <option value="45+">45+</option>
            </select>
          </div>

          <div className="form-group">
            <label>Skin Concern</label>
            <select
              value={userData.concern}
              onChange={(e) => onUserDataChange("concern", e.target.value)}
              className="pink-input"
            >
              <option value="Acne & Breakouts">Acne & Breakouts</option>
              <option value="Dryness & Flakiness">Dryness & Flakiness</option>
              <option value="Excess Oil & Shine">Excess Oil & Shine</option>
              <option value="Sensitivity & Redness">
                Sensitivity & Redness
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Lighting Parameter</label>
            <select
              value={userData.lighting || "Natural Daylight"}
              onChange={(e) => onUserDataChange("lighting", e.target.value)}
              className="pink-input"
            >
              <option value="Natural Daylight">☀️ Natural Daylight</option>
              <option value="Indoor Warm/Yellow">💡 Indoor Warm Light</option>
              <option value="Cool White/Ring Light">
                ⚪ Ring Light / White LED
              </option>
            </select>
          </div>
        </div>

        {/* EMBEDDED 3-ANGLE CAMERA SCANNER WITH LOGIN GUARD */}
        <SkinImageInput
          onImagesUpdated={onImagesUpdated}
          isLoggedIn={isLoggedIn}
          onOpenAuth={onOpenAuth}
        />

        <button
          type="button"
          className="pink-action-btn"
          onClick={() => {
            if (!isLoggedIn) {
              if (onOpenAuth) onOpenAuth();
            } else {
              onAnalyze();
            }
          }}
          disabled={loading}
        >
          {loading
            ? "✨ Running Ensemble AI Analysis..."
            : isLoggedIn
            ? "💖 Run Diagnostic Scan"
            : "🔑 Login to Run Diagnostic Scan"}
        </button>

        {error && <div className="pink-error-banner">⚠️ {error}</div>}
      </div>

      {/* CONTAINER 2: RECOMMENDATIONS */}
      <div className="pink-container container-recommendations">
        <div className="container-header">
          <span className="container-num">02</span>
          <h3>Analysis & Recommendations 🧴</h3>
        </div>

        {analysis ? (
          <div className="analysis-results">
            <div className="result-hero-badge">
              <span className="badge-title">{analysis.prediction} Skin</span>
              <span className="badge-conf">
                {(analysis.confidence * 100).toFixed(1)}% Match
              </span>
            </div>

            <div className="prob-bars-stack">
              <h4>Probability Breakdown</h4>
              {analysis.probabilities &&
                Object.entries(analysis.probabilities).map(
                  ([stype, prob]) => (
                    <div key={stype} className="prob-item">
                      <span className="prob-name">{stype}</span>
                      <div className="prob-track">
                        <div
                          className="prob-fill"
                          style={{ width: `${(prob * 100).toFixed(1)}%` }}
                        ></div>
                      </div>
                      <span className="prob-num">
                        {(prob * 100).toFixed(0)}%
                      </span>
                    </div>
                  )
                )}
            </div>

            <div className="recs-box">
              <div className="rec-group">
                <strong>🌸 Ideal Key Ingredients:</strong>
                <p>{currentRecs.ingredients}</p>
              </div>
              <div className="rec-group">
                <strong>🚫 Ingredients to Avoid:</strong>
                <p>{currentRecs.avoid}</p>
              </div>
              <div className="rec-group">
                <strong>💡 Clinical Tips:</strong>
                <p>{currentRecs.tips}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="placeholder-state">
            <div className="placeholder-icon">🌸</div>
            <p>
              Run container #1 scan to generate personalized recommendations.
            </p>
          </div>
        )}
      </div>

      {/* CONTAINER 3: DAILY ROUTINE */}
      <div className="pink-container container-routine">
        <div className="container-header">
          <span className="container-num">03</span>
          <h3>Customized Skincare Routine 📅</h3>
        </div>

        {analysis && currentRoutine ? (
          <div className="routine-tables">
            <div className="routine-card am-card">
              <h4>☀️ Morning Routine (AM)</h4>
              <ul>
                {currentRoutine.am.map((step, idx) => (
                  <li key={idx}>
                    <span className="step-num">{idx + 1}</span> {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="routine-card pm-card">
              <h4>🌙 Evening Routine (PM)</h4>
              <ul>
                {currentRoutine.pm.map((step, idx) => (
                  <li key={idx}>
                    <span className="step-num">{idx + 1}</span> {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="placeholder-state">
            <div className="placeholder-icon">✨</div>
            <p>Complete skin diagnostic to view your custom AM & PM routine.</p>
          </div>
        )}
      </div>
    </div>
  );
}