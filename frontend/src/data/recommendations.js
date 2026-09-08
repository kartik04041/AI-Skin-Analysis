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
        cleanser: "CeraVe Acne Foaming Cream Cleanser",
        treatment: "Paula's Choice 2% BHA Liquid Exfoliant",
        moisturizer: "Neutrogena Hydro Boost Oil-Free Water Gel"
      },
      {
        option: 2,
        cleanser: "La Roche-Posay Effaclar Clarifying Cleansing Gel",
        treatment: "The Ordinary Niacinamide 10% + Zinc 1%",
        moisturizer: "Cetaphil Gentle Clear Oil-Free Acne Moisturizer"
      },
      {
        option: 3,
        cleanser: "COSRX Good Morning Low pH Gel Cleanser",
        treatment: "PanOxyl Acne Foaming Wash (10% Benzoyl Peroxide)",
        moisturizer: "Sebamed Clear Face Care Gel"
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
        cleanser: "CeraVe Foaming Facial Cleanser",
        treatment: "The Ordinary Lactic Acid 10% + HA",
        moisturizer: "La Roche-Posay Toleriane Double Repair Face Moisturizer"
      },
      {
        option: 2,
        cleanser: "Cetaphil Daily Facial Cleanser",
        treatment: "Paula's Choice 10% Niacinamide Booster",
        moisturizer: "Clinique Moisture Surge 100H Auto-Replenishing Hydrator"
      },
      {
        option: 3,
        cleanser: "Youth To The People Superfood Antioxidant Cleanser",
        treatment: "COSRX BHA Blackhead Power Liquid",
        moisturizer: "Belif The True Cream Aqua Bomb"
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
        cleanser: "CeraVe Hydrating Facial Cleanser",
        treatment: "The Ordinary 100% Plant-Derived Squalane",
        moisturizer: "First Aid Beauty Ultra Repair Cream"
      },
      {
        option: 2,
        cleanser: "La Roche-Posay Toleriane Hydrating Gentle Cleanser",
        treatment: "The Inkey List Hyaluronic Acid Serum",
        moisturizer: "CeraVe Moisturizing Cream (in the tub)"
      },
      {
        option: 3,
        cleanser: "Cetaphil Gentle Skin Cleanser",
        treatment: "Hada Labo Gokujyun Premium Hyaluronic Acid Lotion",
        moisturizer: "Avene XeraCalm A.D Lipid-Replenishing Cream"
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
        cleanser: "CeraVe Foaming Facial Cleanser",
        treatment: "Maelove The Glow Maker Vitamin C Serum",
        moisturizer: "La Roche-Posay Lipikar Daily Repair Lotion"
      },
      {
        option: 2,
        cleanser: "Kiehl's Ultra Facial Cleanser",
        treatment: "The Ordinary Multi-Peptide + HA Serum ('Buffet')",
        moisturizer: "Kiehl's Ultra Facial Cream"
      },
      {
        option: 3,
        cleanser: "Fresh Soy Face Cleanser",
        treatment: "Timeless 20% Vitamin C + E Ferulic Acid Serum",
        moisturizer: "Olay Regenerist Micro-Sculpting Cream"
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
        cleanser: "La Roche-Posay Effaclar Foaming Gel Cleanser",
        treatment: "The Ordinary Niacinamide 10% + Zinc 1%",
        moisturizer: "Neutrogena Hydro Boost Water Gel"
      },
      {
        option: 2,
        cleanser: "CeraVe Renewing SA Cleanser",
        treatment: "Paula's Choice Skin Balancing Pore-Reducing Toner",
        moisturizer: "Paula's Choice Invisible Finish Moisture Gel"
      },
      {
        option: 3,
        cleanser: "Cetaphil Oily Skin Cleanser",
        treatment: "Minimalist 2% Salicylic Acid Serum",
        moisturizer: "La Roche-Posay Effaclar Mat Oil-Free Moisturizer"
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
        cleanser: "Vanicream Gentle Facial Cleanser",
        treatment: "Skin1004 Madagascar Centella Ampoule",
        moisturizer: "Aveeno Calm + Restore Oat Gel Moisturizer"
      },
      {
        option: 2,
        cleanser: "La Roche-Posay Toleriane Dermo-Cleanser",
        treatment: "Purito Wonder Re-leaf Centella Serum Unscented",
        moisturizer: "La Roche-Posay Cicaplast Baume B5+"
      },
      {
        option: 3,
        cleanser: "Cetaphil Gentle Skin Cleanser",
        treatment: "COSRX Advanced Snail 96 Mucin Power Essence",
        moisturizer: "Bioderma Sensibio Defensive Cream"
      }
    ]
  }
};