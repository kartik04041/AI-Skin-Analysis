
/*
 * AI SKINCARE ANALYSIS SYSTEM
 * Synthetic Demo Data Generator
 *
 * Creates:
 * 50 demo users
 * 100 demo skin analysis records
 * 60 demo orders
 * 30 demo reviews
 *
 * Safety:
 * - Does not delete existing records.
 * - Does not create products.
 * - Does not change the trained AI model.
 * - Demo records are clearly marked.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const crypto = require("crypto");

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/skin_analysis_db";

const DEMO_PREFIX = "DEMO_SEED_2026_";

const skinTypes = [
  "Oily",
  "Dry",
  "Combination",
  "Sensitive",
  "Normal",
];

const concerns = [
  "Acne",
  "Blackheads",
  "Dark spots",
  "Visible pores",
  "Dryness",
  "Uneven skin tone",
  "Excess oil",
  "Fine lines",
];

const orderStatuses = [
  "Order Placed",
  "Confirmed",
  "To Be Shipped",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const products = [
  { name: "Gentle Foaming Cleanser", price: 399 },
  { name: "Hydrating Face Wash", price: 349 },
  { name: "Niacinamide Serum", price: 499 },
  { name: "Daily Moisturizer", price: 449 },
  { name: "SPF 50 Sunscreen", price: 599 },
  { name: "Aloe Vera Gel", price: 249 },
  { name: "Ceramide Barrier Cream", price: 649 },
  { name: "Hyaluronic Acid Serum", price: 599 },
  { name: "Oil-Free Gel Moisturizer", price: 399 },
  { name: "Vitamin C Serum", price: 699 },
];

const firstNames = [
  "Aarav", "Aanya", "Rohan", "Priya", "Ishaan",
  "Neha", "Kabir", "Meera", "Arjun", "Sana",
  "Dev", "Anaya", "Vivaan", "Diya", "Reyansh",
  "Kiara", "Aditya", "Ira", "Rahul", "Myra",
];

const lastNames = [
  "Sharma", "Patel", "Mehta", "Joshi", "Shah",
  "Verma", "Desai", "Kulkarni", "Rao", "Khan",
];

function pick(list, index) {
  return list[index % list.length];
}

function demoId(type, index) {
  return `${DEMO_PREFIX}${type}_${String(index + 1).padStart(4, "0")}`;
}

function sampleDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function makeUsers() {
  return Array.from({ length: 50 }, (_, i) => ({
    demoId: demoId("USER", i),
    displayName: `${pick(firstNames, i)} ${pick(lastNames, i * 3)}`,
    ageGroup: pick(["18-24", "25-34", "35-44"], i),
    skinType: pick(skinTypes, i),
    isDemo: true,
    createdAt: sampleDate(i % 30),
  }));
}

function makeAnalyses(users) {
  return Array.from({ length: 100 }, (_, i) => ({
    demoId: demoId("ANALYSIS", i),
    demoUserId: users[i % users.length].demoId,
    concern: pick(concerns, i * 3),
    skinType: pick(skinTypes, i),
    status: "Completed",
    isDemo: true,
    createdAt: sampleDate(i % 30),
  }));
}

function makeOrders(users) {
  return Array.from({ length: 60 }, (_, i) => {
    const product = pick(products, i * 2);

    return {
      demoId: demoId("ORDER", i),
      demoUserId: users[i % users.length].demoId,
      productName: product.name,
      quantity: (i % 2) + 1,
      amount: product.price * ((i % 2) + 1),
      status: pick(orderStatuses, i * 2),
      isDemo: true,
      createdAt: sampleDate(i % 30),
    };
  });
}

function makeReviews(users) {
  return Array.from({ length: 30 }, (_, i) => ({
    demoId: demoId("REVIEW", i),
    demoUserId: users[i % users.length].demoId,
    productName: pick(products, i * 3).name,
    rating: (i % 3) + 3,
    comment: `Sample demo review ${i + 1} for testing the skincare website.`,
    isDemo: true,
    createdAt: sampleDate(i % 30),
  }));
}

async function seedDemoData() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    const users = makeUsers();
    const analyses = makeAnalyses(users);
    const orders = makeOrders(users);
    const reviews = makeReviews(users);

    const collections = [
      {
        name: "demo_users",
        records: users,
      },
      {
        name: "demo_analyses",
        records: analyses,
      },
      {
        name: "demo_orders",
        records: orders,
      },
      {
        name: "demo_reviews",
        records: reviews,
      },
    ];

    for (const item of collections) {
      const collection = db.collection(item.name);

      // Safe to rerun: update only records belonging to this demo seed.
      for (const record of item.records) {
        await collection.updateOne(
          { demoId: record.demoId },
          {
            $set: record,
            $setOnInsert: {
              createdByDemoSeeder: true,
            },
          },
          { upsert: true }
        );
      }

      console.log(
        `${item.name}: ${item.records.length} demo records prepared.`
      );
    }

    console.log("\nDemo data setup complete.");
    console.log("Demo users: 50");
    console.log("Demo analyses: 100");
    console.log("Demo orders: 60");
    console.log("Demo reviews: 30");
    console.log("\nAll generated records have isDemo: true.");
    console.log("Existing product and user collections were not modified.");
  } catch (error) {
    console.error("Demo data setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoData();
