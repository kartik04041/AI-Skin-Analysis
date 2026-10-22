
import React, { useState, useRef, useEffect, useCallback } from "react";

export default function SkinImageInput({
  onImagesUpdated = () => {},
  isLoggedIn = false,
  onOpenAuth,
}) {
  const [activeTab, setActiveTab] = useState("front");
  const [images, setImages] = useState({
    front: null,
    left: null,
    right: null,
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const imagesRef = useRef(images);

  // Safely open the login modal.
  const requestLogin = useCallback(() => {
  if (typeof onOpenAuth === "function") {
    onOpenAuth("login");
    return;
  }

  console.error(
    "Missing onOpenAuth callback. Check App.js and AnalyzerWorkspace.jsx."
  );
}, [onOpenAuth]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (!isCameraActive || !streamRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    video.play().catch((error) => {
      console.error("Video playback error:", error);
      setCameraError("Unable to start video playback. Check camera permissions.");
    });
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      Object.values(imagesRef.current).forEach((image) => {
        if (image?.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, []);

  const notifyParent = (updatedImages) => {
    onImagesUpdated({
      front: updatedImages.front?.file || null,
      left: updatedImages.left?.file || null,
      right: updatedImages.right?.file || null,
    });
  };

  const updateImage = (angle, file) => {
    const previousImage = imagesRef.current[angle];

    if (previousImage?.previewUrl) {
      URL.revokeObjectURL(previousImage.previewUrl);
    }

    const updatedImages = {
      ...imagesRef.current,
      [angle]: file
        ? {
            file,
            previewUrl: URL.createObjectURL(file),
          }
        : null,
    };

    imagesRef.current = updatedImages;
    setImages(updatedImages);
    notifyParent(updatedImages);
  };

  const startCamera = async () => {
    if (!isLoggedIn) {
      requestLogin();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable. Use HTTPS or http://localhost and check your browser."
      );
      return;
    }

    stopCamera();
    setCameraError("");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setIsCameraActive(true);
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraError(
        "Camera could not start. Allow camera permission in your browser and close other apps using the camera."
      );
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is not ready yet. Wait for the video to appear.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to access the image canvas.");
      return;
    }

    // Mirror the captured image to match the front-facing preview.
    context.save();
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, width, height);
    context.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture the photo. Please try again.");
          return;
        }

        const file = new File([blob], `${activeTab}_scan.jpg`, {
          type: "image/jpeg",
        });

        updateImage(activeTab, file);
        stopCamera();
        setCameraError("");
      },
      "image/jpeg",
      0.95
    );
  };

  const handleFileUpload = (event, angle) => {
    if (!isLoggedIn) {
      event.target.value = "";
      requestLogin();
      return;
    }

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    updateImage(angle, file);
    setCameraError("");
    event.target.value = "";
  };

  const removeImage = (angle) => {
    updateImage(angle, null);
    setCameraError("");
  };

  const getGuideText = () => {
    switch (activeTab) {
      case "front":
        return "Center face inside oval";
      case "left":
        return "Turn head 45° RIGHT";
      case "right":
        return "Turn head 45° LEFT";
      default:
        return "";
    }
  };

  return (
    <div className="skin-image-input-container">
      <div className="angle-tabs">
        {["front", "left", "right"].map((angle) => (
          <button
            key={angle}
            type="button"
            className={`tab-btn ${activeTab === angle ? "active" : ""} ${
              images[angle] ? "captured" : ""
            }`}
            onClick={() => setActiveTab(angle)}
          >
            {angle === "front" && "👤 Front"}
            {angle === "left" && "👈 Left"}
            {angle === "right" && "👉 Right"}
            {images[angle] && " ✓"}
          </button>
        ))}
      </div>

      <div className="webcam-box">
        {isCameraActive ? (
          <div className="camera-viewport">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-stream"
            />

            <div className={`oval-guide-overlay ${activeTab}`}>
              <div className="oval-ring">
                <span className="guide-text">{getGuideText()}</span>
              </div>
            </div>

            <button
              type="button"
              className="capture-snap-btn"
              onClick={capturePhoto}
            >
              📸 Capture {activeTab.toUpperCase()} View
            </button>
          </div>
        ) : (
          <div className="camera-placeholder">
            {images[activeTab] ? (
              <div className="preview-active-tab">
                <img
                  src={images[activeTab].previewUrl}
                  alt={`${activeTab} skin scan`}
                />
                <button
                  type="button"
                  className="retake-btn"
                  onClick={() => removeImage(activeTab)}
                >
                  ✕ Remove Scan
                </button>
              </div>
            ) : (
              <div className="no-camera-state">
                <span className="pink-icon">📷</span>
                <p>
                  Position camera for{" "}
                  <strong>{activeTab.toUpperCase()}</strong> angle
                </p>

                <div className="cam-actions">
                  <button
                    type="button"
                    className="start-cam-btn"
                    onClick={startCamera}
                  >
                    {isLoggedIn
                      ? "Start Live Camera"
                      : "🔑 Login to Start Camera"}
                  </button>

                  <label className="upload-file-label">
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!isLoggedIn}
                      onChange={(event) =>
                        handleFileUpload(event, activeTab)
                      }
                      style={{ display: "none" }}
                    />
                  </label>

                  {!isLoggedIn && (
                    <button
                      type="button"
                      className="start-cam-btn"
                      onClick={requestLogin}
                    >
                      Login to Upload
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isCameraActive && (
          <button
            type="button"
            className="stop-cam-btn"
            onClick={stopCamera}
          >
            Stop Camera
          </button>
        )}
      </div>

      {cameraError && (
        <div className="camera-err-msg" role="alert">
          {cameraError}
        </div>
      )}

      <div className="scans-thumbnail-row">
        {["front", "left", "right"].map((angle) => (
          <div
            key={angle}
            className={`thumb-card ${images[angle] ? "has-img" : ""}`}
          >
            <span className="thumb-label">{angle.toUpperCase()}</span>

            {images[angle] ? (
              <div className="thumb-img-wrapper">
                <img
                  src={images[angle].previewUrl}
                  alt={`${angle} scan thumbnail`}
                />
                <button
                  type="button"
                  className="remove-thumb-btn"
                  aria-label={`Remove ${angle} scan`}
                  onClick={() => removeImage(angle)}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="empty-thumb"
                onClick={() => {
                  setActiveTab(angle);

                  if (!isLoggedIn) {
                    requestLogin();
                  } else {
                    startCamera();
                  }
                }}
              >
                + Add Scan
              </button>
            )}
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
