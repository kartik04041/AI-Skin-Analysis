
import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000";

const ADMIN_EMAIL = "email-admin@gmail.com";
const ADMIN_PASSWORD = "admin123";

export default function AuthModal({
  authModal,
  onClose,
  onAuthSuccess,
  setAuthModal,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authModal === "admin") {
      setEmail(ADMIN_EMAIL);
      setPassword(ADMIN_PASSWORD);
    } else {
      setEmail("");
      setPassword("");
    }

    setName("");
    setError("");
    setLoading(false);
  }, [authModal]);

  const switchMode = (mode) => {
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setAuthModal(mode);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const isAdminLogin = authModal === "admin";
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (isAdminLogin) {
      if (cleanEmail !== ADMIN_EMAIL) {
        setError("Invalid admin email.");
        return;
      }

      if (password !== ADMIN_PASSWORD) {
        setError("Invalid admin password.");
        return;
      }
    }

    if (authModal === "signup") {
      if (!cleanName) {
        setError("Please enter your full name.");
        return;
      }

      if (password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }
    }

const endpoint =
  authModal === "signup"
    ? "/api/register"
    : authModal === "admin"
      ? "/api/admin/login"
      : "/api/login";

    const payload =
      authModal === "signup"
        ? {
            name: cleanName,
            email: cleanEmail,
            password,
          }
        : {
            email: cleanEmail,
            password,
          };

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Authentication failed (${response.status}).`
        );
      }

      // Signup: return to normal login.
      if (authModal === "signup") {
        setEmail("");
        setPassword("");
        setName("");
        setAuthModal("login");

        alert(data.message || "Account created successfully. Please log in.");
        return;
      }

      // Accept common JWT response property names.
      const token =
        data.token ||
        data.accessToken ||
        data.access_token ||
        data.jwt;

      const serverUser =
        data.user ||
        data.admin ||
        (data.data && typeof data.data === "object"
          ? data.data
          : null);

      // Never create a fake token.
      if (typeof token !== "string" || !token.trim()) {
        throw new Error(
          "The server did not return a JWT token. Check the backend /api/login response."
        );
      }

      const adminFromServer =
        isAdminLogin ||
        serverUser?.role === "admin" ||
        serverUser?.isAdmin === true;

      if (isAdminLogin && !adminFromServer) {
        throw new Error(
          "The server did not identify this account as an administrator."
        );
      }

      if (!isAdminLogin && !serverUser) {
        throw new Error("The server did not return user information.");
      }

      const authenticatedUser = {
        ...(serverUser || {}),
        email: serverUser?.email || cleanEmail,
        name:
          serverUser?.name ||
          serverUser?.username ||
          (isAdminLogin ? "Administrator" : "User"),
        role: adminFromServer ? "admin" : "user",
        isAdmin: adminFromServer,
      };

      // Persist the real server-issued JWT and user session.
      localStorage.setItem(
        "glow_user",
        JSON.stringify(authenticatedUser)
      );
      localStorage.setItem("glow_token", token);
      localStorage.setItem(
        "isAdmin",
        adminFromServer ? "true" : "false"
      );

      console.log(
        adminFromServer ? "ADMIN LOGIN SUCCESS" : "NORMAL USER LOGIN SUCCESS",
        {
          email: authenticatedUser.email,
          role: authenticatedUser.role,
          tokenReceived: true,
        }
      );

      // App.js should accept (user, token).
      if (typeof onAuthSuccess === "function") {
        onAuthSuccess(authenticatedUser, token);
      }

      setEmail("");
      setPassword("");
      setName("");
      setError("");

      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  let title = "Welcome Back";
  let buttonText = "Login";

  if (authModal === "signup") {
    title = "Create Account";
    buttonText = "Create Account";
  } else if (authModal === "admin") {
    title = "Admin Login";
    buttonText = "Admin Login";
  }

  if (loading) {
    buttonText = "Please wait...";
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="close-btn"
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close login modal"
        >
          X
        </button>

        <span className="brand-logo">
          {authModal === "admin" ? "LOCK" : "SKIN"}
        </span>

        <h3>{title}</h3>

        {error && (
          <div
            className="auth-error-msg"
            role="alert"
            style={{
              color: "#d9534f",
              background: "#fff1f0",
              border: "1px solid #ffcccc",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {authModal === "signup" && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                placeholder="Enter your full name"
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">
              {authModal === "admin" ? "Admin Email" : "Email"}
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              placeholder={
                authModal === "admin"
                  ? ADMIN_EMAIL
                  : "yourname@example.com"
              }
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
              minLength={6}
              disabled={loading}
              autoComplete={
                authModal === "signup"
                  ? "new-password"
                  : "current-password"
              }
            />
          </div>

          <button
            type="submit"
            className="action-btn full-width"
            disabled={loading}
          >
            {buttonText}
          </button>
        </form>

        <div className="auth-footer">
          {authModal === "login" && (
            <>
              <p>
                Don't have an account?{" "}
                <span
                  onClick={() => switchMode("signup")}
                  style={{
                    cursor: "pointer",
                    color: "#6c63ff",
                    fontWeight: "600",
                  }}
                >
                  Create Account
                </span>
              </p>

              <p>
                <span
                  onClick={() => switchMode("admin")}
                  style={{
                    cursor: "pointer",
                    color: "#6c63ff",
                    fontWeight: "600",
                  }}
                >
                  Admin Login
                </span>
              </p>
            </>
          )}

          {authModal === "signup" && (
            <>
              <p>
                Already have an account?{" "}
                <span
                  onClick={() => switchMode("login")}
                  style={{
                    cursor: "pointer",
                    color: "#6c63ff",
                    fontWeight: "600",
                  }}
                >
                  Login
                </span>
              </p>

              <p>
                <span
                  onClick={() => switchMode("admin")}
                  style={{
                    cursor: "pointer",
                    color: "#6c63ff",
                    fontWeight: "600",
                  }}
                >
                  Admin Login
                </span>
              </p>
            </>
          )}

          {authModal === "admin" && (
            <p>
              Regular user?{" "}
              <span
                onClick={() => switchMode("login")}
                style={{
                  cursor: "pointer",
                  color: "#6c63ff",
                  fontWeight: "600",
                }}
              >
                User Login
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
