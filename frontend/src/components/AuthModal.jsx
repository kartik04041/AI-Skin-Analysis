import React, { useState } from "react";

export default function AuthModal({ authModal, onClose, onAuthSuccess, setAuthModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onAuthSuccess();
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <span className="brand-logo">✨</span>
        <h3>{authModal === "login" ? "Welcome Back" : "Create Account"}</h3>
        
        <form onSubmit={handleSubmit}>
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

          <button type="submit" className="action-btn full-width">
            {authModal === "login" ? "[ Login ]" : "[ Create Account ]"}
          </button>
        </form>

        <div className="auth-footer">
          {authModal === "login" ? (
            <>
              <p className="link-text">Forgot Password?</p>
              <p>Don't have an account? <span onClick={() => setAuthModal("signup")}>Create Account</span></p>
            </>
          ) : (
            <p>Already have an account? <span onClick={() => setAuthModal("login")}>Login</span></p>
          )}
        </div>
      </div>
    </div>
  );
}