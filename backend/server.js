// =========================================================
// AI SKINCARE NODE BACKEND
// server.js
// =========================================================

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const app = express();

// =========================================================
// CONFIG
// =========================================================

const PORT = 5000;

const PYTHON_URL = "http://127.0.0.1:5001";

const MONGO_URI =
  "mongodb://127.0.0.1:27017/skin_analysis_db";

const SECRET_KEY =
  "glowai_super_secret_jwt_key_2026";

const ADMIN_EMAIL =
  "email-admin@gmail.com";

const ADMIN_PASSWORD =
  "admin123";

const ADMIN_TOKEN =
  "admin-fixed-token";

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =========================================================
// UPLOAD DIRECTORY
// =========================================================

const uploadDir = path.join(
  __dirname,
  "uploads"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// =========================================================
// MULTER
// =========================================================

const storage =
  multer.diskStorage({
    destination: function (
      req,
      file,
      cb
    ) {
      cb(null, uploadDir);
    },

    filename: function (
      req,
      file,
      cb
    ) {
      const extension =
        path.extname(
          file.originalname
        ) || ".jpg";

      const filename =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${extension}`;

      cb(null, filename);
    },
  });

const fileFilter =
  function (
    req,
    file,
    cb
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed."
        )
      );
    }
  };

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },
  });

// =========================================================
// BASIC ROUTE
// =========================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "AI Skincare Backend is running!",
    });
  }
);

// =========================================================
// HEALTH
// =========================================================

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,

      status: "online",

      node: "running",

      python: PYTHON_URL,

      mongodb:
        mongoose.connection
          .readyState === 1
          ? "connected"
          : "disconnected",
    });
  }
);

// =========================================================
// MONGODB
// =========================================================

mongoose
  .connect(
    MONGO_URI,
    {
      serverSelectionTimeoutMS: 5000,
    }
  )
  .then(() => {
    console.log(
      "========================================"
    );

    console.log(
      "✅ MongoDB connected"
    );

    console.log(
      "📦 Database: skin_analysis_db"
    );

    console.log(
      "========================================"
    );
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB connection error:"
    );

    console.error(
      error.message
    );
  });

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "❌ MongoDB error:",
      error.message
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.log(
      "⚠️ MongoDB disconnected"
    );
  }
);

// =========================================================
// USER MODEL
// =========================================================

const userSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      password: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

const User =
  mongoose.model(
    "User",
    userSchema
  );

// =========================================================
// REVIEW MODEL
// =========================================================

const reviewSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      user: {
        type: String,

        default:
          "Anonymous",
      },

      text: {
        type: String,

        required: true,

        trim: true,
      },

      rating: {
        type: Number,

        default: 5,

        min: 1,

        max: 5,
      },
    },
    {
      timestamps: true,
    }
  );

const Review =
  mongoose.model(
    "Review",
    reviewSchema
  );

// =========================================================
// SCAN MODEL
// =========================================================

const scanSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      userEmail: {
        type: String,

        default: "",
      },

      analysis: {
        type:
          mongoose.Schema.Types.Mixed,

        default: {},
      },

      result: {
        type:
          mongoose.Schema.Types.Mixed,

        default: {},
      },

      prediction: {
        type: String,

        default: "",
      },

      label: {
        type: String,

        default: "",
      },

      concern: {
        type: String,

        default: "",
      },

      images: {
        type:
          mongoose.Schema.Types.Mixed,

        default: {},
      },

      userData: {
        type:
          mongoose.Schema.Types.Mixed,

        default: {},
      },
    },

    {
      timestamps: true,

      strict: false,
    }
  );

const Scan =
  mongoose.model(
    "Scan",
    scanSchema,
    "scans"
  );

// =========================================================
// USER AUTHENTICATION
// =========================================================

function authenticateToken(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith(
      "Bearer "
    )
  ) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Authorization token required.",
      });
  }

  const token =
    authHeader
      .substring(7)
      .trim();

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Invalid authorization token.",
      });
  }

  // Never allow the fixed admin token
  // to access normal user routes.
  if (
    token === ADMIN_TOKEN
  ) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Admin token cannot be used for normal user operations.",
      });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        SECRET_KEY
      );

    if (
      !decoded.user_id
    ) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid user token.",
        });
    }

    req.userId =
      decoded.user_id;

    req.user =
      decoded;

    // =====================================================
    // IMPORTANT FIX
    // Keep the original JWT so it can be sent to Python.
    // =====================================================

    req.token =
      token;

    next();
  } catch (error) {
    console.error(
      "JWT authentication error:",
      error.message
    );

    return res
      .status(401)
      .json({
        success: false,

        message:
          "Invalid or expired token.",
      });
  }
}

// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

function authenticateAdmin(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith(
      "Bearer "
    )
  ) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Admin authorization required.",
      });
  }

  const token =
    authHeader
      .substring(7)
      .trim();

  // Fixed admin token
  if (
    token === ADMIN_TOKEN
  ) {
    req.isAdmin = true;

    req.adminEmail =
      ADMIN_EMAIL;

    req.user = {
      email:
        ADMIN_EMAIL,

      role: "admin",

      isAdmin: true,
    };

    return next();
  }

  try {
    const decoded =
      jwt.verify(
        token,
        SECRET_KEY
      );

    if (
      decoded.role !==
        "admin" ||
      decoded.email !==
        ADMIN_EMAIL
    ) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            "Admin access required.",
        });
    }

    req.isAdmin = true;

    req.adminEmail =
      ADMIN_EMAIL;

    req.userId =
      decoded.user_id;

    req.user =
      decoded;

    req.token =
      token;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,

        message:
          "Invalid or expired admin token.",
      });
  }
}

// =========================================================
// REGISTER
// =========================================================

app.post(
  "/api/register",
  async (
    req,
    res
  ) => {
    try {
      const {
        name,
        username,
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Email and password are required.",
          });
      }

      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();

      if (
        cleanEmail ===
        ADMIN_EMAIL
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "This email is reserved for administrator login.",
          });
      }

      if (
        String(password).length <
        6
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Password must contain at least 6 characters.",
          });
      }

      const existingUser =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (
        existingUser
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "User already exists.",
          });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const displayName =
        String(
          name ||
          username ||
          "User"
        ).trim();

      const newUser =
        new User({
          name:
            displayName,

          email:
            cleanEmail,

          password:
            hashedPassword,
        });

      await newUser.save();

      const token =
        jwt.sign(
          {
            user_id:
              newUser._id.toString(),

            email:
              newUser.email,

            role: "user",
          },

          SECRET_KEY,

          {
            expiresIn:
              "7d",
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Registration successful.",

          token,

          user: {
            id:
              newUser._id,

            _id:
              newUser._id,

            username:
              displayName,

            name:
              displayName,

            email:
              newUser.email,

            role: "user",

            isAdmin: false,

            createdAt:
              newUser.createdAt,
          },
        });
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Registration failed.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// USER LOGIN
// =========================================================

app.post(
  "/api/login",
  async (
    req,
    res
  ) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Email and password are required.",
          });
      }

      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();

      // Admin must use admin login
      if (
        cleanEmail ===
        ADMIN_EMAIL
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Please use the Admin Login option.",
          });
      }

      const user =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid email or password.",
          });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (
        !passwordMatch
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid email or password.",
          });
      }

      const token =
        jwt.sign(
          {
            user_id:
              user._id.toString(),

            email:
              user.email,

            role: "user",
          },

          SECRET_KEY,

          {
            expiresIn:
              "7d",
          }
        );

      return res.json({
        success: true,

        message:
          "Login successful.",

        token,

        user: {
          id:
            user._id,

          _id:
            user._id,

          username:
            user.name ||
            "User",

          name:
            user.name ||
            "User",

          email:
            user.email,

          role: "user",

          isAdmin: false,

          createdAt:
            user.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Login failed.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// ADMIN LOGIN
// =========================================================

app.post(
  "/api/admin/login",
  (req, res) => {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Admin email and password are required.",
        });
    }

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    if (
      cleanEmail !==
        ADMIN_EMAIL ||
      password !==
        ADMIN_PASSWORD
    ) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Invalid admin credentials.",
        });
    }

    const token =
      jwt.sign(
        {
          user_id: "admin",

          email:
            ADMIN_EMAIL,

          role: "admin",

          isAdmin: true,
        },

        SECRET_KEY,

        {
          expiresIn:
            "7d",
        }
      );

    return res.json({
      success: true,

      message:
        "Admin login successful.",

      token,

      user: {
        username: "admin",

        name:
          "Administrator",

        email:
          ADMIN_EMAIL,

        role: "admin",

        isAdmin: true,
      },
    });
  }
);

// =========================================================
// UPLOAD + PYTHON AI ANALYSIS
// =========================================================

app.post(
  "/api/upload",

  authenticateToken,

  upload.fields([
    {
      name: "front",
      maxCount: 1,
    },

    {
      name: "left",
      maxCount: 1,
    },

    {
      name: "right",
      maxCount: 1,
    },
  ]),

  async (
    req,
    res
  ) => {
    const uploadedFiles =
      [];

    try {
      console.log(
        "========================================"
      );

      console.log(
        "📸 NEW SKIN ANALYSIS"
      );

      console.log(
        "User:",
        req.userId
      );

      console.log(
        "Email:",
        req.user?.email
      );

      console.log(
        "Token available:",
        !!req.token
      );

      console.log(
        "Files:",
        Object.keys(
          req.files || {}
        )
      );

      console.log(
        "========================================"
      );

      // =====================================================
      // CHECK MONGODB
      // =====================================================

      if (
        mongoose.connection
          .readyState !== 1
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "MongoDB is not connected. Please start MongoDB.",
          });
      }

      // =====================================================
      // CREATE PYTHON FORM DATA
      // =====================================================

      const formData =
        new FormData();

      // =====================================================
      // FRONT IMAGE
      // =====================================================

      if (
        req.files?.front?.[0]
      ) {
        const file =
          req.files.front[0];

        uploadedFiles.push(
          file.path
        );

        formData.append(
          "front",

          fs.createReadStream(
            file.path
          )
        );
      }

      // =====================================================
      // LEFT IMAGE
      // =====================================================

      if (
        req.files?.left?.[0]
      ) {
        const file =
          req.files.left[0];

        uploadedFiles.push(
          file.path
        );

        formData.append(
          "left",

          fs.createReadStream(
            file.path
          )
        );
      }

      // =====================================================
      // RIGHT IMAGE
      // =====================================================

      if (
        req.files?.right?.[0]
      ) {
        const file =
          req.files.right[0];

        uploadedFiles.push(
          file.path
        );

        formData.append(
          "right",

          fs.createReadStream(
            file.path
          )
        );
      }

      // =====================================================
      // IMAGE REQUIRED
      // =====================================================

      if (
        uploadedFiles.length ===
        0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please upload at least one image.",
          });
      }

      // =====================================================
      // USER DATA
      // =====================================================

      const userDataFields =
        [
          "gender",
          "age",
          "sleep",
          "concern",
          "secondaryConcern",
          "sensitivity",
          "waterIntake",
          "climate",
          "lighting",
        ];

      userDataFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            formData.append(
              field,

              String(
                req.body[field]
              )
            );
          }
        }
      );

      // =====================================================
      // USER ID
      // =====================================================

      formData.append(
        "user_id",
        String(
          req.userId
        )
      );

      // =====================================================
      // SEND TO PYTHON
      // =====================================================

      console.log(
        "🤖 Sending authenticated request to Python..."
      );

      console.log(
        "Python endpoint:",
        `${PYTHON_URL}/predict`
      );

      console.log(
        "JWT forwarded:",
        !!req.token
      );

      const pythonResponse =
        await axios.post(
          `${PYTHON_URL}/predict`,

          formData,

          {
            headers: {
              ...formData.getHeaders(),

              // =================================================
              // CRITICAL AUTH FIX
              // =================================================

              Authorization:
                `Bearer ${req.token}`,

              "X-User-ID":
                String(
                  req.userId
                ),
            },

            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,

            timeout:
              120000,

            // We handle Python HTTP
            // errors ourselves.
            validateStatus:
              () => true,
          }
        );

      // =====================================================
      // PYTHON RESPONSE
      // =====================================================

      console.log(
        "========================================"
      );

      console.log(
        "PYTHON STATUS:",
        pythonResponse.status
      );

      console.log(
        "PYTHON RESPONSE:",
        pythonResponse.data
      );

      console.log(
        "========================================"
      );

      // =====================================================
      // PYTHON AUTH ERROR
      // =====================================================

      if (
        pythonResponse.status ===
        401
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "AI service rejected authentication. Please restart the Python AI service and try again.",

            error:
              pythonResponse.data
                ?.message ||
              "Python AI service returned 401.",
          });
      }

      // =====================================================
      // PYTHON FORBIDDEN
      // =====================================================

      if (
        pythonResponse.status ===
        403
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              pythonResponse.data
                ?.message ||
              "AI service denied the scan.",

            error:
              pythonResponse.data,
          });
      }

      // =====================================================
      // PYTHON SERVER ERROR
      // =====================================================

      if (
        pythonResponse.status <
          200 ||
        pythonResponse.status >=
          300
      ) {
        return res
          .status(502)
          .json({
            success: false,

            message:
              pythonResponse.data
                ?.message ||
              "Python AI service failed to process the image.",

            error:
              pythonResponse.data,
          });
      }

      const aiData =
        pythonResponse.data;

      // =====================================================
      // CHECK AI RESPONSE
      // =====================================================

      if (
        !aiData ||
        aiData.success ===
          false
      ) {
        return res
          .status(500)
          .json({
            success: false,

            message:
              aiData?.message ||
              "AI analysis failed.",

            error:
              aiData,
          });
      }

      // =====================================================
      // EXTRACT PREDICTION
      // =====================================================

      const prediction =
        aiData?.prediction ||
        aiData?.label ||
        aiData?.class ||
        aiData?.type ||
        aiData?.result
          ?.prediction ||
        aiData?.result
          ?.label ||
        "";

      // =====================================================
      // EXTRACT CONFIDENCE
      // =====================================================

      const confidence =
        aiData?.confidence ??
        aiData?.confidence_score ??
        aiData?.probability ??
        aiData?.result
          ?.confidence ??
        aiData?.result
          ?.confidence_score ??
        0;

      // =====================================================
      // EXTRACT CONCERN
      // =====================================================

      const concern =
        aiData?.concern ||
        aiData?.result
          ?.concern ||
        prediction ||
        req.body.concern ||
        "";

      // =====================================================
      // FIND CURRENT USER
      // =====================================================

      const currentUser =
        await User.findById(
          req.userId
        );

      if (
        !currentUser
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "User account no longer exists. Please login again.",
          });
      }

      // =====================================================
      // SAVE SCAN
      // =====================================================

      const scan =
        new Scan({
          userId:
            req.userId,

          userEmail:
            currentUser.email ||
            "",

          analysis:
            aiData,

          result:
            aiData,

          prediction:
            String(
              prediction || ""
            ),

          label:
            String(
              aiData?.label ||
              prediction ||
              ""
            ),

          concern:
            String(
              concern || ""
            ),

          userData:
            req.body,

          images: {
            front:
              !!req.files
                ?.front?.[0],

            left:
              !!req.files
                ?.left?.[0],

            right:
              !!req.files
                ?.right?.[0],
          },
        });

      await scan.save();

      // =====================================================
      // SUCCESS LOG
      // =====================================================

      console.log(
        "========================================"
      );

      console.log(
        "✅ SCAN SAVED SUCCESSFULLY"
      );

      console.log(
        "SCAN ID:",
        scan._id
      );

      console.log(
        "USER ID:",
        req.userId
      );

      console.log(
        "PREDICTION:",
        prediction
      );

      console.log(
        "CONFIDENCE:",
        confidence
      );

      console.log(
        "========================================"
      );

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({
        success: true,

        message:
          "Skin analysis completed successfully.",

        analysis:
          aiData,

        historyItem: {
          _id:
            scan._id,

          id:
            scan._id,

          userId:
            scan.userId,

          userEmail:
            scan.userEmail,

          prediction:
            String(
              prediction || ""
            ),

          label:
            String(
              aiData?.label ||
              prediction ||
              ""
            ),

          type:
            String(
              prediction || ""
            ),

          concern:
            String(
              concern || ""
            ),

          confidence:
            confidence,

          water:
            req.body
              .waterIntake ||
            "",

          waterIntake:
            req.body
              .waterIntake ||
            "",

          hydration:
            req.body
              .waterIntake ||
            "",

          climate:
            req.body
              .climate ||
            "",

          userData:
            req.body,

          analysis:
            aiData,

          result:
            aiData,

          createdAt:
            scan.createdAt,

          updatedAt:
            scan.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "========================================"
      );

      console.error(
        "❌ ANALYSIS ERROR"
      );

      console.error(
        error
      );

      if (
        error.response
      ) {
        console.error(
          "Python status:",
          error.response.status
        );

        console.error(
          "Python response:",
          error.response.data
        );
      }

      console.error(
        "========================================"
      );

      // =====================================================
      // PYTHON AUTH ERROR
      // =====================================================

      if (
        error.response
          ?.status === 401
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              error.response
                ?.data
                ?.message ||
              "AI service authentication failed.",

            error:
              "Python service rejected the JWT.",
          });
      }

      // =====================================================
      // PYTHON NOT RUNNING
      // =====================================================

      if (
        error.code ===
        "ECONNREFUSED"
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "Python AI service is not running on port 5001.",

            error:
              error.message,
          });
      }

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.response
              ?.data
              ?.message ||
            "Failed to process skin analysis.",

          error:
            error.message,
        });
    } finally {
      // =====================================================
      // DELETE TEMPORARY FILES
      // =====================================================

      uploadedFiles.forEach(
        (filePath) => {
          try {
            if (
              fs.existsSync(
                filePath
              )
            ) {
              fs.unlinkSync(
                filePath
              );
            }
          } catch (
            deleteError
          ) {
            console.error(
              "Cleanup error:",
              deleteError.message
            );
          }
        }
      );
    }
  }
);

// =========================================================
// PUBLIC REVIEWS
// =========================================================

app.get(
  "/api/reviews",
  async (
    req,
    res
  ) => {
    try {
      if (
        mongoose.connection
          .readyState !== 1
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "MongoDB is not connected.",
          });
      }

      const reviews =
        await Review.find()
          .sort({
            createdAt: -1,
          })
          .limit(100)
          .lean();

      return res.json({
        success: true,

        reviews,
      });
    } catch (error) {
      console.error(
        "Reviews error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch reviews.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// ADD REVIEW
// =========================================================

app.post(
  "/api/reviews",

  authenticateToken,

  async (
    req,
    res
  ) => {
    try {
      const {
        text,
        rating,
      } = req.body;

      if (
        !text ||
        !String(text).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Review text is required.",
          });
      }

      const currentUser =
        await User.findById(
          req.userId
        );

      if (
        !currentUser
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "User account not found.",
          });
      }

      const cleanRating =
        Math.min(
          Math.max(
            Number(
              rating
            ) || 5,

            1
          ),

          5
        );

      const newReview =
        new Review({
          userId:
            req.userId,

          user:
            currentUser.name ||
            currentUser.email ||
            "Anonymous",

          text:
            String(
              text
            ).trim(),

          rating:
            cleanRating,
        });

      await newReview.save();

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Review submitted successfully.",

          review:
            newReview,
        });
    } catch (error) {
      console.error(
        "Review submission error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to submit review.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// DELETE REVIEW
// =========================================================

app.delete(
  "/api/reviews/:id",

  authenticateAdmin,

  async (
    req,
    res
  ) => {
    try {
      const deletedReview =
        await Review.findByIdAndDelete(
          req.params.id
        );

      if (
        !deletedReview
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Review not found.",
          });
      }

      return res.json({
        success: true,

        message:
          "Review deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to delete review.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// USER HISTORY
// =========================================================

app.get(
  "/api/history",

  authenticateToken,

  async (
    req,
    res
  ) => {
    try {
      console.log(
        "========================================"
      );

      console.log(
        "📚 HISTORY REQUEST"
      );

      console.log(
        "USER ID:",
        req.userId
      );

      console.log(
        "========================================"
      );

      if (
        mongoose.connection
          .readyState !== 1
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "MongoDB is not connected.",
          });
      }

      let userObjectId;

      try {
        userObjectId =
          new mongoose.Types.ObjectId(
            req.userId
          );
      } catch (error) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid user ID.",
          });
      }

      const scans =
        await Scan.find({
          userId:
            userObjectId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(100)
          .lean();

      const history =
        scans.map(
          (scan) => {
            const analysis =
              scan.analysis &&
              typeof scan.analysis ===
                "object"
                ? scan.analysis
                : {};

            const result =
              scan.result &&
              typeof scan.result ===
                "object"
                ? scan.result
                : {};

            const prediction =
              scan.prediction ||
              scan.label ||
              analysis.prediction ||
              analysis.label ||
              analysis.class ||
              analysis.type ||
              result.prediction ||
              result.label ||
              result.class ||
              result.type ||
              "";

            const confidence =
              scan.confidence ??
              analysis.confidence ??
              analysis.confidence_score ??
              analysis.probability ??
              result.confidence ??
              result.confidence_score ??
              0;

            const concern =
              scan.concern ||
              analysis.concern ||
              result.concern ||
              prediction ||
              "";

            const water =
              scan.userData
                ?.waterIntake ||
              scan.userData
                ?.water ||
              analysis.waterIntake ||
              analysis.water ||
              "";

            const climate =
              scan.userData
                ?.climate ||
              analysis.climate ||
              "";

            return {
              _id:
                scan._id,

              id:
                scan._id,

              userId:
                scan.userId,

              userEmail:
                scan.userEmail,

              type:
                prediction,

              prediction:
                prediction,

              label:
                scan.label ||
                prediction,

              concern:
                concern,

              confidence:
                confidence,

              water:
                water,

              waterIntake:
                water,

              hydration:
                water,

              climate:
                climate,

              analysis:
                analysis,

              result:
                result,

              userData:
                scan.userData ||
                {},

              createdAt:
                scan.createdAt,

              updatedAt:
                scan.updatedAt,
            };
          }
        );

      console.log(
        `✅ Found ${history.length} scans for user ${req.userId}`
      );

      return res.json({
        success: true,

        count:
          history.length,

        history,
      });
    } catch (error) {
      console.error(
        "History error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch history.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// USER PROFILE
// =========================================================

app.get(
  "/api/profile",

  authenticateToken,

  async (
    req,
    res
  ) => {
    try {
      const user =
        await User.findById(
          req.userId
        )
          .select(
            "-password"
          )
          .lean();

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "User not found.",
          });
      }

      return res.json({
        success: true,

        user: {
          id:
            user._id,

          _id:
            user._id,

          username:
            user.name ||
            "User",

          name:
            user.name ||
            "User",

          email:
            user.email,

          role:
            "user",

          isAdmin:
            false,

          createdAt:
            user.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch profile.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// ADMIN STATS
// =========================================================

app.get(
  "/api/admin/stats",

  authenticateAdmin,

  async (
    req,
    res
  ) => {
    try {
      if (
        mongoose.connection
          .readyState !== 1
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "MongoDB is not connected.",
          });
      }

      const now =
        new Date();

      const startOfToday =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const startOfSevenDaysAgo =
        new Date(
          now.getTime() -
          6 *
            24 *
            60 *
            60 *
            1000
        );

      const [
        totalUsers,
        totalScans,
        totalReviews,
        todayUsers,
        todayScans,
      ] =
        await Promise.all([
          User.countDocuments(),

          Scan.countDocuments(),

          Review.countDocuments(),

          User.countDocuments({
            createdAt: {
              $gte:
                startOfToday,
            },
          }),

          Scan.countDocuments({
            createdAt: {
              $gte:
                startOfToday,
            },
          }),
        ]);

      // =====================================================
      // USER GROWTH
      // =====================================================

      const userGrowthRaw =
        await User.aggregate([
          {
            $match: {
              createdAt: {
                $gte:
                  startOfSevenDaysAgo,
              },
            },
          },

          {
            $group: {
              _id: {
                $dateToString: {
                  format:
                    "%Y-%m-%d",

                  date:
                    "$createdAt",
                },
              },

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);

      // =====================================================
      // SCAN TREND
      // =====================================================

      const scanTrendRaw =
        await Scan.aggregate([
          {
            $match: {
              createdAt: {
                $gte:
                  startOfSevenDaysAgo,
              },
            },
          },

          {
            $group: {
              _id: {
                $dateToString: {
                  format:
                    "%Y-%m-%d",

                  date:
                    "$createdAt",
                },
              },

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },
        ]);

      // =====================================================
      // SEVEN DAY ARRAY
      // =====================================================

      const makeSevenDayArray =
        (rawData) => {
          const output = [];

          for (
            let i = 6;
            i >= 0;
            i--
          ) {
            const date =
              new Date(
                now.getTime() -
                  i *
                    24 *
                    60 *
                    60 *
                    1000
              );

            const dateString =
              date
                .toISOString()
                .split(
                  "T"
                )[0];

            const found =
              rawData.find(
                (item) =>
                  item._id ===
                  dateString
              );

            output.push({
              label:
                date.toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",

                    month:
                      "short",
                  }
                ),

              count:
                found?.count ||
                0,
            });
          }

          return output;
        };

      const userGrowth =
        makeSevenDayArray(
          userGrowthRaw
        );

      const scanTrend =
        makeSevenDayArray(
          scanTrendRaw
        );

      // =====================================================
      // POPULAR CONCERNS
      // =====================================================

      const popularConcerns =
        await Scan.aggregate([
          {
            $match: {
              concern: {
                $exists: true,

                $ne: "",
              },
            },
          },

          {
            $group: {
              _id:
                "$concern",

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },

          {
            $limit: 5,
          },
        ]);

      // =====================================================
      // RECENT USERS
      // =====================================================

      const recentUsers =
        await User.find()
          .select(
            "-password"
          )
          .sort({
            createdAt: -1,
          })
          .limit(8)
          .lean();

      // =====================================================
      // AVERAGE RATING
      // =====================================================

      let avgRating = 0;

      if (
        totalReviews > 0
      ) {
        const ratingResult =
          await Review.aggregate([
            {
              $group: {
                _id: null,

                average: {
                  $avg:
                    "$rating",
                },
              },
            },
          ]);

        avgRating =
          Number(
            ratingResult[0]
              ?.average || 0
          ).toFixed(1);
      }

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.json({
        success: true,

        stats: {
          totalUsers,

          currentUsers:
            0,

          totalLogins:
            0,

          todayLogins:
            0,

          totalScans,

          todayScans,

          totalFeedback:
            totalReviews,

          avgRating:
            Number(
              avgRating
            ),

          modelAccuracy:
            94.8,

          systemHealth:
            mongoose.connection
              .readyState ===
            1
              ? 100
              : 0,

          avgResponseTime:
            1.15,

          todayUsers,

          userGrowth,

          scanTrend,

          popularConcerns,

          recentUsers,
        },
      });
    } catch (error) {
      console.error(
        "Admin stats error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch admin statistics.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// ADMIN USERS
// =========================================================

app.get(
  "/api/admin/users",

  authenticateAdmin,

  async (
    req,
    res
  ) => {
    try {
      const users =
        await User.find()
          .select(
            "-password"
          )
          .sort({
            createdAt: -1,
          })
          .limit(500)
          .lean();

      return res.json({
        success: true,

        users:
          users.map(
            (user) => ({
              id:
                user._id,

              _id:
                user._id,

              name:
                user.name ||
                "User",

              username:
                user.name ||
                "User",

              email:
                user.email,

              role:
                "user",

              isAdmin:
                false,

              createdAt:
                user.createdAt,
            })
          ),
      });
    } catch (error) {
      console.error(
        "Admin users error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch users.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// ADMIN SCANS
// =========================================================

app.get(
  "/api/admin/scans",

  authenticateAdmin,

  async (
    req,
    res
  ) => {
    try {
      const scans =
        await Scan.find()
          .sort({
            createdAt: -1,
          })
          .limit(500)
          .lean();

      return res.json({
        success: true,

        scans,
      });
    } catch (error) {
      console.error(
        "Admin scans error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch scans.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// ADMIN REVIEWS
// =========================================================

app.get(
  "/api/admin/reviews",

  authenticateAdmin,

  async (
    req,
    res
  ) => {
    try {
      const reviews =
        await Review.find()
          .sort({
            createdAt: -1,
          })
          .limit(500)
          .lean();

      return res.json({
        success: true,

        reviews,
      });
    } catch (error) {
      console.error(
        "Admin reviews error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to fetch admin reviews.",

          error:
            error.message,
        });
    }
  }
);

// =========================================================
// 404 ROUTE
// =========================================================

app.use(
  (
    req,
    res
  ) => {
    res
      .status(404)
      .json({
        success: false,

        message:
          `Route not found: ${req.method} ${req.originalUrl}`,
      });
  }
);

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "GLOBAL SERVER ERROR:",
      error
    );

    if (
      error instanceof
      multer.MulterError
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            `Upload error: ${error.message}`,
        });
    }

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Internal server error.",
      });
  }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "       AI SKINCARE NODE SERVER"
    );

    console.log(
      "========================================"
    );

    console.log(
      `✅ Node server: http://localhost:${PORT}`
    );

    console.log(
      `✅ Python AI: ${PYTHON_URL}`
    );

    console.log(
      "✅ User Login: /api/login"
    );

    console.log(
      "✅ User Register: /api/register"
    );

    console.log(
      "✅ User History: /api/history"
    );

    console.log(
      "✅ User Profile: /api/profile"
    );

    console.log(
      "✅ Skin Analysis: /api/upload"
    );

    console.log(
      "✅ Public Reviews: /api/reviews"
    );

    console.log(
      "✅ Admin Stats: /api/admin/stats"
    );

    console.log(
      "========================================"
    );

    console.log("");
  }
);