import React, { useState } from "react";
import SkinImageInput from "./SkinImageInput";

export default function AnalyzerWorkspace({ 
  selectedFile, 
  loading, 
  analysis, 
  error, 
  recs, 
  onImageSelected, 
  onAnalyze 
}) {
  const [routineTab, setRoutineTab] = useState("am");

  return (
    <section id="analyzer" className="analyzer-workspace">
      <div className="workspace-grid">
        
        {/* COLUMN 1: SKIN IMAGE */}
        <div className="card-col">
          <div className="card-header">
            <span className="col-icon">📷</span>
            <h3>SKIN IMAGE</h3>
          </div>
          <SkinImageInput onImageSelected={onImageSelected} />
          {selectedFile && !loading && (
            <button className="action-btn" onClick={onAnalyze}>
              [ ANALYZE ]
            </button>
          )}
          {loading && <div className="spinner-text">⏳ Processing neural net...</div>}
          {error && <div className="error-box">⚠️ {error}</div>}
        </div>

        {/* COLUMN 2: AI ANALYSIS */}
        <div className="card-col">
          <div className="card-header">
            <span className="col-icon">🤖</span>
            <h3>AI ANALYSIS</h3>
          </div>
          {analysis ? (
            <div className="analysis-results">
              <div className="top-result">
                <span className="res-label">Detected Skin Type</span>
                <h2 className="res-value">{analysis.prediction.toUpperCase()}</h2>
                <span className="res-confidence">
                  Confidence: {(analysis.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="probability-breakdown">
                <h4>Probability Metrics</h4>
                {Object.entries(analysis.probabilities || {}).map(([key, value]) => {
                  const pct = (value * 100).toFixed(1);
                  return (
                    <div key={key} className="prob-item">
                      <div className="prob-info">
                        <span>{key.toUpperCase()}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-placeholder">
              <p>Upload a skin image and click Analyze to view detection breakdown.</p>
            </div>
          )}
        </div>

        {/* COLUMN 3: RECOMMENDATION */}
        <div className="card-col">
          <div className="card-header">
            <span className="col-icon">💡</span>
            <h3>RECOMMENDATION</h3>
          </div>
          {recs ? (
            <div className="recs-content">
              <h4>{recs.title}</h4>
              
              <div className="rec-section">
                <span className="subhead">Target Ingredients:</span>
                <div className="tags-flex">
                  {recs.ingredients.map((ing, i) => (
                    <span key={i} className="tag-pill">{ing}</span>
                  ))}
                </div>
              </div>

              <div className="routine-toggle">
                <button 
                  className={routineTab === "am" ? "active" : ""} 
                  onClick={() => setRoutineTab("am")}
                >☀️ AM Routine</button>
                <button 
                  className={routineTab === "pm" ? "active" : ""} 
                  onClick={() => setRoutineTab("pm")}
                >🌙 PM Routine</button>
              </div>

              <ul className="routine-steps">
                {(routineTab === "am" ? recs.amRoutine : recs.pmRoutine).map((step, idx) => (
                  <li key={idx}><strong>Step {idx + 1}:</strong> {step}</li>
                ))}
              </ul>

              <div className="avoid-card">
                <strong>⚠️ Avoid:</strong> {recs.avoid}
              </div>
            </div>
          ) : (
            <div className="empty-placeholder">
              <p>Targeted ingredient lists and routines will appear after analysis.</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}