import React, { useState } from "react";
import SkinImageInput from "./SkinImageInput";
import "./App.css";

// Skincare knowledge base for skin types and concerns
const RECOMMENDATIONS = {
  acne: {
    title: "Acne-Prone Skin Care Plan",
    ingredients: ["Salicylic Acid (BHA)", "Niacinamide", "Tea Tree Oil", "Benzoyl Peroxide"],
    routine: [
      "Cleanser: Gentle foaming cleanser with 2% Salicylic Acid.",
      "Treatment: Niacinamide serum to soothe inflammation and reduce spot marks.",
      "Moisturizer: Oil-free, non-comedogenic gel hydrator.",
      "Sun Protection: Lightweight, mattifying SPF 50 mineral sunscreen."
    ],
    avoid: "Heavy oils (coconut oil, lanolin), harsh physical scrubs, and alcohol-based toners."
  },
  combination: {
    title: "Combination Skin Care Plan",
    ingredients: ["Hyaluronic Acid", "Niacinamide", "Lactic Acid (AHA)", "Green Tea Extract"],
    routine: [
      "Cleanser: Mild gel cleanser that balances oils without stripping moisture.",
      "Targeted Care: Lightweight BHA on T-Zone (forehead/nose) and hydrating serum on cheeks.",
      "Moisturizer: Lotion-based moisturizer that balances dry and oily areas.",
      "Sun Protection: Broad-spectrum fluid SPF 50."
    ],
    avoid: "Extremely heavy creams or overly drying clay masks used all over the face."
  },
  dry: {
    title: "Dry Skin Care Plan",
    ingredients: ["Ceramides", "Hyaluronic Acid", "Glycerin", "Squalane", "Shea Butter"],
    routine: [
      "Cleanser: Hydrating, non-foaming cream cleanser.",
      "Serum: Hyaluronic Acid applied on damp skin to lock in hydration.",
      "Moisturizer: Rich barrier repair cream with Ceramides.",
      "Sun Protection: Moisturizing SPF 50 sunscreen with nourishing lipids."
    ],
    avoid: "Foaming sulfates, hot water washing, and frequent exfoliants."
  },
  normal: {
    title: "Balanced & Normal Skin Care Plan",
    ingredients: ["Vitamin C", "Hyaluronic Acid", "Peptides", "Antioxidants"],
    routine: [
      "Cleanser: Gentle everyday cleanser.",
      "Serum: Vitamin C serum in the morning for environmental protection.",
      "Moisturizer: Balanced daily lotion.",
      "Sun Protection: Broad-spectrum SPF 50."
    ],
    avoid: "Over-exfoliating or constantly switching core products unnecessarily."
  },
  oily: {
    title: "Oily Skin Care Plan",
    ingredients: ["Salicylic Acid", "Zinc PCA", "Niacinamide", "Clay (Kaolin/Bentonite)"],
    routine: [
      "Cleanser: Clarifying gel cleanser to remove excess sebum.",
      "Serum: 10% Niacinamide + Zinc to regulate sebum production.",
      "Moisturizer: Water-based gel-cream moisturizer.",
      "Sun Protection: Ultra-light, oil-control fluid sunscreen."
    ],
    avoid: "Pore-clogging heavy oils, thick butter creams, and harsh alcohol strips."
  },
  sensitive: {
    title: "Sensitive Skin Care Plan",
    ingredients: ["Centella Asiatica (Cica)", "Colloidal Oatmeal", "Ceramides", "Panthenol (B5)"],
    routine: [
      "Cleanser: Ultra-gentle, fragrance-free cleanser.",
      "Soothe: Cica serum or Panthenol cream to strengthen skin barrier.",
      "Moisturizer: Fragrance-free cream with minimal active ingredients.",
      "Sun Protection: 100% Mineral SPF (Zinc Oxide) for non-irritating defense."
    ],
    avoid: "Fragrances, essential oils, high-strength AHAs/BHAs, and harsh physical scrubs."
  }
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelected = (file) => {
    setSelectedFile(file);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("Please select or capture an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to analyze skin image.");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      console.error("Analysis Request Error:", err);
      setError(err.message || "Unable to reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const predictedKey = analysis?.prediction?.toLowerCase();
  const recs = RECOMMENDATIONS[predictedKey];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>✨ AI Skincare Assistant</h1>
        <p>Analyze your skin type & receive tailored product recommendations</p>
      </header>

      <main className="main-content">
        <section className="input-card">
          <h2>1. Select or Capture Skin Sample</h2>
          <SkinImageInput onImageSelected={handleImageSelected} />

          {selectedFile && !loading && (
            <button className="analyze-btn" onClick={handleAnalyze}>
              🔍 Analyze Skin Profile
            </button>
          )}

          {loading && (
            <div className="loading-spinner">
              <p>⏳ Analyzing skin patterns with AI model...</p>
            </div>
          )}

          {error && <div className="error-banner">⚠️ {error}</div>}
        </section>

        {/* AI Results Section */}
        {analysis && (
          <section className="results-container">
            <div className="results-header">
              <h2>Analysis Complete ✓</h2>
            </div>

            <div className="primary-badge">
              <p className="badge-label">Detected Skin Profile</p>
              <h3 className="badge-value">{analysis.prediction.toUpperCase()}</h3>
              <p className="confidence-score">
                Confidence: <strong>{(analysis.confidence * 100).toFixed(1)}%</strong>
              </p>
            </div>

            {/* Probability Breakdown */}
            <div className="breakdown-section">
              <h3>Skin Profile Probability Breakdown</h3>
              <div className="breakdown-grid">
                {Object.entries(analysis.probabilities || {}).map(([key, prob]) => {
                  const percentage = (prob * 100).toFixed(1);
                  return (
                    <div className="breakdown-item" key={key}>
                      <div className="breakdown-info">
                        <span className="label-name">{key.toUpperCase()}</span>
                        <span className="label-val">{percentage}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tailored Routine & Recommendations */}
            {recs && (
              <div className="recommendations-card">
                <h3>💡 {recs.title}</h3>

                <div className="rec-group">
                  <h4>Recommended Key Ingredients:</h4>
                  <ul className="pill-list">
                    {recs.ingredients.map((ing, idx) => (
                      <li key={idx} className="ingredient-pill">
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rec-group">
                  <h4>Suggested Daily Routine:</h4>
                  <ol className="routine-list">
                    {recs.routine.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="rec-group warning-box">
                  <h4>⚠️ Ingredients & Habits to Avoid:</h4>
                  <p>{recs.avoid}</p>
                </div>
              </div>
            )}

            <div className="disclaimer-note">
              <p>
                <strong>Disclaimer:</strong> This AI tool is designed for educational & routine guidance only. Consult a dermatologist for clinical skin conditions.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;