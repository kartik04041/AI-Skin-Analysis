import React, { useState } from "react";
import SkinImageInput from "./SkinImageInput";

// Configuration for Affiliate Tag
const AFFILIATE_TAG = "yourtag-21"; // Replace with your actual affiliate tag

export const RECOMMENDATIONS = {
  acne: {
    title: "Acne-Prone Skin Plan",
    ingredients: ["Salicylic Acid (BHA)", "Niacinamide (5%)", "Zinc PCA"],
    amRoutine: ["Gel Cleanser", "5% Niacinamide Serum", "Matte SPF 50"],
    pmRoutine: ["Gentle Cleanser", "2% Salicylic Acid Liquid", "Oil-Free Hydrator"],
    avoid: "Heavy mineral oils, physical scrubs, and high-alcohol toners.",
    products: [
      {
        option: 1,
        cleanser: { name: "CeraVe Acne Foaming Cream Cleanser", price: "₹1,250", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=CeraVe+Acne+Foaming+Cream+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Paula's Choice 2% BHA Liquid Exfoliant", price: "₹2,700", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=Paula%27s+Choice+2%25+BHA+Liquid+Exfoliant&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Neutrogena Hydro Boost Oil-Free Water Gel", price: "₹950", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=Neutrogena+Hydro+Boost+Oil-Free+Water+Gel&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 2,
        cleanser: { name: "La Roche-Posay Effaclar Clarifying Cleansing Gel", price: "₹1,850", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Effaclar+Clarifying+Cleansing+Gel&tag=${AFFILIATE_TAG}` },
        treatment: { name: "The Ordinary Niacinamide 10% + Zinc 1%", price: "₹600", rating: "4.3 ⭐", link: `https://www.amazon.in/s?k=The+Ordinary+Niacinamide+10%25+%2B+Zinc+1%25&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Cetaphil Gentle Clear Oil-Free Acne Moisturizer", price: "₹890", rating: "4.2 ⭐", link: `https://www.amazon.in/s?k=Cetaphil+Gentle+Clear+Oil-Free+Acne+Moisturizer&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 3,
        cleanser: { name: "COSRX Good Morning Low pH Gel Cleanser", price: "₹750", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=COSRX+Good+Morning+Low+pH+Gel+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "PanOxyl Acne Foaming Wash (10% Benzoyl Peroxide)", price: "₹1,450", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=PanOxyl+Acne+Foaming+Wash&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Sebamed Clear Face Care Gel", price: "₹580", rating: "4.1 ⭐", link: `https://www.amazon.in/s?k=Sebamed+Clear+Face+Care+Gel&tag=${AFFILIATE_TAG}` }
      }
    ]
  },
  combination: {
    title: "Combination Skin Plan",
    ingredients: ["Hyaluronic Acid", "Niacinamide", "Lactic Acid (AHA)"],
    amRoutine: ["Balancing Gel Cleanser", "Hyaluronic Acid Serum", "Broad-Spectrum SPF 50"],
    pmRoutine: ["Mild Cleanser", "Lactic Acid Exfoliant (2x/wk)", "Lightweight Moisturizer"],
    avoid: "Extremely heavy butter creams applied over the entire face.",
    products: [
      {
        option: 1,
        cleanser: { name: "CeraVe Foaming Facial Cleanser", price: "₹1,100", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=CeraVe+Foaming+Facial+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "The Ordinary Lactic Acid 10% + HA", price: "₹750", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=The+Ordinary+Lactic+Acid+10%25+%2B+HA&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "La Roche-Posay Toleriane Double Repair Face Moisturizer", price: "₹2,100", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Toleriane+Double+Repair+Face+Moisturizer&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 2,
        cleanser: { name: "Cetaphil Daily Facial Cleanser", price: "₹550", rating: "4.3 ⭐", link: `https://www.amazon.in/s?k=Cetaphil+Daily+Facial+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Paula's Choice 10% Niacinamide Booster", price: "₹3,100", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Paula%27s+Choice+10%25+Niacinamide+Booster&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Clinique Moisture Surge 100H Auto-Replenishing Hydrator", price: "₹2,950", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=Clinique+Moisture+Surge+100H&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 3,
        cleanser: { name: "Youth To The People Superfood Antioxidant Cleanser", price: "₹3,400", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=Youth+To+The+People+Superfood+Antioxidant+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "COSRX BHA Blackhead Power Liquid", price: "₹1,290", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=COSRX+BHA+Blackhead+Power+Liquid&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Belif The True Cream Aqua Bomb", price: "₹1,800", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=Belif+The+True+Cream+Aqua+Bomb&tag=${AFFILIATE_TAG}` }
      }
    ]
  },
  dry: {
    title: "Dry Skin Plan",
    ingredients: ["Ceramides", "Squalane", "Glycerin"],
    amRoutine: ["Hydrating Cream Cleanser", "Hyaluronic Acid Serum", "Dewy SPF 50"],
    pmRoutine: ["Milk Cleanser", "Squalane Facial Oil", "Barrier Repair Cream"],
    avoid: "Foaming sulfate cleansers and hot water washing.",
    products: [
      {
        option: 1,
        cleanser: { name: "CeraVe Hydrating Facial Cleanser", price: "₹1,200", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=CeraVe+Hydrating+Facial+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "The Ordinary 100% Plant-Derived Squalane", price: "₹850", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=The+Ordinary+100%25+Plant-Derived+Squalane&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "First Aid Beauty Ultra Repair Cream", price: "₹2,600", rating: "4.8 ⭐", link: `https://www.amazon.in/s?k=First+Aid+Beauty+Ultra+Repair+Cream&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 2,
        cleanser: { name: "La Roche-Posay Toleriane Hydrating Gentle Cleanser", price: "₹1,750", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Toleriane+Hydrating+Gentle+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "The Inkey List Hyaluronic Acid Serum", price: "₹900", rating: "4.3 ⭐", link: `https://www.amazon.in/s?k=The+Inkey+List+Hyaluronic+Acid+Serum&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "CeraVe Moisturizing Cream (in the tub)", price: "₹1,400", rating: "4.8 ⭐", link: `https://www.amazon.in/s?k=CeraVe+Moisturizing+Cream&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 3,
        cleanser: { name: "Cetaphil Gentle Skin Cleanser", price: "₹399", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Cetaphil+Gentle+Skin+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Hada Labo Gokujyun Premium Hyaluronic Acid Lotion", price: "₹1,650", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=Hada+Labo+Gokujyun+Premium+Hyaluronic+Acid+Lotion&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Avene XeraCalm A.D Lipid-Replenishing Cream", price: "₹2,200", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=Avene+XeraCalm+A.D+Lipid-Replenishing+Cream&tag=${AFFILIATE_TAG}` }
      }
    ]
  },
  normal: {
    title: "Normal / Balanced Plan",
    ingredients: ["Vitamin C", "Peptides", "Antioxidants"],
    amRoutine: ["Gentle Cleanser", "Vitamin C Serum", "Daily Lotion SPF 50"],
    pmRoutine: ["Gentle Wash", "Peptide Serum", "Night Repair Cream"],
    avoid: "Over-exfoliating or constantly switching core products.",
    products: [
      {
        option: 1,
        cleanser: { name: "CeraVe Foaming Facial Cleanser", price: "₹1,100", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=CeraVe+Foaming+Facial+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Maelove The Glow Maker Vitamin C Serum", price: "₹2,800", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=Maelove+The+Glow+Maker&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "La Roche-Posay Lipikar Daily Repair Lotion", price: "₹1,950", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Lipikar+Daily+Repair+Lotion&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 2,
        cleanser: { name: "Kiehl's Ultra Facial Cleanser", price: "₹2,100", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Kiehl%27s+Ultra+Facial+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "The Ordinary Multi-Peptide + HA Serum ('Buffet')", price: "₹1,600", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=The+Ordinary+Multi-Peptide+%2B+HA+Serum&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Kiehl's Ultra Facial Cream", price: "₹1,750", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=Kiehl%27s+Ultra+Facial+Cream&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 3,
        cleanser: { name: "Fresh Soy Face Cleanser", price: "₹1,500", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Fresh+Soy+Face+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Timeless 20% Vitamin C + E Ferulic Acid Serum", price: "₹2,300", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Timeless+20%25+Vitamin+C&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Olay Regenerist Micro-Sculpting Cream", price: "₹1,699", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=Olay+Regenerist+Micro-Sculpting+Cream&tag=${AFFILIATE_TAG}` }
      }
    ]
  },
  oily: {
    title: "Oily Skin Plan",
    ingredients: ["Salicylic Acid (2%)", "Zinc PCA", "Niacinamide (10%)"],
    amRoutine: ["Clarifying Gel Cleanser", "10% Niacinamide + Zinc", "Oil-Control SPF 50"],
    pmRoutine: ["Foaming Cleanser", "2% BHA Liquid", "Water Gel Moisturizer"],
    avoid: "Pore-clogging heavy oils and harsh alcohol strips.",
    products: [
      {
        option: 1,
        cleanser: { name: "La Roche-Posay Effaclar Foaming Gel Cleanser", price: "₹1,850", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Effaclar+Foaming+Gel+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "The Ordinary Niacinamide 10% + Zinc 1%", price: "₹600", rating: "4.3 ⭐", link: `https://www.amazon.in/s?k=The+Ordinary+Niacinamide+10%25+%2B+Zinc+1%25&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Neutrogena Hydro Boost Water Gel", price: "₹950", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=Neutrogena+Hydro+Boost+Water+Gel&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 2,
        cleanser: { name: "CeraVe Renewing SA Cleanser", price: "₹1,350", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=CeraVe+Renewing+SA+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Paula's Choice Skin Balancing Pore-Reducing Toner", price: "₹2,200", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Paula%27s+Choice+Skin+Balancing+Pore-Reducing+Toner&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Paula's Choice Invisible Finish Moisture Gel", price: "₹2,600", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=Paula%27s+Choice+Invisible+Finish+Moisture+Gel&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 3,
        cleanser: { name: "Cetaphil Oily Skin Cleanser", price: "₹590", rating: "4.3 ⭐", link: `https://www.amazon.in/s?k=Cetaphil+Oily+Skin+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Minimalist 2% Salicylic Acid Serum", price: "₹599", rating: "4.2 ⭐", link: `https://www.amazon.in/s?k=Minimalist+2%25+Salicylic+Acid+Serum&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "La Roche-Posay Effaclar Mat Oil-Free Moisturizer", price: "₹1,950", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Effaclar+Mat+Oil-Free+Moisturizer&tag=${AFFILIATE_TAG}` }
      }
    ]
  },
  sensitive: {
    title: "Sensitive Skin Plan",
    ingredients: ["Centella Asiatica (Cica)", "Colloidal Oatmeal", "Ceramides"],
    amRoutine: ["Fragrance-Free Cleanser", "Cica Soothing Serum", "100% Mineral SPF 50"],
    pmRoutine: ["Ultra-Mild Cleanser", "Calming Oatmeal Cream"],
    avoid: "Added fragrances, essential oils, and high-strength acids.",
    products: [
      {
        option: 1,
        cleanser: { name: "Vanicream Gentle Facial Cleanser", price: "₹1,450", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=Vanicream+Gentle+Facial+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Skin1004 Madagascar Centella Ampoule", price: "₹1,350", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=Skin1004+Madagascar+Centella+Ampoule&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Aveeno Calm + Restore Oat Gel Moisturizer", price: "₹1,800", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Aveeno+Calm+%2B+Restore+Oat+Gel+Moisturizer&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 2,
        cleanser: { name: "La Roche-Posay Toleriane Dermo-Cleanser", price: "₹1,600", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Toleriane+Dermo-Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "Purito Wonder Re-leaf Centella Serum Unscented", price: "₹1,250", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Purito+Wonder+Re-leaf+Centella+Serum&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "La Roche-Posay Cicaplast Baume B5+", price: "₹1,150", rating: "4.7 ⭐", link: `https://www.amazon.in/s?k=La+Roche-Posay+Cicaplast+Baume+B5%2B&tag=${AFFILIATE_TAG}` }
      },
      {
        option: 3,
        cleanser: { name: "Cetaphil Gentle Skin Cleanser", price: "₹399", rating: "4.5 ⭐", link: `https://www.amazon.in/s?k=Cetaphil+Gentle+Skin+Cleanser&tag=${AFFILIATE_TAG}` },
        treatment: { name: "COSRX Advanced Snail 96 Mucin Power Essence", price: "₹1,450", rating: "4.6 ⭐", link: `https://www.amazon.in/s?k=COSRX+Advanced+Snail+96+Mucin+Power+Essence&tag=${AFFILIATE_TAG}` },
        moisturizer: { name: "Bioderma Sensibio Defensive Cream", price: "₹1,200", rating: "4.4 ⭐", link: `https://www.amazon.in/s?k=Bioderma+Sensibio+Defensive+Cream&tag=${AFFILIATE_TAG}` }
      }
    ]
  }
};

export default function AnalyzerWorkspace({
  userData,
  onUserDataChange,
  onImagesUpdated,
  onAnalyze,
  loading,
  analysis,
  error,
  isLoggedIn,
  onOpenAuth,
}) {
  const [savedProducts, setSavedProducts] = useState([]);

  const toggleSaveProduct = (productName) => {
    setSavedProducts((prev) =>
      prev.includes(productName)
        ? prev.filter((item) => item !== productName)
        : [...prev, productName]
    );
  };

  const key = analysis?.prediction?.toLowerCase();
  const activePlan = key && RECOMMENDATIONS[key] ? RECOMMENDATIONS[key] : RECOMMENDATIONS.normal;

  const renderProductItem = (typeLabel, item, emoji) => {
    const isSaved = savedProducts.includes(item.name);
    return (
      <li style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span>{emoji} <strong>{typeLabel}:</strong> {item.name}</span>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
            <span style={{ color: "#d63384", fontWeight: "bold", marginRight: "10px" }}>{item.price}</span>
            <span>{item.rating}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => toggleSaveProduct(item.name)}
            title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            {isSaved ? "❤️" : "🤍"}
          </button>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 12px",
              backgroundColor: "#e83e8c",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap"
            }}
          >
            Buy Now ↗
          </a>
        </div>
      </li>
    );
  };

  return (
    <div className="four-containers-wrapper">
      {/* CONTAINER 1: USER DETAILS */}
      <div className="pink-container container-details">
        <div className="container-header">
          <span className="container-num">01</span>
          <h3>User Profile & Skin Intake 📋</h3>
        </div>

        <div className="quiz-grid">
          <div className="form-group">
            <label>Gender</label>
            <select
              value={userData.gender}
              onChange={(e) => onUserDataChange("gender", e.target.value)}
              className="pink-input"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other / Non-Binary</option>
            </select>
          </div>

          <div className="form-group">
            <label>Age Group</label>
            <select
              value={userData.age}
              onChange={(e) => onUserDataChange("age", e.target.value)}
              className="pink-input"
            >
              <option value="Under 18">Under 18</option>
              <option value="18-24">18–24</option>
              <option value="25-34">25–34</option>
              <option value="35-44">35–44</option>
              <option value="45+">45+</option>
            </select>
          </div>

          <div className="form-group">
            <label>Primary Skin Concern</label>
            <select
              value={userData.concern}
              onChange={(e) => onUserDataChange("concern", e.target.value)}
              className="pink-input"
            >
              <option value="Acne & Breakouts">Acne & Breakouts</option>
              <option value="Dryness & Flakiness">Dryness & Flakiness</option>
              <option value="Excess Oil & Shine">Excess Oil & Shine</option>
              <option value="Sensitivity & Redness">Sensitivity & Redness</option>
              <option value="Hyperpigmentation">Hyperpigmentation & Dark Spots</option>
              <option value="Fine Lines & Aging">Fine Lines & Aging</option>
            </select>
          </div>

          <div className="form-group">
            <label>Secondary Concern</label>
            <select
              value={userData.secondaryConcern || "Enlarged Pores"}
              onChange={(e) => onUserDataChange("secondaryConcern", e.target.value)}
              className="pink-input"
            >
              <option value="Enlarged Pores">Enlarged Pores</option>
              <option value="Dark Circles">Dark Circles & Puffiness</option>
              <option value="Uneven Texture">Uneven Texture</option>
              <option value="Dehydration">Dehydration / Dullness</option>
              <option value="None">None</option>
            </select>
          </div>

          <div className="form-group">
            <label>Skin Sensitivity Level</label>
            <select
              value={userData.sensitivity || "Slightly Sensitive"}
              onChange={(e) => onUserDataChange("sensitivity", e.target.value)}
              className="pink-input"
            >
              <option value="Not Sensitive">Not Sensitive</option>
              <option value="Slightly Sensitive">Slightly Sensitive</option>
              <option value="Highly Sensitive">Highly Sensitive / Rosacea Prone</option>
            </select>
          </div>

          <div className="form-group">
            <label>Daily Water Intake</label>
            <select
              value={userData.waterIntake || "2L-3L"}
              onChange={(e) => onUserDataChange("waterIntake", e.target.value)}
              className="pink-input"
            >
              <option value="<1L">Less than 1L / day</option>
              <option value="1L-2L">1L – 2L / day</option>
              <option value="2L-3L">2L – 3L / day</option>
              <option value="3L+">3L+ / day</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sleep & Lifestyle</label>
            <select
              value={userData.sleep || "7-9 hours"}
              onChange={(e) => onUserDataChange("sleep", e.target.value)}
              className="pink-input"
            >
              <option value="Under 5 hours">Under 5 hours</option>
              <option value="5-7 hours">5–7 hours</option>
              <option value="7-9 hours">7–9 hours</option>
              <option value="9+ hours">9+ hours</option>
            </select>
          </div>

          <div className="form-group">
            <label>Climate / Environment</label>
            <select
              value={userData.climate || "Moderate"}
              onChange={(e) => onUserDataChange("climate", e.target.value)}
              className="pink-input"
            >
              <option value="Hot & Humid">Hot & Humid</option>
              <option value="Dry & Arid">Dry & Arid</option>
              <option value="Cold & Windy">Cold & Windy</option>
              <option value="Moderate">Moderate / Seasonal</option>
            </select>
          </div>

          <div className="form-group">
            <label>Lighting Parameter</label>
            <select
              value={userData.lighting || "Natural Daylight"}
              onChange={(e) => onUserDataChange("lighting", e.target.value)}
              className="pink-input"
            >
              <option value="Natural Daylight">☀️ Natural Daylight</option>
              <option value="Indoor Warm/Yellow">💡 Indoor Warm Light</option>
              <option value="Cool White/Ring Light">⚪ Ring Light / White LED</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTAINER 2: MULTI-ANGLE CAMERA CAPTURE */}
      <div className="pink-container container-capture">
        <div className="container-header">
          <span className="container-num">02</span>
          <h3>Facial Capture & Image Scan 📸</h3>
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
              if (onOpenAuth) onOpenAuth();
            } else {
              onAnalyze();
            }
          }}
          disabled={loading}
        >
          {loading
            ? "✨ Running Ensemble AI Analysis..."
            : isLoggedIn
            ? "💖 Run Diagnostic Scan"
            : "🔑 Login to Run Diagnostic Scan"}
        </button>

        {error && <div className="pink-error-banner">⚠️ {error}</div>}
      </div>

      {/* CONTAINER 3: AI DIAGNOSTIC ANALYSIS */}
      <div className="pink-container container-analysis">
        <div className="container-header">
          <span className="container-num">03</span>
          <h3>AI Diagnostic Analysis 🧬</h3>
        </div>

        {analysis ? (
          <div className="analysis-results">
            <div className="result-hero-badge">
              <span className="badge-title">{analysis.prediction} Skin</span>
              <span className="badge-conf">
                {(analysis.confidence * 100).toFixed(1)}% Match
              </span>
            </div>

            <div className="prob-bars-stack">
              <h4>Probability Breakdown</h4>
              {analysis.probabilities &&
                Object.entries(analysis.probabilities).map(([stype, prob]) => (
                  <div key={stype} className="prob-item">
                    <span className="prob-name">{stype}</span>
                    <div className="prob-track">
                      <div
                        className="prob-fill"
                        style={{ width: `${(prob * 100).toFixed(1)}%` }}
                      ></div>
                    </div>
                    <span className="prob-num">{(prob * 100).toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="placeholder-state">
            <div className="placeholder-icon">🔬</div>
            <p>Complete steps #1 & #2 to view AI analysis results.</p>
          </div>
        )}
      </div>

      {/* CONTAINER 4: RECOMMENDATIONS & ROUTINE */}
      <div className="pink-container container-recommendations">
        <div className="container-header">
          <span className="container-num">04</span>
          <h3>Clinical Recommendations & Routine 🧴</h3>
        </div>

        {analysis ? (
          <div className="recommendations-content">
            <div className="recs-box">
              <h4>{activePlan.title}</h4>
              <div className="rec-group">
                <strong>🌸 Key Ingredients:</strong>
                <p>{activePlan.ingredients.join(", ")}</p>
              </div>
              <div className="rec-group">
                <strong>🚫 Ingredients to Avoid:</strong>
                <p>{activePlan.avoid}</p>
              </div>
            </div>

            <div className="routine-tables" style={{ marginTop: "20px" }}>
              <div className="routine-card am-card">
                <h4>☀️ Morning Routine (AM)</h4>
                <ul>
                  {activePlan.amRoutine.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-num">{idx + 1}</span> {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="routine-card pm-card">
                <h4>🌙 Evening Routine (PM)</h4>
                <ul>
                  {activePlan.pmRoutine.map((step, idx) => (
                    <li key={idx}>
                      <span className="step-num">{idx + 1}</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="product-suggestions" style={{ marginTop: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4>🛍️ Curated Product Sets (Direct Buy)</h4>
                {savedProducts.length > 0 && (
                  <span style={{ fontSize: "12px", color: "#e83e8c", fontWeight: "bold" }}>
                    ❤️ {savedProducts.length} Saved to Wishlist
                  </span>
                )}
              </div>
              <div className="product-options-grid">
                {activePlan.products.map((p) => (
                  <div key={p.option} className="product-card" style={{ border: "1px solid #f2c9d8", padding: "14px", borderRadius: "8px", marginBottom: "12px", backgroundColor: "#fff" }}>
                    <strong style={{ color: "#d63384" }}>Option {p.option}</strong>
                    <ul style={{ listStyleType: "none", paddingLeft: "0", marginTop: "10px" }}>
                      {renderProductItem("Cleanser", p.cleanser, "🧴")}
                      {renderProductItem("Treatment", p.treatment, "🧪")}
                      {renderProductItem("Moisturizer", p.moisturizer, "💧")}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="placeholder-state">
            <div className="placeholder-icon">🌸</div>
            <p>Run diagnostic scan to unlock custom ingredients & daily routine.</p>
          </div>
        )}
      </div>
    </div>
  );
}