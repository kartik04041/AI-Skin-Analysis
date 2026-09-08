import React, { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:5001";

export default function AuthModal({ authModal, onClose, onAuthSuccess, setAuthModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = authModal === "login" ? "/api/login" : "/api/register";
    const payload = authModal === "login" 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      // Pass token and user details to App.jsx
      onAuthSuccess({
        user: data.user,
        token: data.token,
      });

      setEmail("");
      setPassword("");
      setName("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <span className="brand-logo">✨</span>
        <h3>{authModal === "login" ? "Welcome Back" : "Create Account"}</h3>

        {error && <div className="auth-error-msg" style={{ color: "#d9534f", marginBottom: "10px", fontSize: "14px" }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {authModal === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Bella Rose"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="action-btn full-width" disabled={loading}>
            {loading ? "Connecting..." : authModal === "login" ? "[ Login ]" : "[ Create Account ]"}
          </button>
        </form>

        <div className="auth-footer">
          {authModal === "login" ? (
            <>
              <p className="link-text">Forgot Password?</p>
              <p>Don't have an account? <span onClick={() => { setError(""); setAuthModal("signup"); }}>Create Account</span></p>
            </>
          ) : (
            <p>Already have an account? <span onClick={() => { setError(""); setAuthModal("login"); }}>Login</span></p>
          )}
        </div>
      </div>
    </div>
  );
}