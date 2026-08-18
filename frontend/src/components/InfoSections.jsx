import React from "react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="info-section alt-bg">
      <h2>HOW IT WORKS</h2>
      <div className="steps-grid">
        <div className="step-card">
          <span>1</span>
          <h4>Capture Image</h4>
          <p>Take or upload a high-resolution photo of your cheek or T-zone area.</p>
        </div>
        <div className="step-card">
          <span>2</span>
          <h4>Neural Scan</h4>
          <p>Our MobileNetV2 AI analyzes pore texture, surface shine, and hydration levels.</p>
        </div>
        <div className="step-card">
          <span>3</span>
          <h4>Get Care Plan</h4>
          <p>Receive immediate ingredient recommendations and personalized AM/PM routines.</p>
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
        We combine computer vision deep learning with evidence-based dermatological science to bring accessible, personalized skincare insights to everyone.
      </p>
    </section>
  );
}

export function AiModelInfo() {
  return (
    <section id="ai-model" className="info-section alt-bg">
      <h2>OUR AI MODEL</h2>
      <div className="model-specs">
        <p><strong>Architecture:</strong> Deep Convolutional Neural Network (MobileNetV2)</p>
        <p><strong>Input Size:</strong> 224x224 RGB Surface Imagery</p>
        <p><strong>Class Coverage:</strong> Acne, Combination, Dry, Normal, Oily, Sensitive</p>
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
          <p>"Identified my combination skin accurately and saved me from using damaging heavy creams!"</p>
          <span>- Sarah M.</span>
        </div>
        <div className="review-card">
          <p>"The BHA routine recommendation cleared my T-zone breakout within two weeks."</p>
          <span>- David K.</span>
        </div>
      </div>
    </section>
  );
}