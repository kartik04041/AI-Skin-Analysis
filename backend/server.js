
/* =========================================================
   AI SKINCARE ANALYSIS SYSTEM
   Node.js Backend
   Authentication | MongoDB | Skin Analysis
   History | Reviews | Admin Dashboard | Shop
   ========================================================= */

require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

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

const shopRoutes = require("./shopRoutes");
const app = express();

// =========================================================
// CONFIGURATION
// =========================================================

const PORT = Number(process.env.PORT) || 5000;

const PYTHON_URL =
  process.env.PYTHON_URL || "http://127.0.0.1:5001";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/skin_analysis_db";

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error(
    "JWT_SECRET is missing. Add it to backend/.env."
  );
}

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "email-admin@gmail.com"
).trim().toLowerCase();

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123";

// =========================================================
// MIDDLEWARE
// =========================================================

app.disable("x-powered-by");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/shop", shopRoutes);

// =========================================================
// MONGODB CONNECTION
// =========================================================

mongoose.set("strictQuery", true);

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully.");
  console.log("Database:", mongoose.connection.name);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    console.error("Check MongoDB service and MONGO_URI.");
  });

function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        "MongoDB is not connected. Start MongoDB and check backend/.env.",
    });
  }

  next();
}

// =========================================================
// DATABASE MODELS
// =========================================================

const userSchema = new mongoose.Schema(
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
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    user: {
      type: String,
      default: "Anonymous",
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
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

// FIXED: Correct schema structure and braces.
const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      default: "",
      index: true,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
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
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    confidence: {
      type: Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Scan = mongoose.model("Scan", scanSchema, "scans");

const loginEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: "",
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    loggedInAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

const LoginEvent = mongoose.model("LoginEvent", loginEventSchema);

// =========================================================
// AUTHENTICATION HELPERS
// =========================================================

function getBearerToken(req) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.substring(7).trim();
}

function authenticateToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (
      decoded.role !== "user" ||
      !mongoose.isValidObjectId(decoded.user_id)
    ) {
      return res.status(403).json({
        success: false,
        message: "A valid user token is required.",
      });
    }

    req.userId = decoded.user_id;
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login session.",
    });
  }
}

function authenticateAdmin(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin authorization required.",
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (
      decoded.role !== "admin" ||
      String(decoded.email || "").trim().toLowerCase() !==
        ADMIN_EMAIL
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.isAdmin = true;
    req.adminEmail = ADMIN_EMAIL;
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session.",
    });
  }
}

async function recordLogin({ userId, email, role }) {
  try {
    await LoginEvent.create({
      userId: userId || null,
      email,
      role,
      loggedInAt: new Date(),
    });
  } catch (error) {
    console.error("Login event recording failed:", error.message);
  }
}

function getPublicUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name || "User",
    username: user.name || "User",
    email: user.email,
    role: "user",
    isAdmin: false,
    createdAt: user.createdAt,
  };
}

// =========================================================
// BASIC ROUTES
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Skincare Backend is running!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    node: "running",
    python: PYTHON_URL,
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// =========================================================
// REGISTER
// =========================================================

app.post("/api/register", requireDatabase, async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanEmail === ADMIN_EMAIL) {
      return res.status(400).json({
        success: false,
        message: "This email is reserved for the administrator.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const displayName = String(name || username || "User").trim();
    const hashedPassword = await bcrypt.hash(String(password), 12);

    const user = await User.create({
      name: displayName,
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        email: user.email,
        role: "user",
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    await recordLogin({
      userId: user._id,
      email: user.email,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

// =========================================================
// NORMAL USER LOGIN
// =========================================================

app.post("/api/login", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanEmail === ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Please use the Admin Login option.",
      });
    }

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (
      !user ||
      !(await bcrypt.compare(String(password), user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        email: user.email,
        role: "user",
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    await recordLogin({
      userId: user._id,
      email: user.email,
      role: "user",
    });

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("User login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// =========================================================
// ADMIN LOGIN
// =========================================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Admin email and password are required.",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (
      cleanEmail !== ADMIN_EMAIL ||
      String(password) !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const token = jwt.sign(
      {
        user_id: "admin",
        email: ADMIN_EMAIL,
        role: "admin",
        isAdmin: true,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    if (mongoose.connection.readyState === 1) {
      await recordLogin({
        userId: null,
        email: ADMIN_EMAIL,
        role: "admin",
      });
    }

    return res.json({
      success: true,
      message: "Admin login successful.",
      token,
      user: {
        id: "admin",
        _id: "admin",
        username: "admin",
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin",
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed.",
    });
  }
});

// =========================================================
// IMAGE UPLOAD CONFIGURATION
// =========================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const filename =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error("Only JPG, JPEG, PNG and WEBP images are allowed.")
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3,
  },
});

// =========================================================
// SKIN ANALYSIS
// POST /api/upload
// =========================================================

app.post(
  "/api/upload",
  authenticateToken,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "right", maxCount: 1 },
  ]),
  requireDatabase,
  async (req, res) => {
    const analysisStartedAt = Date.now();
    const uploadedFiles = [];

    try {
      const formData = new FormData();

      for (const field of ["front", "left", "right"]) {
        const file = req.files?.[field]?.[0];

        if (file) {
          uploadedFiles.push(file.path);

          formData.append(
            field,
            fs.createReadStream(file.path)
          );
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please upload at least one skin image.",
        });
      }

      const userDataFields = [
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

      for (const field of userDataFields) {
        if (req.body[field] !== undefined) {
          formData.append(field, String(req.body[field]));
        }
      }

      formData.append("user_id", String(req.userId));

      const currentUser = await User.findById(req.userId);

      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "User not found. Please log in again.",
        });
      }

      console.log("Starting skin analysis for:", currentUser.email);

      const pythonResponse = await axios.post(
        `${PYTHON_URL}/predict`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${req.token}`,
            "X-User-ID": String(req.userId),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000,
          validateStatus: () => true,
        }
      );

      if (
        pythonResponse.status < 200 ||
        pythonResponse.status >= 300
      ) {
        return res.status(502).json({
          success: false,
          message:
            pythonResponse.data?.message ||
            "Python AI service failed to process the image.",
          error: pythonResponse.data,
        });
      }

      const aiData = pythonResponse.data;

      if (!aiData || aiData.success === false) {
        return res.status(500).json({
          success: false,
          message: aiData?.message || "AI analysis failed.",
        });
      }

      const analysis =
        aiData.analysis && typeof aiData.analysis === "object"
          ? aiData.analysis
          : aiData;

      const result =
        aiData.result && typeof aiData.result === "object"
          ? aiData.result
          : aiData;

      const prediction =
        aiData.prediction ||
        aiData.label ||
        aiData.class ||
        aiData.type ||
        result.prediction ||
        result.label ||
        result.class ||
        result.type ||
        (typeof aiData.result === "string" ? aiData.result : "");

      const rawConfidence =
        aiData.confidence ??
        aiData.confidence_score ??
        aiData.probability ??
        result.confidence ??
        result.confidence_score ??
        0;

      const confidence = Number(rawConfidence) || 0;

      const concern =
        aiData.concern ||
        result.concern ||
        prediction ||
        req.body.concern ||
        "";

      // Actual elapsed time through successful AI processing.
      const responseTimeMs = Date.now() - analysisStartedAt;

      const scan = await Scan.create({
        userId: currentUser._id,
        userEmail: currentUser.email,
        analysis,
        result,
        prediction: String(prediction || ""),
        label: String(aiData.label || prediction || ""),
        concern: String(concern || ""),
        confidence,
        responseTimeMs,
        userData: { ...req.body },
        images: {
          front: !!req.files?.front?.[0],
          left: !!req.files?.left?.[0],
          right: !!req.files?.right?.[0],
        },
      });

      console.log("Skin scan saved:", scan._id.toString());
      console.log("AI processing time:", `${responseTimeMs} ms`);

      return res.json({
        success: true,
        message: "Skin analysis completed successfully.",
        analysis: aiData,
        historyItem: {
          _id: scan._id,
          id: scan._id,
          userId: scan.userId,
          userEmail: scan.userEmail,
          prediction: scan.prediction,
          label: scan.label,
          type: scan.prediction,
          concern: scan.concern,
          confidence: scan.confidence,
          responseTimeMs: scan.responseTimeMs,
          water: req.body.waterIntake || "",
          waterIntake: req.body.waterIntake || "",
          hydration: req.body.waterIntake || "",
          climate: req.body.climate || "",
          userData: scan.userData,
          analysis: scan.analysis,
          result: scan.result,
          createdAt: scan.createdAt,
          updatedAt: scan.updatedAt,
        },
      });
    } catch (error) {
      console.error("Skin analysis error:", error.message);

      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ECONNRESET"
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Python AI service is unavailable. Check port 5001.",
        });
      }

      if (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT"
      ) {
        return res.status(504).json({
          success: false,
          message: "AI analysis timed out. Please try again.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to process skin analysis.",
      });
    } finally {
      uploadedFiles.forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error(
            "Temporary file cleanup error:",
            cleanupError.message
          );
        }
      });
    }
  }
);

// =========================================================
// PUBLIC REVIEWS
// =========================================================

app.get("/api/reviews", requireDatabase, async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Public reviews error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch reviews.",
    });
  }
});

// =========================================================
// ADD REVIEW
// =========================================================

app.post(
  "/api/reviews",
  authenticateToken,
  requireDatabase,
  async (req, res) => {
    try {
      const { text, rating } = req.body;

      if (!text || !String(text).trim()) {
        return res.status(400).json({
          success: false,
          message: "Review text is required.",
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User account not found.",
        });
      }

      const cleanRating = Math.min(
        Math.max(Number(rating) || 5, 1),
        5
      );

      const review = await Review.create({
        userId: user._id,
        user: user.name || user.email || "Anonymous",
        text: String(text).trim(),
        rating: cleanRating,
      });

      return res.status(201).json({
        success: true,
        message: "Review submitted successfully.",
        review,
      });
    } catch (error) {
      console.error("Review submission error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to submit review.",
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
  requireDatabase,
  async (req, res) => {
    try {
      const scans = await Scan.find({
        userId: req.userId,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const history = scans.map((scan) => {
        const analysis =
          scan.analysis && typeof scan.analysis === "object"
            ? scan.analysis
            : {};

        const result =
          scan.result && typeof scan.result === "object"
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
          scan.userData?.waterIntake ||
          scan.userData?.water ||
          analysis.waterIntake ||
          analysis.water ||
          "";

        const climate =
          scan.userData?.climate ||
          analysis.climate ||
          "";

        return {
          ...scan,
          id: scan._id,
          type: prediction,
          prediction,
          label: scan.label || prediction,
          concern,
          confidence,
          water,
          waterIntake: water,
          hydration: water,
          climate,
          analysis,
          result,
          userData: scan.userData || {},
        };
      });

      return res.json({
        success: true,
        count: history.length,
        history,
      });
    } catch (error) {
      console.error("History error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch skin analysis history.",
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
  requireDatabase,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId).lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          _id: user._id,
          username: user.name || "User",
          name: user.name || "User",
          email: user.email,
          role: "user",
          isAdmin: false,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Profile error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch profile.",
      });
    }
  }
);

// =========================================================
// ADMIN DASHBOARD STATISTICS
// GET /api/admin/stats
// =========================================================

app.get(
  "/api/admin/stats",
  authenticateAdmin,
  requireDatabase,
  async (req, res) => {
    try {
      const now = new Date();

      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const activeSince = new Date(
        now.getTime() - 15 * 60 * 1000
      );

      const [
        totalUsers,
        totalScans,
        totalReviews,
        totalLogins,
        todayUsers,
        todayScans,
        todayLogins,
        activeUserIds,
        userGrowthRaw,
        scanTrendRaw,
        popularConcernsRaw,
        recentUsers,
        ratingResult,
        responseTimeResult,
      ] = await Promise.all([
        User.countDocuments(),

        Scan.countDocuments(),

        Review.countDocuments(),

        LoginEvent.countDocuments(),

        User.countDocuments({
          createdAt: { $gte: startOfToday },
        }),

        Scan.countDocuments({
          createdAt: { $gte: startOfToday },
        }),

        LoginEvent.countDocuments({
          loggedInAt: { $gte: startOfToday },
        }),

        LoginEvent.distinct("userId", {
          role: "user",
          loggedInAt: { $gte: activeSince },
          userId: { $ne: null },
        }),

        // User registrations by day.
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // FIXED: Daily skin analysis chart data.
        Scan.aggregate([
          {
            $match: {
              createdAt: { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Popular recorded skin concerns.
        Scan.aggregate([
          {
            $match: {
              concern: {
                $exists: true,
                $type: "string",
                $ne: "",
              },
            },
          },
          {
            $group: {
              _id: {
                $toLower: {
                  $trim: { input: "$concern" },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),

        User.find()
          .select("name email createdAt")
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),

        // Average review rating.
        Review.aggregate([
          {
            $group: {
              _id: null,
              average: { $avg: "$rating" },
            },
          },
        ]),

        // FIXED: Response-time metric, separate from chart data.
        Scan.aggregate([
          {
            $match: {
              responseTimeMs: {
                $type: "number",
                $gt: 0,
              },
            },
          },
          {
            $group: {
              _id: null,
              averageMs: { $avg: "$responseTimeMs" },
              samples: { $sum: 1 },
            },
          },
        ]),
      ]);

      const toMap = (items) =>
        new Map(items.map((item) => [item._id, item.count]));

      const userMap = toMap(userGrowthRaw);
      const scanMap = toMap(scanTrendRaw);

      const userGrowth = [];
      const scanTrend = [];

      for (let offset = 6; offset >= 0; offset--) {
        const date = new Date(startOfToday);
        date.setDate(date.getDate() - offset);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        const dateKey = `${year}-${month}-${day}`;

        const label = date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });

        userGrowth.push({
          date: dateKey,
          label,
          count: userMap.get(dateKey) || 0,
        });

        scanTrend.push({
          date: dateKey,
          label,
          count: scanMap.get(dateKey) || 0,
        });
      }

      const avgRating = Number(ratingResult[0]?.average || 0);

      const responseTimeSamples =
        responseTimeResult[0]?.samples || 0;

      const avgResponseTime =
        responseTimeSamples > 0
          ? Number(
              (responseTimeResult[0].averageMs / 1000).toFixed(2)
            )
          : null;

      // Accuracy must be measured using a labeled validation dataset.
      const accuracySetting = process.env.MODEL_ACCURACY;

      const modelAccuracy =
        accuracySetting !== undefined &&
        accuracySetting.trim() !== "" &&
        Number.isFinite(Number(accuracySetting)) &&
        Number(accuracySetting) >= 0 &&
        Number(accuracySetting) <= 100
          ? Number(accuracySetting)
          : null;

      const systemHealth =
        mongoose.connection.readyState === 1 ? 100 : 0;

      return res.json({
        success: true,
        stats: {
          totalUsers,
          currentUsers: activeUserIds.length,
          totalLogins,
          todayLogins,
          totalScans,
          todayScans,
          totalFeedback: totalReviews,
          totalReviews,
          avgRating: Number(avgRating.toFixed(1)),
          todayUsers,

          userGrowth,
          scanTrend,

          popularConcerns: popularConcernsRaw.map((item) => ({
            _id: item._id || "Unspecified",
            name: item._id || "Unspecified",
            count: item.count,
          })),

          recentUsers: recentUsers.map((user) => ({
            id: user._id,
            _id: user._id,
            name: user.name || "User",
            username: user.name || "User",
            email: user.email,
            createdAt: user.createdAt,
          })),

          modelAccuracy,
          avgResponseTime,
          responseTimeSamples,
          systemHealth,
        },
      });
    } catch (error) {
      console.error("Admin stats error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch admin statistics.",
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
  requireDatabase,
  async (req, res) => {
    try {
      const users = await User.find()
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      return res.json({
        success: true,
        count: users.length,
        users: users.map((user) => ({
          id: user._id,
          _id: user._id,
          name: user.name || "User",
          username: user.name || "User",
          email: user.email,
          role: "user",
          isAdmin: false,
          createdAt: user.createdAt,
        })),
      });
    } catch (error) {
      console.error("Admin users error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch users.",
      });
    }
  }
);

// =========================================================
// ADMIN SKIN SCANS
// =========================================================

app.get(
  "/api/admin/scans",
  authenticateAdmin,
  requireDatabase,
  async (req, res) => {
    try {
      const scans = await Scan.find()
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      return res.json({
        success: true,
        count: scans.length,
        scans,
      });
    } catch (error) {
      console.error("Admin scans error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch skin scans.",
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
  requireDatabase,
  async (req, res) => {
    try {
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      return res.json({
        success: true,
        count: reviews.length,
        reviews,
      });
    } catch (error) {
      console.error("Admin reviews error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch admin reviews.",
      });
    }
  }
);

// =========================================================
// DELETE REVIEW — ADMIN
// DELETE /api/reviews/:id
// =========================================================

app.delete(
  "/api/reviews/:id",
  authenticateAdmin,
  requireDatabase,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID.",
        });
      }

      const deletedReview = await Review.findByIdAndDelete(
        req.params.id
      );

      if (!deletedReview) {
        return res.status(404).json({
          success: false,
          message: "Review not found.",
        });
      }

      return res.json({
        success: true,
        message: "Review deleted successfully.",
      });
    } catch (error) {
      console.error("Delete review error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete review.",
      });
    }
  }
);

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
  }

  if (error.message?.includes("Only JPG")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =========================================================
// START SERVER
// =========================================================

app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("       AI SKINCARE NODE SERVER");
  console.log("========================================");
  console.log(`Node server: http://localhost:${PORT}`);
  console.log(`Python AI: ${PYTHON_URL}`);
  console.log("User login: POST /api/login");
  console.log("User register: POST /api/register");
  console.log("User history: GET /api/history");
  console.log("User profile: GET /api/profile");
  console.log("Skin analysis: POST /api/upload");
  console.log("Public reviews: GET /api/reviews");
  console.log("Admin login: POST /api/admin/login");
  console.log("Admin stats: GET /api/admin/stats");
  console.log("Admin users: GET /api/admin/users");
  console.log("Admin scans: GET /api/admin/scans");
  console.log("Admin reviews: GET /api/admin/reviews");
  console.log("Shop API: /api/shop");
  console.log("========================================");
  console.log("");
});
