const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 5000;
const PYTHON_URL = "http://127.0.0.1:5001";

const SECRET_KEY = "glowai_super_secret_jwt_key_2026";


// ========================================================
// MIDDLEWARE
// ========================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);

app.use(express.json());


// ========================================================
// MONGODB
// ========================================================

mongoose
  .connect("mongodb://localhost:27017/skin_analysis_db")
  .then(() => {
    console.log("✅ Connected to MongoDB (skin_analysis_db).");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });


// ========================================================
// USER MODEL
// ========================================================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);


// ========================================================
// REVIEW MODEL
// ========================================================

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },

    user: {
      type: String,
      default: "Anonymous"
    },

    text: {
      type: String,
      required: true
    },

    rating: {
      type: Number,
      default: 5
    }
  },
  {
    timestamps: true
  }
);

const Review = mongoose.model("Review", reviewSchema);


// ========================================================
// UPLOAD FOLDER
// ========================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}


// Serve uploaded images
app.use(
  "/uploads",
  express.static(uploadDir)
);


// ========================================================
// MULTER
// ========================================================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    cb(null, uploadDir);

  },

  filename: function (req, file, cb) {

    const extension =
      path.extname(file.originalname);

    const name =
      Date.now() +
      "-" +
      Math.round(Math.random() * 100000) +
      extension;

    cb(null, name);

  }

});


const upload = multer({

  storage: storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
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

  }

});


// ========================================================
// JWT MIDDLEWARE
// ========================================================

function authenticateToken(req, res, next) {

  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {

    return res.status(401).json({

      success: false,

      message: "Authorization token required."

    });

  }


  const token =
    authHeader.split(" ")[1];


  if (
    !token ||
    token === "null" ||
    token === "undefined"
  ) {

    return res.status(401).json({

      success: false,

      message: "Invalid authorization token."

    });

  }


  try {

    const decoded =
      jwt.verify(
        token,
        SECRET_KEY
      );


    req.userId =
      decoded.user_id;


    next();

  } catch (error) {

    return res.status(401).json({

      success: false,

      message: "Invalid or expired token."

    });

  }

}


// ========================================================
// TEST ROUTE
// ========================================================

app.get("/", (req, res) => {

  res.json({

    success: true,

    message:
      "AI Skincare Node Server is running!",

    node:
      "http://localhost:5000",

    python:
      PYTHON_URL

  });

});


// ========================================================
// HEALTH CHECK
// ========================================================

app.get(
  "/health",
  async (req, res) => {

    let pythonStatus =
      "offline";


    try {

      const response =
        await axios.get(
          `${PYTHON_URL}/health`,
          {
            timeout: 3000
          }
        );


      if (response.status === 200) {

        pythonStatus =
          "online";

      }

    } catch (error) {

      pythonStatus =
        "offline";

    }


    res.json({

      success: true,

      node: "online",

      python:
        pythonStatus

    });

  }
);


// ========================================================
// REGISTER
// ========================================================

app.post(
  "/api/register",
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;


      if (
        !name ||
        !email ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Name, email and password are required."

        });

      }


      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      const existingUser =
        await User.findOne({

          email:
            normalizedEmail

        });


      if (existingUser) {

        return res.status(409).json({

          success: false,

          message:
            "An account with this email already exists."

        });

      }


      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      const newUser =
        await User.create({

          name:
            name.trim(),

          email:
            normalizedEmail,

          password:
            hashedPassword

        });


      const token =
        jwt.sign(

          {
            user_id:
              newUser._id.toString(),

            email:
              newUser.email

          },

          SECRET_KEY,

          {
            expiresIn:
              "7d"
          }

        );


      res.status(201).json({

        success: true,

        message:
          "Account created successfully.",

        token,

        user: {

          id:
            newUser._id,

          name:
            newUser.name,

          email:
            newUser.email

        }

      });

    } catch (error) {

      console.error(
        "Register error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Registration failed."

      });

    }

  }
);


// ========================================================
// LOGIN
// ========================================================

app.post(
  "/api/login",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;


      if (
        !email ||
        !password
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Email and password are required."

        });

      }


      const normalizedEmail =
        email
          .trim()
          .toLowerCase();


      const user =
        await User.findOne({

          email:
            normalizedEmail

        });


      if (!user) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }


      const passwordMatch =
        await bcrypt.compare(

          password,

          user.password

        );


      if (!passwordMatch) {

        return res.status(401).json({

          success: false,

          message:
            "Invalid email or password."

        });

      }


      const token =
        jwt.sign(

          {
            user_id:
              user._id.toString(),

            email:
              user.email

          },

          SECRET_KEY,

          {
            expiresIn:
              "7d"
          }

        );


      res.json({

        success: true,

        message:
          "Login successful.",

        token,

        user: {

          id:
            user._id,

          name:
            user.name,

          email:
            user.email

        }

      });

    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Login failed."

      });

    }

  }
);


// ========================================================
// IMAGE UPLOAD + AI PREDICTION
// ========================================================

app.post(

  "/api/upload",

  authenticateToken,

  upload.fields([

    {
      name: "front",
      maxCount: 1
    },

    {
      name: "left",
      maxCount: 1
    },

    {
      name: "right",
      maxCount: 1
    }

  ]),

  async (req, res) => {

    const files =
      req.files || {};


    const hasImage =

      files.front?.length ||

      files.left?.length ||

      files.right?.length;


    if (!hasImage) {

      return res.status(400).json({

        success: false,

        message:
          "No image uploaded."

      });

    }


    console.log(
      "📸 Images received:",
      Object.keys(files)
    );


    const savedFiles = [];


    try {

      // ------------------------------------------------
      // CREATE FORM DATA FOR PYTHON
      // ------------------------------------------------

      const formData =
        new FormData();


      // FRONT

      if (
        files.front &&
        files.front[0]
      ) {

        const file =
          files.front[0];


        formData.append(

          "front",

          fs.createReadStream(
            file.path
          )

        );


        savedFiles.push(
          file.path
        );

      }


      // LEFT

      if (
        files.left &&
        files.left[0]
      ) {

        const file =
          files.left[0];


        formData.append(

          "left",

          fs.createReadStream(
            file.path
          )

        );


        savedFiles.push(
          file.path
        );

      }


      // RIGHT

      if (
        files.right &&
        files.right[0]
      ) {

        const file =
          files.right[0];


        formData.append(

          "right",

          fs.createReadStream(
            file.path
          )

        );


        savedFiles.push(
          file.path
        );

      }


      // ------------------------------------------------
      // SEND FORM DATA TO PYTHON
      // ------------------------------------------------

      console.log(
        "🤖 Sending images to Python AI..."
      );


      const aiResponse =
        await axios.post(

          `${PYTHON_URL}/predict`,

          formData,

          {

            headers: {

              ...formData.getHeaders(),

              Authorization:
                req.headers.authorization

            },

            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,

            timeout:
              120000

          }

        );


      console.log(
        "✅ Python AI response received."
      );


      // ------------------------------------------------
      // RETURN RESPONSE TO REACT
      // ------------------------------------------------

      return res.json({

        success: true,

        message:
          "Image uploaded and analyzed successfully.",

        analysis:
          aiResponse.data

      });

    } catch (error) {

      console.error(
        "❌ AI Communication Error:"
      );


      if (
        error.response
      ) {

        console.error(
          error.response.data
        );

      } else {

        console.error(
          error.message
        );

      }


      // Python returned 401

      if (
        error.response &&
        error.response.status === 401
      ) {

        return res.status(401).json({

          success: false,

          message:
            "Your session has expired. Please login again."

        });

      }


      return res.status(500).json({

        success: false,

        message:
          "Image uploaded, but failed to get prediction from Python AI model.",

        error:
          error.response?.data ||
          error.message

      });

    } finally {

      // ------------------------------------------------
      // DELETE TEMPORARY UPLOADS
      // ------------------------------------------------

      for (
        const filePath
        of savedFiles
      ) {

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

        } catch (err) {

          console.error(
            "Could not delete:",
            filePath
          );

        }

      }

    }

  }

);


// ========================================================
// GET REVIEWS
// ========================================================

app.get(
  "/api/reviews",
  async (req, res) => {

    try {

      const reviews =
        await Review.find()

          .sort({
            createdAt: -1
          })

          .limit(50);


      const formattedReviews =
        reviews.map(
          (review) => ({

            _id:
              review._id,

            user:
              review.user,

            text:
              review.text,

            rating:
              review.rating,

            date:
              review.createdAt

          })
        );


      res.json({

        success: true,

        reviews:
          formattedReviews

      });

    } catch (error) {

      console.error(
        "Reviews error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to load reviews."

      });

    }

  }
);


// ========================================================
// ADD REVIEW
// ========================================================

app.post(

  "/api/reviews",

  authenticateToken,

  async (req, res) => {

    try {

      const {
        text,
        rating
      } = req.body;


      if (
        !text ||
        !text.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Review text is required."

        });

      }


      const user =
        await User.findById(
          req.userId
        );


      if (!user) {

        return res.status(401).json({

          success: false,

          message:
            "User not found."

        });

      }


      const review =
        await Review.create({

          userId:
            req.userId.toString(),

          user:
            user.name,

          text:
            text.trim(),

          rating:
            Number(rating) || 5

        });


      res.status(201).json({

        success: true,

        message:
          "Review added successfully.",

        review: {

          _id:
            review._id,

          user:
            review.user,

          text:
            review.text,

          rating:
            review.rating,

          date:
            review.createdAt

        }

      });

    } catch (error) {

      console.error(
        "Add review error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to add review."

      });

    }

  }

);


// ========================================================
// USER HISTORY
// ========================================================
//
// Your Python server already stores scans in MongoDB.
// Node reads the same MongoDB database here.
//

app.get(

  "/api/history",

  authenticateToken,

  async (req, res) => {

    try {

      const scansCollection =
        mongoose.connection.db.collection(
          "scans"
        );


      const history =
        await scansCollection
          .find({
            userId:
              req.userId
          })

          .sort({
            createdAt: -1
          })

          .limit(50)

          .toArray();


      res.json({

        success: true,

        history

      });

    } catch (error) {

      console.error(
        "History error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to load scan history."

      });

    }

  }

);


// ========================================================
// USER PROFILE
// ========================================================

app.get(

  "/api/profile",

  authenticateToken,

  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.userId
        ).select("-password");


      if (!user) {

        return res.status(404).json({

          success: false,

          message:
            "User not found."

        });

      }


      res.json({

        success: true,

        user

      });

    } catch (error) {

      console.error(
        "Profile error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Failed to load profile."

      });

    }

  }

);


// ========================================================
// ERROR HANDLER
// ========================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "❌ Server Error:",
      err.message
    );


    if (
      err instanceof multer.MulterError
    ) {

      if (
        err.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Image is too large. Maximum size is 10 MB."

        });

      }


      return res.status(400).json({

        success: false,

        message:
          `Upload error: ${err.message}`

      });

    }


    return res.status(400).json({

      success: false,

      message:
        err.message ||
        "Server error."

    });

  }
);


// ========================================================
// START SERVER
// ========================================================

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
      "========================================"
    );

  }
);