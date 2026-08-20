import React, { useState, useRef, useEffect } from "react";

export default function SkinImageInput({ onImagesUpdated, isLoggedIn, onOpenAuth }) {
  const [activeTab, setActiveTab] = useState("front");
  const [images, setImages] = useState({ front: null, left: null, right: null });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Attach stream once video element mounts in DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.error("Video playback error:", err));
    }
  }, [isCameraActive, stream]);

  // Cleanup media tracks on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    // GUARD: BLOCK CAMERA IF NOT LOGGED IN
    if (!isLoggedIn) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      setCameraError(
        "Camera access denied or unreadable. Ensure camera permissions are allowed in your browser."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture photo frame.");
          return;
        }

        const file = new File([blob], `${activeTab}_scan.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(file);

        const updated = {
          ...images,
          [activeTab]: { file, previewUrl },
        };

        setImages(updated);
        notifyParent(updated);
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  };

  const handleFileUpload = (e, angle) => {
    // GUARD: BLOCK FILE UPLOAD IF NOT LOGGED IN
    if (!isLoggedIn) {
      e.target.value = "";
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const updated = {
      ...images,
      [angle]: { file, previewUrl },
    };

    setImages(updated);
    notifyParent(updated);
  };

  const removeImage = (angle) => {
    const updated = { ...images, [angle]: null };
    setImages(updated);
    notifyParent(updated);
  };

  const notifyParent = (updatedImages) => {
    onImagesUpdated({
      front: updatedImages.front ? updatedImages.front.file : null,
      left: updatedImages.left ? updatedImages.left.file : null,
      right: updatedImages.right ? updatedImages.right.file : null,
    });
  };

  const getGuideText = () => {
    switch (activeTab) {
      case "front":
        return "Center face inside oval";
      case "left":
        return "Turn head 45° RIGHT (Left Profile)";
      case "right":
        return "Turn head 45° LEFT (Right Profile)";
      default:
        return "";
    }
  };

  return (
    <div className="skin-image-input-container">
      {/* SCAN ANGLE SELECTOR */}
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

      {/* WEBCAM & PREVIEW BOX */}
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
                  alt={`${activeTab} scan`}
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
                <span className="pink-icon">🔒</span>
                <p>
                  Position camera for <strong>{activeTab.toUpperCase()}</strong> angle
                </p>
                <div className="cam-actions">
                  <button
                    type="button"
                    className="start-cam-btn"
                    onClick={() => {
                      if (!isLoggedIn) {
                        onOpenAuth();
                      } else {
                        startCamera();
                      }
                    }}
                  >
                    {isLoggedIn ? "Start Live Camera" : "🔑 Login to Start Camera"}
                  </button>
                  <label className="upload-file-label">
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, activeTab)}
                      onClick={(e) => {
                        if (!isLoggedIn) {
                          e.preventDefault();
                          onOpenAuth();
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {isCameraActive && (
          <button type="button" className="stop-cam-btn" onClick={stopCamera}>
            Stop Camera
          </button>
        )}
      </div>

      {cameraError && <div className="camera-err-msg">{cameraError}</div>}

      {/* 3 THUMBNAILS ROW */}
      <div className="scans-thumbnail-row">
        {["front", "left", "right"].map((angle) => (
          <div
            key={angle}
            className={`thumb-card ${images[angle] ? "has-img" : ""}`}
          >
            <span className="thumb-label">{angle.toUpperCase()}</span>
            {images[angle] ? (
              <div className="thumb-img-wrapper">
                <img src={images[angle].previewUrl} alt={angle} />
                <button
                  type="button"
                  className="remove-thumb-btn"
                  onClick={() => removeImage(angle)}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                className="empty-thumb"
                onClick={() => {
                  if (!isLoggedIn) {
                    onOpenAuth();
                    return;
                  }
                  setActiveTab(angle);
                  if (!isCameraActive) startCamera();
                }}
              >
                + Add Scan
              </div>
            )}
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}