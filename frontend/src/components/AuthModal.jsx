import React, { useState } from "react";


// =========================================================
// PYTHON API
// =========================================================

const API_BASE_URL =
  "http://127.0.0.1:5001";


export default function AuthModal({

  authModal,

  onClose,

  onAuthSuccess,

  setAuthModal

}) {


  // =======================================================
  // STATES
  // =======================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =======================================================
  // LOGIN / REGISTER
  // =======================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");

      setLoading(true);


      const endpoint =
        authModal === "login"

          ? "/api/login"

          : "/api/register";


      const payload =

        authModal === "login"

          ? {
              email,
              password
            }

          : {
              name,
              email,
              password
            };


      try {

        console.log(
          "🔐 Sending authentication request..."
        );


        const response =
          await fetch(

            `${API_BASE_URL}${endpoint}`,

            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify(
                  payload
                )

            }

          );


        const data =
          await response.json();


        console.log(
          "Authentication response:",
          data
        );


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(

            data.message ||
            "Authentication failed."

          );

        }


        // =================================================
        // SAVE JWT
        // =================================================

        localStorage.setItem(
          "token",
          data.token
        );


        // =================================================
        // SAVE USER
        // =================================================

        localStorage.setItem(

          "user",

          JSON.stringify(
            data.user
          )

        );


        // =================================================
        // SEND TO APP
        // =================================================

        if (onAuthSuccess) {

          onAuthSuccess({

            user:
              data.user,

            token:
              data.token

          });

        }


        // =================================================
        // CLEAR FORM
        // =================================================

        setEmail("");

        setPassword("");

        setName("");

        setError("");


        // =================================================
        // CLOSE MODAL
        // =================================================

        onClose();


      } catch (err) {

        console.error(
          "Authentication error:",
          err
        );


        setError(
          err.message ||
          "Something went wrong."
        );


      } finally {

        setLoading(false);

      }

    };


  // =======================================================
  // SWITCH LOGIN / SIGNUP
  // =======================================================

  const switchMode = (
    mode
  ) => {

    setError("");

    setAuthModal(mode);

  };


  // =======================================================
  // UI
  // =======================================================

  return (

    <div

      className="modal-overlay"

      onClick={onClose}

    >

      <div

        className="modal-card"

        onClick={(e) =>
          e.stopPropagation()
        }

      >


        {/* CLOSE */}

        <button

          className="close-btn"

          onClick={onClose}

          type="button"

        >

          ✕

        </button>


        {/* LOGO */}

        <span className="brand-logo">

          ✨

        </span>


        {/* TITLE */}

        <h3>

          {authModal === "login"

            ? "Welcome Back"

            : "Create Account"

          }

        </h3>


        {/* ERROR */}

        {error && (

          <div

            className="auth-error-msg"

            style={{

              color: "#d9534f",

              marginBottom:
                "10px",

              fontSize:
                "14px"

            }}

          >

            ⚠️ {error}

          </div>

        )}


        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
        >


          {/* NAME */}

          {authModal === "signup" && (

            <div className="form-group">

              <label>
                Full Name
              </label>

              <input

                type="text"

                required

                placeholder=
                  "e.g. Kartik Ghuge"

                value={name}

                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }

              />

            </div>

          )}


          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input

              type="email"

              required

              placeholder=
                "yourname@example.com"

              value={email}

              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }

            />

          </div>


          {/* PASSWORD */}

          <div className="form-group">

            <label>
              Password
            </label>

            <input

              type="password"

              required

              minLength={6}

              placeholder=
                "••••••••"

              value={password}

              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }

            />

          </div>


          {/* BUTTON */}

          <button

            type="submit"

            className=
              "action-btn full-width"

            disabled={loading}

          >

            {loading

              ? "Connecting..."

              : authModal === "login"

              ? "[ Login ]"

              : "[ Create Account ]"

            }

          </button>


        </form>


        {/* FOOTER */}

        <div className="auth-footer">


          {authModal === "login" ? (

            <>

              <p className="link-text">

                Forgot Password?

              </p>


              <p>

                Don't have an account?{" "}

                <span

                  onClick={() =>
                    switchMode(
                      "signup"
                    )
                  }

                  style={{
                    cursor:
                      "pointer"
                  }}

                >

                  Create Account

                </span>

              </p>

            </>

          ) : (

            <p>

              Already have an account?{" "}

              <span

                onClick={() =>
                  switchMode(
                    "login"
                  )
                }

                style={{
                  cursor:
                    "pointer"
                }}

              >

                Login

              </span>

            </p>

          )}


        </div>


      </div>

    </div>

  );

}