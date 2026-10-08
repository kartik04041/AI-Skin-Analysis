import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000";

const ADMIN_EMAIL = "email-admin@gmail.com";
const ADMIN_PASSWORD = "admin123";

// Old email accepted only so an old saved/admin UI does not cause confusion.
const OLD_ADMIN_EMAIL = "admin@gmail.com";

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

  // Automatically prepare the admin login form
  useEffect(() => {
    if (authModal === "admin") {
      setEmail(ADMIN_EMAIL);
      setPassword(ADMIN_PASSWORD);
      setName("");
      setError("");
    } else {
      setEmail("");
      setPassword("");
      setName("");
      setError("");
    }
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

    if (loading) {
      return;
    }

    setError("");

    // =====================================================
    // ADMIN LOGIN
    // =====================================================

    if (authModal === "admin") {
      const enteredEmail = email.trim().toLowerCase();
      const enteredPassword = password;

      const validAdminEmail =
        enteredEmail === ADMIN_EMAIL ||
        enteredEmail === OLD_ADMIN_EMAIL;

      const validAdminPassword =
        enteredPassword === ADMIN_PASSWORD;

      if (!validAdminEmail || !validAdminPassword) {
        setError("Invalid admin email or password.");
        return;
      }

      setLoading(true);

      const adminUser = {
        username: "admin",
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin",
        isAdmin: true,
      };

      /*
       * Frontend admin session.
       * AdminDashboard can use this to identify the admin.
       */
      const adminToken = "admin-fixed-token";

      // Clear old session
      localStorage.removeItem("glow_user");
      localStorage.removeItem("glow_token");
      localStorage.removeItem("isAdmin");

      // Save admin session
      localStorage.setItem(
        "glow_user",
        JSON.stringify(adminUser)
      );

      localStorage.setItem(
        "glow_token",
        adminToken
      );

      localStorage.setItem(
        "isAdmin",
        "true"
      );

      console.log("=================================");
      console.log("ADMIN LOGIN SUCCESS");
      console.log("EMAIL:", ADMIN_EMAIL);
      console.log("ROLE: admin");
      console.log("=================================");

      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);

      if (onAuthSuccess) {
        onAuthSuccess(
          adminUser,
          adminToken
        );
      }

      if (onClose) {
        onClose();
      }

      return;
    }

    // =====================================================
    // NORMAL USER LOGIN / SIGNUP
    // =====================================================

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

    if (authModal === "signup" && !cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    let endpoint = "/api/login";

    let payload = {
      email: cleanEmail,
      password: password,
    };

    if (authModal === "signup") {
      endpoint = "/api/register";

      payload = {
        name: cleanName,
        email: cleanEmail,
        password: password,
      };
    }

    setLoading(true);

    try {
      const response = await fetch(
        API_BASE_URL + endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "JSON parsing error:",
          jsonError
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Authentication failed."
        );
      }

      // ===================================================
      // SIGNUP
      // ===================================================

      if (authModal === "signup") {
        setEmail("");
        setPassword("");
        setName("");
        setError("");
        setLoading(false);

        alert(
          data.message ||
          "Account created successfully. Please login."
        );

        setAuthModal("login");
        return;
      }

      // ===================================================
      // NORMAL USER LOGIN
      // ===================================================

      const token =
        data.token ||
        data.access_token ||
        data.jwt;

      const serverUser =
        data.user ||
        data.data;

      if (!token) {
        throw new Error(
          "Login failed: server did not return a token."
        );
      }

      if (
        !serverUser ||
        typeof serverUser !== "object"
      ) {
        throw new Error(
          "Login failed: user information was not received."
        );
      }

      const normalUser = {
        ...serverUser,
        email:
          serverUser.email ||
          cleanEmail,
        name:
          serverUser.name ||
          serverUser.username ||
          "User",
        role: "user",
        isAdmin: false,
      };

      localStorage.setItem(
        "glow_user",
        JSON.stringify(normalUser)
      );

      localStorage.setItem(
        "glow_token",
        token
      );

      localStorage.setItem(
        "isAdmin",
        "false"
      );

      console.log(
        "NORMAL USER LOGIN SUCCESS"
      );

      if (onAuthSuccess) {
        onAuthSuccess(
          normalUser,
          token
        );
      }

      setEmail("");
      setPassword("");
      setName("");
      setError("");
      setLoading(false);

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error(
        "Authentication error:",
        err
      );

      setError(
        err.message ||
        "Unable to connect to server."
      );

      setLoading(false);
    }
  };

  // =====================================================
  // TEXT
  // =====================================================

  let title = "Welcome Back";
  let buttonText = "Login";

  if (authModal === "signup") {
    title = "Create Account";
    buttonText = "Create Account";
  }

  if (authModal === "admin") {
    title = "Admin Login";
    buttonText = "Admin Login";
  }

  if (loading) {
    buttonText = "Please wait...";
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          className="close-btn"
          type="button"
          onClick={onClose}
        >
          X
        </button>

        <span className="brand-logo">
          {authModal === "admin"
            ? "LOCK"
            : "SKIN"}
        </span>

        <h3>{title}</h3>

        {error && (
          <div
            className="auth-error-msg"
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

          {/* ADMIN EMAIL */}
          {authModal === "admin" && (
            <div className="form-group">
              <label>Admin Email</label>

              <input
                type="email"
                value={email}
                placeholder={ADMIN_EMAIL}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* USER NAME */}
          {authModal === "signup" && (
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                value={name}
                placeholder="Enter your full name"
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* USER EMAIL */}
          {authModal !== "admin" && (
            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                value={email}
                placeholder="yourname@example.com"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
                disabled={loading}
              />
            </div>
          )}

          {/* PASSWORD */}
          <div className="form-group">
            <label>Password</label>

            <input
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

        {/* FOOTER */}
        <div className="auth-footer">

          {authModal === "login" && (
            <>
              <p>
                Don't have an account?{" "}
                <span
                  onClick={() =>
                    switchMode("signup")
                  }
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
                  onClick={() =>
                    switchMode("admin")
                  }
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
                  onClick={() =>
                    switchMode("login")
                  }
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
                  onClick={() =>
                    switchMode("admin")
                  }
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
                onClick={() =>
                  switchMode("login")
                }
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