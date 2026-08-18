import React, { useEffect, useRef, useState } from "react";
import "./SkinImageInput.css";

const SkinImageInput = ({ onImageSelected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [stream, setStream] = useState(null);

  // File Upload Handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onImageSelected(file);
  };

  // Camera Access Handler
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error("Camera access error:", error);
      alert(
        "Unable to access camera. Please allow camera permissions in your browser and try again."
      );
    }
  };

  // Capture Snapshot from Camera Feed
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const capturedFile = new File([blob], "captured-skin-image.jpg", {
          type: "image/jpeg",
        });

        const objectUrl = URL.createObjectURL(blob);
        setPreview(objectUrl);
        onImageSelected(capturedFile);

        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  };

  // Stop Camera Tracks
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCameraOpen(false);
  };

  // Clean up stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageSelected(null);
  };

  return (
    <div className="skin-image-input-container">
      {!preview && !cameraOpen && (
        <div className="input-actions">
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="action-btn upload-btn"
          >
            📁 Upload Image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          <span className="divider-text">OR</span>

          <button
            type="button"
            onClick={startCamera}
            className="action-btn camera-btn"
          >
            📷 Scan with Camera
          </button>
        </div>
      )}

      {/* Live Camera Feed Modal / Box */}
      {cameraOpen && (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-preview"
          />

          <div className="camera-controls">
            <button
              type="button"
              onClick={captureImage}
              className="control-btn capture-btn"
            >
              📸 Capture
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="control-btn cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Selected / Captured Image Preview */}
      {preview && !cameraOpen && (
        <div className="image-preview-wrapper">
          <h3>Selected Skin Sample</h3>

          <div className="img-frame">
            <img src={preview} alt="Skin sample" className="preview-image" />
          </div>

          <button
            type="button"
            onClick={handleRemoveImage}
            className="remove-image-btn"
          >
            🗑️ Remove Image
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default SkinImageInput;