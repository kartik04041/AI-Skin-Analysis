const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  }
});

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Skincare Backend is running!"
  });
});

// Image upload and AI prediction route
app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image uploaded."
    });
  }

  console.log("Image received:", req.file.filename);

  try {
    // 1. Create a stream of the saved image file
    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));

    // 2. Post file stream to Python AI service running on port 5001
// Locate this block in backend/server.js:
    const aiResponse = await axios.post("http://127.0.0.1:5001/predict", formData, {
    headers: formData.getHeaders()
    });
    // 3. Return saved file info along with AI predictions to React
    return res.json({
      success: true,
      message: "Image uploaded and analyzed successfully!",
      filename: req.file.filename,
      path: req.file.path,
      imageUrl: `http://localhost:5000/uploads/${req.file.filename}`,
      analysis: aiResponse.data
    });

  } catch (error) {
    console.error("AI Communication Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Image uploaded, but failed to get prediction from Python AI model.",
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({
    success: false,
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});