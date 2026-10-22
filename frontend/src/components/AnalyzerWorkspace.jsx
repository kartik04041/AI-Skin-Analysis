
import React, { useState } from "react";
import SkinImageInput from "./SkinImageInput";
import "./AnalyzerWorkspace.css";

const SHOP_EVENT = "skin-shop-action";

// These IDs must match the products returned by GET /api/shop/products.

const SHOP_PRODUCTS = {
  cleanser: {
    id: "skin-001",
    name: "Gentle Foaming Cleanser",
    price: 499,
    rating: "4.5 ⭐",
    category: "Cleanser",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600&auto=format&fit=crop&q=80",
  },

  treatment: {
    id: "skin-002",
    name: "Salicylic Acid Serum",
    price: 599,
    rating: "4.5 ⭐",
    category: "Treatment",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80",
  },

  niacinamide: {
    id: "skin-003",
    name: "Niacinamide Serum",
    price: 549,
    rating: "4.5 ⭐",
    category: "Treatment",
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
  },

  moisturizer: {
    id: "skin-004",
    name: "Hydrating Moisturizer",
    price: 450,
    rating: "4.4 ⭐",
    category: "Moisturizer",
    image:
      "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=600&auto=format&fit=crop&q=80",
  },

  sunscreen: {
    id: "skin-005",
    name: "Daily Sunscreen SPF 50",
    price: 699,
    rating: "4.5 ⭐",
    category: "Sunscreen",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
  },

  hydratingSerum: {
    id: "rec-004",
    name: "Hyaluronic Acid Serum",
    price: 399,
    rating: "4.4 ⭐",
    category: "Treatment",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  },

  barrierCream: {
    id: "rec-005",
    name: "Ceramide Moisturizer",
    price: 449,
    rating: "4.5 ⭐",
    category: "Moisturizer",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80",
  },

  oilFree: {
    id: "rec-002",
    name: "Oil-Free Moisturizer",
    price: 349,
    rating: "4.3 ⭐",
    category: "Moisturizer",
    image:
      "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=600&auto=format&fit=crop&q=80",
  },

  soothingSerum: {
    id: "rec-009",
    name: "Panthenol Soothing Serum",
    price: 399,
    rating: "4.4 ⭐",
    category: "Treatment",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
  },
};


const PRODUCT_IMAGES = {
  cleanser:
    "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600&auto=format&fit=crop&q=80",
  serum:
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80",
  niacinamide:
    "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
  moisturizer:
    "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=600&auto=format&fit=crop&q=80",
  sunscreen:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
  hydratingSerum:
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
};

const RECOMMENDATIONS = {
  acne: {
    title: "Acne-Prone Skin Plan",
    ingredients: ["Salicylic Acid", "Niacinamide", "Zinc PCA"],
    avoid: "Harsh scrubs, excessive exfoliation, and products that irritate your skin.",
    amRoutine: [
      "Cleanse with a gentle cleanser",
      "Use a suitable niacinamide serum",
      "Apply a non-comedogenic moisturizer",
      "Finish with broad-spectrum SPF 50",
    ],
    pmRoutine: [
      "Cleanse gently",
      "Use salicylic acid gradually if tolerated",
      "Apply a lightweight moisturizer",
    ],
    products: [
      { ...SHOP_PRODUCTS.cleanser, key: "cleanser" },
      { ...SHOP_PRODUCTS.treatment, key: "treatment" },
      { ...SHOP_PRODUCTS.oilFree, key: "moisturizer" },
      { ...SHOP_PRODUCTS.sunscreen, key: "sunscreen" },
    ],
  },
  oily: {
    title: "Oily Skin Plan",
    ingredients: ["Salicylic Acid", "Niacinamide", "Lightweight Hydrators"],
    avoid: "Harsh alcohol-based products and overly aggressive cleansing.",
    amRoutine: [
      "Use a gentle foaming cleanser",
      "Apply niacinamide serum if tolerated",
      "Use an oil-free moisturizer",
      "Apply broad-spectrum SPF 50",
    ],
    pmRoutine: [
      "Cleanse to remove sunscreen and impurities",
      "Use a suitable treatment gradually",
      "Apply a lightweight moisturizer",
    ],
    products: [
      { ...SHOP_PRODUCTS.cleanser, key: "cleanser" },
      { ...SHOP_PRODUCTS.niacinamide, key: "treatment" },
      { ...SHOP_PRODUCTS.oilFree, key: "moisturizer" },
      { ...SHOP_PRODUCTS.sunscreen, key: "sunscreen" },
    ],
  },
  dry: {
    title: "Dry Skin Plan",
    ingredients: ["Ceramides", "Hyaluronic Acid", "Glycerin"],
    avoid: "Over-cleansing, very hot water, and products that leave skin feeling tight.",
    amRoutine: [
      "Cleanse gently without stripping the skin",
      "Apply a hydrating serum",
      "Use a ceramide-rich moisturizer",
      "Finish with broad-spectrum SPF 50",
    ],
    pmRoutine: [
      "Use a gentle cleanser",
      "Apply a hydrating serum to slightly damp skin",
      "Apply a barrier-supporting moisturizer",
    ],
    products: [
      { ...SHOP_PRODUCTS.cleanser, key: "cleanser" },
      { ...SHOP_PRODUCTS.hydratingSerum, key: "treatment" },
      { ...SHOP_PRODUCTS.barrierCream, key: "moisturizer" },
      { ...SHOP_PRODUCTS.sunscreen, key: "sunscreen" },
    ],
  },
  sensitive: {
    title: "Sensitive Skin Plan",
    ingredients: ["Ceramides", "Panthenol", "Gentle Hydrators"],
    avoid: "Fragrances and introducing several new active ingredients at once.",
    amRoutine: [
      "Use a gentle fragrance-free cleanser",
      "Apply a soothing product if tolerated",
      "Moisturize to support the skin barrier",
      "Use broad-spectrum SPF 50",
    ],
    pmRoutine: [
      "Cleanse with lukewarm water",
      "Apply a soothing hydrating serum",
      "Use a barrier-supporting moisturizer",
    ],
    products: [
      { ...SHOP_PRODUCTS.cleanser, key: "cleanser" },
      { ...SHOP_PRODUCTS.soothingSerum, key: "treatment" },
      { ...SHOP_PRODUCTS.barrierCream, key: "moisturizer" },
      { ...SHOP_PRODUCTS.sunscreen, key: "sunscreen" },
    ],
  },
  combination: {
    title: "Combination Skin Plan",
    ingredients: ["Niacinamide", "Hyaluronic Acid", "Ceramides"],
    avoid: "Using excessively heavy or drying products across the entire face.",
    amRoutine: [
      "Use a balanced gentle cleanser",
      "Apply a lightweight hydrating serum",
      "Moisturize according to your skin's needs",
      "Finish with broad-spectrum SPF 50",
    ],
    pmRoutine: [
      "Cleanse gently",
      "Apply a suitable serum",
      "Use a lightweight moisturizer",
    ],
    products: [
      { ...SHOP_PRODUCTS.cleanser, key: "cleanser" },
      { ...SHOP_PRODUCTS.niacinamide, key: "treatment" },
      { ...SHOP_PRODUCTS.moisturizer, key: "moisturizer" },
      { ...SHOP_PRODUCTS.sunscreen, key: "sunscreen" },
    ],
  },
  normal: {
    title: "Normal / Balanced Skin Plan",
    ingredients: ["Antioxidants", "Niacinamide", "Ceramides"],
    avoid: "Over-exfoliating or changing your entire routine too frequently.",
    amRoutine: [
      "Cleanse with a gentle cleanser",
      "Apply a serum if needed",
      "Use a comfortable moisturizer",
      "Finish with broad-spectrum SPF 50",
    ],
    pmRoutine: [
      "Cleanse gently",
      "Apply a suitable hydrating serum",
      "Use a moisturizer",
    ],
    products: [
      { ...SHOP_PRODUCTS.cleanser, key: "cleanser" },
      { ...SHOP_PRODUCTS.niacinamide, key: "treatment" },
      { ...SHOP_PRODUCTS.moisturizer, key: "moisturizer" },
      { ...SHOP_PRODUCTS.sunscreen, key: "sunscreen" },
    ],
  },
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function getSkinType(prediction) {
  const value = normalize(prediction);

  if (value.includes("acne")) return "acne";
  if (value.includes("oily")) return "oily";
  if (value.includes("dry")) return "dry";
  if (value.includes("sensitive")) return "sensitive";
  if (value.includes("combination")) return "combination";

  return "normal";
}

export { RECOMMENDATIONS };

export default function AnalyzerWorkspace({
  userData = {},
  onUserDataChange = () => {},
  onImagesUpdated = () => {},
  onAnalyze = () => {},
  loading = false,
  analysis = null,
  error = "",
  isLoggedIn = false,
  onOpenAuth = () => {},
}) {
  const [savedProducts, setSavedProducts] = useState([]);

  const skinType = getSkinType(analysis?.prediction);
  const activePlan = RECOMMENDATIONS[skinType];

  function updateField(field, value) {
    onUserDataChange(field, value);
  }

  function toggleSaveProduct(productName) {
    setSavedProducts((previous) =>
      previous.includes(productName)
        ? previous.filter((name) => name !== productName)
        : [...previous, productName]
    );
  }

  function handleBuyNow(product) {
    if (!isLoggedIn) {
      onOpenAuth("login");
      return;
    }

    if (!product?.id) {
      window.alert("This product is missing its shop product ID.");
      return;
    }

    // Send the actual backend catalogue ID, not a recommendation name.
    window.dispatchEvent(
      new CustomEvent(SHOP_EVENT, {
        detail: {
          type: "buy",
          productId: product.id,
          productName: product.name,
          price: product.price,
          category: product.category,
        },
      })
    );
  }

  function renderSelect({
    label,
    field,
    defaultValue,
    options,
  }) {
    const value = userData[field] || defaultValue;

    return (
      <div className="form-group" key={field}>
        <label htmlFor={`skin-field-${field}`}>{label}</label>
        <select
          id={`skin-field-${field}`}
          className="pink-input"
          value={value}
          onChange={(event) => updateField(field, event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="four-containers-wrapper">
      {/* 01 — USER PROFILE AND SKIN QUESTIONNAIRE */}
      <section className="pink-container container-details">
        <div className="container-header">
          <span className="container-num">01</span>
          <h3>User Profile &amp; Skin Intake 📋</h3>
        </div>

        <div className="quiz-grid">
          {renderSelect({
            label: "Gender",
            field: "gender",
            defaultValue: "Female",
            options: [
              { value: "Female", label: "Female" },
              { value: "Male", label: "Male" },
              { value: "Other", label: "Other / Non-Binary" },
            ],
          })}

          {renderSelect({
            label: "Age Group",
            field: "age",
            defaultValue: "18-24",
            options: [
              { value: "Under 18", label: "Under 18" },
              { value: "18-24", label: "18–24" },
              { value: "25-34", label: "25–34" },
              { value: "35-44", label: "35–44" },
              { value: "45+", label: "45+" },
            ],
          })}

          {renderSelect({
            label: "Primary Skin Concern",
            field: "concern",
            defaultValue: "Acne & Breakouts",
            options: [
              { value: "Acne & Breakouts", label: "Acne & Breakouts" },
              { value: "Dryness & Flakiness", label: "Dryness & Flakiness" },
              { value: "Excess Oil & Shine", label: "Excess Oil & Shine" },
              { value: "Sensitivity & Redness", label: "Sensitivity & Redness" },
              { value: "Hyperpigmentation", label: "Hyperpigmentation & Dark Spots" },
              { value: "Fine Lines & Aging", label: "Fine Lines & Aging" },
            ],
          })}

          {renderSelect({
            label: "Secondary Concern",
            field: "secondaryConcern",
            defaultValue: "Enlarged Pores",
            options: [
              { value: "Enlarged Pores", label: "Enlarged Pores" },
              { value: "Dark Circles", label: "Dark Circles & Puffiness" },
              { value: "Uneven Texture", label: "Uneven Texture" },
              { value: "Dehydration", label: "Dehydration / Dullness" },
              { value: "None", label: "None" },
            ],
          })}

          {renderSelect({
            label: "Skin Sensitivity Level",
            field: "sensitivity",
            defaultValue: "Slightly Sensitive",
            options: [
              { value: "Not Sensitive", label: "Not Sensitive" },
              { value: "Slightly Sensitive", label: "Slightly Sensitive" },
              { value: "Highly Sensitive", label: "Highly Sensitive" },
            ],
          })}

          {renderSelect({
            label: "Daily Water Intake",
            field: "waterIntake",
            defaultValue: "2L-3L",
            options: [
              { value: "<1L", label: "Less than 1L" },
              { value: "1L-2L", label: "1L–2L" },
              { value: "2L-3L", label: "2L–3L" },
              { value: "3L+", label: "3L+" },
            ],
          })}

          {renderSelect({
            label: "Sleep & Lifestyle",
            field: "sleep",
            defaultValue: "7-9 hours",
            options: [
              { value: "Under 5 hours", label: "Under 5 hours" },
              { value: "5-7 hours", label: "5–7 hours" },
              { value: "7-9 hours", label: "7–9 hours" },
              { value: "9+ hours", label: "9+ hours" },
            ],
          })}

          {renderSelect({
            label: "Climate / Environment",
            field: "climate",
            defaultValue: "Moderate",
            options: [
              { value: "Hot & Humid", label: "Hot & Humid" },
              { value: "Dry & Arid", label: "Dry & Arid" },
              { value: "Cold & Windy", label: "Cold & Windy" },
              { value: "Moderate", label: "Moderate / Seasonal" },
            ],
          })}

          {renderSelect({
            label: "Lighting Parameter",
            field: "lighting",
            defaultValue: "Natural Daylight",
            options: [
              { value: "Natural Daylight", label: "☀️ Natural Daylight" },
              { value: "Indoor Warm/Yellow", label: "💡 Indoor Warm Light" },
              { value: "Cool White/Ring Light", label: "⚪ Ring Light / White LED" },
            ],
          })}
        </div>
      </section>

      {/* 02 — MULTI-ANGLE IMAGE CAPTURE */}
      <section className="pink-container container-capture">
        <div className="container-header">
          <span className="container-num">02</span>
          <h3>Facial Capture &amp; Image Scan 📸</h3>
        </div>

        <SkinImageInput
          onImagesUpdated={onImagesUpdated}
          isLoggedIn={isLoggedIn}
          onOpenAuth={onOpenAuth}
        />

        <button
          type="button"
          className="pink-action-btn"
          onClick={() => {
            if (!isLoggedIn) {
              onOpenAuth("login");
              return;
            }

            onAnalyze();
          }}
          disabled={loading}
        >
          {loading
            ? "✨ Running AI Analysis..."
            : isLoggedIn
              ? "💖 Run Diagnostic Scan"
              : "🔑 Login to Run Diagnostic Scan"}
        </button>

        {error ? (
          <div className="pink-error-banner" role="alert">
            ⚠️ {error}
          </div>
        ) : null}
      </section>

      {/* 03 — AI ANALYSIS RESULTS */}
      <section className="pink-container container-analysis">
        <div className="container-header">
          <span className="container-num">03</span>
          <h3>AI Skin Analysis 🧬</h3>
        </div>

        {analysis ? (
          <div className="analysis-results">
            <div className="result-hero-badge">
              <span className="badge-title">
                {analysis.prediction || "Skin"} Skin
              </span>
              <span className="badge-conf">
                {Number(analysis.confidence || 0) <= 1
                  ? `${(Number(analysis.confidence || 0) * 100).toFixed(1)}% Match`
                  : `${Number(analysis.confidence).toFixed(1)}% Match`}
              </span>
            </div>

            {analysis.probabilities &&
            Object.keys(analysis.probabilities).length > 0 ? (
              <div className="prob-bars-stack">
                <h4>Probability Breakdown</h4>

                {Object.entries(analysis.probabilities).map(([type, rawValue]) => {
                  const probability = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(rawValue) <= 1
                        ? Number(rawValue) * 100
                        : Number(rawValue)
                    )
                  );

                  return (
                    <div className="prob-item" key={type}>
                      <span className="prob-name">{type}</span>
                      <div className="prob-track">
                        <div
                          className="prob-fill"
                          style={{ width: `${probability}%` }}
                        />
                      </div>
                      <span className="prob-num">
                        {probability.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>
                Your analysis is complete. A probability breakdown was not
                provided by the analysis service.
              </p>
            )}

            <p className="skin-analysis-disclaimer">
              This result provides skincare guidance, not a medical diagnosis.
              Lighting, image quality, and the model can affect predictions.
            </p>
          </div>
        ) : (
          <div className="placeholder-state">
            <div className="placeholder-icon">🔬</div>
            <p>Complete the questionnaire and image capture, then run your scan.</p>
          </div>
        )}
      </section>

      {/* 04 — PERSONALIZED ROUTINE AND SHOP PRODUCTS */}
      <section className="pink-container container-recommendations">
        <div className="container-header">
          <span className="container-num">04</span>
          <h3>Skincare Recommendations &amp; Routine 🧴</h3>
        </div>

        {analysis ? (
          <div className="recommendations-content">
            <div className="recs-box">
              <h4>{activePlan.title}</h4>

              <div className="rec-group">
                <strong>🌸 Suggested Ingredients:</strong>
                <p>{activePlan.ingredients.join(", ")}</p>
              </div>

              <div className="rec-group">
                <strong>🚫 Use Caution With:</strong>
                <p>{activePlan.avoid}</p>
              </div>
            </div>

            <div className="routine-tables" style={{ marginTop: 20 }}>
              <div className="routine-card am-card">
                <h4>☀️ Morning Routine</h4>
                <ul>
                  {activePlan.amRoutine.map((step, index) => (
                    <li key={`${skinType}-am-${index}`}>
                      <span className="step-num">{index + 1}</span> {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="routine-card pm-card">
                <h4>🌙 Evening Routine</h4>
                <ul>
                  {activePlan.pmRoutine.map((step, index) => (
                    <li key={`${skinType}-pm-${index}`}>
                      <span className="step-num">{index + 1}</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="product-suggestions" style={{ marginTop: 25 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <h4>🛍️ Recommended Products</h4>
                {savedProducts.length > 0 ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#e83e8c",
                      fontWeight: "bold",
                    }}
                  >
                    ❤️ {savedProducts.length} saved
                  </span>
                ) : null}
              </div>

              
<div className="product-options-grid">
  {activePlan.products.map((product) => {
    const isSaved = savedProducts.includes(product.name);

    return (
      <article
        key={`${skinType}-${product.id}`}
        className="product-card"
        style={{
          border: "1px solid rgba(109, 40, 217, 0.25)",
          padding: 16,
          borderRadius: 14,
          marginBottom: 12,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(241,232,255,0.96))",
          boxShadow: "0 8px 22px rgba(66, 30, 105, 0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                color: "#5b21b6",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                background: "rgba(221, 204, 255, 0.65)",
                padding: "5px 9px",
                borderRadius: 20,
                border: "1px solid rgba(109, 40, 217, 0.18)",
              }}
            >
              {product.category}
            </span>

            <img
              className="recommended-product-image"
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <h4
              style={{
                margin: "10px 0 12px",
                color: "#32104f",
                fontSize: 17,
                fontWeight: 850,
                lineHeight: 1.45,
                opacity: 1,
                textShadow: "none",
                overflowWrap: "anywhere",
                WebkitTextFillColor: "#32104f",
              }}
            >
              {product.name}
            </h4>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <strong
                style={{
                  color: "#4c1d75",
                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                ₹{product.price}
              </strong>

              <span
                style={{
                  color: "#6b4b80",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ⭐ {product.rating}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleSaveProduct(product.name)}
            title={
              isSaved
                ? "Remove from saved products"
                : "Save product"
            }
            aria-label={
              isSaved
                ? `Remove ${product.name} from saved products`
                : `Save ${product.name}`
            }
            style={{
              flexShrink: 0,
              background: "rgba(231, 218, 255, 0.8)",
              border: "1px solid rgba(109, 40, 217, 0.18)",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 20,
              width: 40,
              height: 40,
            }}
          >
            {isSaved ? "❤️" : "🤍"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleBuyNow(product)}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px 14px",
            background: "linear-gradient(135deg, #6d28d9, #3b0764)",
            color: "#ffffff",
            border: "1px solid rgba(109, 40, 217, 0.35)",
            borderRadius: 9,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 800,
            boxShadow: "0 5px 14px rgba(76, 29, 117, 0.2)",
          }}
        >
          Buy Now 🛒
        </button>
      </article>
    );
  })}
</div>


              <p style={{ fontSize: 12, color: "#666666", marginTop: 12 }}>
                Product suggestions are general skincare guidance. Check
                ingredient lists and patch-test new products, especially if
                your skin is sensitive.
              </p>
            </div>
          </div>
        ) : (
          <div className="placeholder-state">
            <div className="placeholder-icon">🌸</div>
            <p>Run your analysis to see a personalized routine and products.</p>
          </div>
        )}
      </section>
    </div>
  );
}
