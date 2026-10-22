import React from "react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="info-section alt-bg">
      <h2>HOW IT WORKS</h2>

      <div className="steps-grid">
        <div className="step-card">
          <span>1</span>
          <h4>Capture Image</h4>
          <p>
            Take or upload a clear image of your face using the front, left,
            or right view.
          </p>
        </div>

        <div className="step-card">
          <span>2</span>
          <h4>AI Image Analysis</h4>
          <p>
            The MobileNetV2 deep learning model processes the facial image
            and generates predictions based on its trained classes.
          </p>
        </div>

        <div className="step-card">
          <span>3</span>
          <h4>Combined Analysis</h4>
          <p>
            When multiple views are provided, their prediction probabilities
            are averaged to generate a consolidated result.
          </p>
        </div>

        <div className="step-card">
          <span>4</span>
          <h4>Skincare Recommendations</h4>
          <p>
            Review skincare information and product recommendations based
            on the available analysis and user preferences.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AboutUs() {
  return (
    <section id="about" className="info-section">
      <h2>ABOUT US</h2>

      <p className="section-desc">
        The AI Skincare Analysis System is an educational application that
        combines computer vision, deep learning, and image analysis to
        provide skincare-related insights. It includes multi-view image
        analysis, user-specific information, and skincare recommendations.
        The system is intended for educational purposes and does not replace
        professional dermatological assessment.
      </p>
    </section>
  );
}

export function AiModelInfo() {
  return (
    <section id="ai-model" className="info-section alt-bg">
      <h2>OUR AI MODEL</h2>

      <p className="section-desc">
        The system uses a MobileNetV2-based convolutional neural network
        to process facial images and generate predictions using the
        classes learned during training.
      </p>

      <div className="model-specs">
        <p>
          <strong>Primary Architecture:</strong> MobileNetV2
        </p>

        <p>
          <strong>AI Technique:</strong> Deep Convolutional Neural Network (CNN)
        </p>

        <p>
          <strong>Learning Approach:</strong> Transfer learning using
          MobileNetV2 pretrained weights
        </p>

        <p>
          <strong>Input Image Size:</strong> 224 × 224 pixels
        </p>

        <p>
          <strong>Input Format:</strong> RGB facial images
        </p>

        <p>
          <strong>Image Preprocessing:</strong> Image resizing and
          MobileNetV2 preprocessing
        </p>

        <p>
          <strong>Classification Method:</strong> Softmax output layer
          for class probabilities
        </p>

        <p>
          <strong>Multi-View Analysis:</strong> Averaging prediction
          probabilities from the available front, left, and right images
        </p>

        <p>
          <strong>Model Framework:</strong> TensorFlow and Keras
        </p>

        <p>
          <strong>AI Service:</strong> Python and Flask
        </p>

        <p>
          <strong>Trained Dataset Classes:</strong> Acne, blackheads,
          dark spots, pores, and wrinkles
        </p>

        <p>
          <strong>Displayed Labels:</strong> Acne, oily, dry, sensitive,
          and combination (display labels only; they do not represent
          additional trained classes)
        </p>

        <p>
          <strong>Output:</strong> Predicted class, confidence score,
          and class probability breakdown
        </p>

        <p>
          <strong>Model Limitation:</strong> Predictions depend on the
          training data and are not a medical diagnosis or a verified
          measurement of skin hydration.
        </p>
      </div>
    </section>
  );
}

export function Reviews() {
  return (
    <section id="reviews" className="info-section">
      <h2>USER REVIEWS</h2>

      <div className="reviews-grid">
        <div className="review-card">
          <p>
            "The interface makes it easy to upload images and explore
            skincare-related information."
          </p>
          <span>- Sample Review</span>
        </div>

        <div className="review-card">
          <p>
            "The multi-view analysis and recommendations make the
            application straightforward to use."
          </p>
          <span>- Sample Review</span>
        </div>
      </div>
    </section>
  );
}