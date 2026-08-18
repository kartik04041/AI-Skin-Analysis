import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import AnalyzerWorkspace from "./components/AnalyzerWorkspace";
import { HowItWorks, AboutUs, AiModelInfo, Reviews } from "./components/InfoSections";
import AuthModal from "./components/AuthModal";
import HistoryModal from "./components/HistoryModal";
import { RECOMMENDATIONS } from "./data/recommendations";
import "./App.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([
    { date: "18 Aug 26", type: "Combination", confidence: "84.2%" },
    { date: "15 Aug 26", type: "Oily", confidence: "79.6%" },
    { date: "10 Aug 26", type: "Dry", confidence: "88.1%" }
  ]);

  const handleImageSelected = (file) => {
    setSelectedFile(file);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

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
        throw new Error(data.message || "Analysis failed.");
      }

      setAnalysis(data.analysis);

      const newEntry = {
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }),
        type: data.analysis.prediction,
        confidence: `${(data.analysis.confidence * 100).toFixed(1)}%`
      };
      setHistory((prev) => [newEntry, ...prev]);

    } catch (err) {
      setError(err.message || "Failed to reach AI server.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToAnalyzer = () => {
    document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" });
  };

  const recs = RECOMMENDATIONS[analysis?.prediction?.toLowerCase()];

  return (
    <div className="site-wrapper">
      <Navbar 
        isLoggedIn={isLoggedIn}
        onOpenAuth={(mode) => setAuthModal(mode)}
        onOpenHistory={() => setShowHistory(true)}
        onLogout={() => setIsLoggedIn(false)}
      />

      <HeroSection onAnalyzeClick={scrollToAnalyzer} />

      <AnalyzerWorkspace 
        selectedFile={selectedFile}
        loading={loading}
        analysis={analysis}
        error={error}
        recs={recs}
        onImageSelected={handleImageSelected}
        onAnalyze={handleAnalyze}
      />

      <HowItWorks />
      <AboutUs />
      <AiModelInfo />
      <Reviews />

      <footer className="footer">
        <p>© 2026 AI Skincare Assistant. Educational & cosmetic guidance tool only.</p>
      </footer>

      {authModal && (
        <AuthModal 
          authModal={authModal}
          setAuthModal={setAuthModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={() => {
            setIsLoggedIn(true);
            setAuthModal(null);
          }}
        />
      )}

      {showHistory && (
        <HistoryModal 
          history={history}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}