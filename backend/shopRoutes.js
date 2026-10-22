require("dotenv").config();



// Import routes only AFTER dotenv has loaded.
const shopRoutes = require("./shopRoutes");
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;


const ORDER_ADMIN_KEY = process.env.ORDER_ADMIN_KEY || "";
const UPI_ID = process.env.UPI_ID || "";
const UPI_NAME = process.env.UPI_NAME || "AI Skincare";

if (!JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is missing from .env. Configure it to match server.js."
  );
}

/* =====================================================
   PRODUCTS
   Add or replace items here with your existing catalogue.
===================================================== */

const PRODUCTS = [
  {
    id: "skin-001",
    name: "Gentle Foaming Cleanser",
    category: "Cleanser",
    skinType: "All Skin Types",
    price: 499,
    image: "",
    description: "A gentle daily facial cleanser.",
    ingredients: ["Glycerin", "Gentle Cleansing Agents"],
  },
  {
    id: "skin-002",
    name: "Salicylic Acid Serum",
    category: "Serum",
    skinType: "Oily / Acne-Prone",
    price: 599,
    image: "",
    description: "A skincare serum for an oily-skin routine.",
    ingredients: ["Salicylic Acid"],
  },
  {
    id: "skin-003",
    name: "Niacinamide Serum",
    category: "Serum",
    skinType: "Combination / Oily",
    price: 549,
    image: "",
    description: "A daily serum for a simple skincare routine.",
    ingredients: ["Niacinamide"],
  },
  {
    id: "skin-004",
    name: "Hydrating Moisturizer",
    category: "Moisturizer",
    skinType: "Dry / Normal",
    price: 450,
    image: "",
    description: "A moisturizer to support skin hydration.",
    ingredients: ["Glycerin", "Hyaluronic Acid"],
  },
  {
    id: "skin-005",
    name: "Daily Sunscreen SPF 50",
    category: "Sunscreen",
    skinType: "All Skin Types",
    price: 699,
    image: "",
    description: "Daily broad-spectrum sun protection.",
    ingredients: [],
  },
  
  {
    id: "rec-001",
    name: "Salicylic Acid Cleanser",
    category: "Cleanser",
    skinType: "Oily / Acne-Prone",
    price: 299,
    image: "",
    description: "A cleanser for an acne-care skincare routine.",
    ingredients: ["Salicylic Acid"],
  },
  {
    id: "rec-002",
    name: "Oil-Free Moisturizer",
    category: "Moisturizer",
    skinType: "Oily / Acne-Prone",
    price: 349,
    image: "",
    description: "A lightweight moisturizer for daily use.",
    ingredients: [],
  },
  {
    id: "rec-003",
    name: "Hydrating Gentle Cleanser",
    category: "Cleanser",
    skinType: "Dry",
    price: 299,
    image: "",
    description: "A gentle cleanser for a hydrating skincare routine.",
    ingredients: ["Glycerin"],
  },
  {
    id: "rec-004",
    name: "Hyaluronic Acid Serum",
    category: "Serum",
    skinType: "Dry / Combination",
    price: 399,
    image: "",
    description: "A hydrating serum for a daily skincare routine.",
    ingredients: ["Hyaluronic Acid"],
  },
  {
    id: "rec-005",
    name: "Ceramide Moisturizer",
    category: "Moisturizer",
    skinType: "Dry",
    price: 449,
    image: "",
    description: "A moisturizer designed to support the skin barrier.",
    ingredients: ["Ceramides"],
  },
  {
    id: "rec-006",
    name: "Foaming Facial Cleanser",
    category: "Cleanser",
    skinType: "Oily",
    price: 299,
    image: "",
    description: "A gentle foaming cleanser for daily use.",
    ingredients: [],
  },
  {
    id: "rec-007",
    name: "Lightweight Gel Moisturizer",
    category: "Moisturizer",
    skinType: "Oily / Combination",
    price: 349,
    image: "",
    description: "A lightweight gel moisturizer.",
    ingredients: [],
  },
  {
    id: "rec-008",
    name: "Gentle Fragrance-Free Cleanser",
    category: "Cleanser",
    skinType: "Sensitive",
    price: 299,
    image: "",
    description: "A gentle cleanser for a simple skincare routine.",
    ingredients: [],
  },
  {
    id: "rec-009",
    name: "Panthenol Soothing Serum",
    category: "Serum",
    skinType: "Sensitive",
    price: 399,
    image: "",
    description: "A serum formulated for a soothing skincare routine.",
    ingredients: ["Panthenol"],
  },
  {
    id: "rec-010",
    name: "Barrier Repair Moisturizer",
    category: "Moisturizer",
    skinType: "Sensitive / Dry",
    price: 449,
    image: "",
    description: "A moisturizer for supporting the skin barrier.",
    ingredients: [],
  },
  {
    id: "rec-011",
    name: "Balanced Gentle Cleanser",
    category: "Cleanser",
    skinType: "Combination",
    price: 299,
    image: "",
    description: "A gentle cleanser for everyday skincare.",
    ingredients: [],
  },
  {
    id: "rec-012",
    name: "Lightweight Daily Moisturizer",
    category: "Moisturizer",
    skinType: "Combination",
    price: 349,
    image: "",
    description: "A lightweight daily moisturizer.",
    ingredients: [],
  },
  {
    id: "rec-013",
    name: "Daily Gentle Cleanser",
    category: "Cleanser",
    skinType: "Normal",
    price: 299,
    image: "",
    description: "A gentle cleanser for a daily routine.",
    ingredients: [],
  },
  {
    id: "rec-014",
    name: "Hydrating Facial Serum",
    category: "Serum",
    skinType: "Normal",
    price: 399,
    image: "",
    description: "A hydrating facial serum for daily skincare.",
    ingredients: ["Hyaluronic Acid"],
  },
  {
    id: "rec-015",
    name: "Daily Moisturizer",
    category: "Moisturizer",
    skinType: "Normal",
    price: 349,
    image: "",
    description: "A daily moisturizer for a basic skincare routine.",
    ingredients: [],
  },

];

/* =====================================================
   ORDER MODEL
===================================================== */

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    customer: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    items: [
      {
        productId: String,
        name: { type: String, required: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "UPI"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Submitted", "Verified", "Failed"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Order Placed",
        "Confirmed",
        "To Be Shipped",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
    },

    utr: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
    adminNote: { type: String, default: "" },
    statusHistory: [
      {
        status: String,
        note: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Order =
  mongoose.models.SkinShopOrder ||
  mongoose.model("SkinShopOrder", orderSchema);

/* =====================================================
   AUTHENTICATION MIDDLEWARE
===================================================== */

function getBearerToken(req) {
  const header = req.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function authenticateCustomer(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === "admin" || decoded.isAdmin === true) {
      return res.status(403).json({
        success: false,
        message: "Use a customer account for this operation.",
      });
    }

    const userId =
      decoded.user_id ||
      decoded.userId ||
      decoded.id ||
      decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "The login token does not contain a user ID.",
      });
    }

    req.shopCustomer = {
      id: String(userId),
      email: decoded.email || "",
      name: decoded.name || decoded.username || "",
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Customer session is invalid or expired. Please log in again.",
    });
  }
}


function authenticateShopAdmin(req, res, next) {
  const suppliedKey = req.get("x-admin-key") || "";

  // Optional dedicated shop-admin API key.
  if (
    ORDER_ADMIN_KEY &&
    suppliedKey &&
    Buffer.byteLength(suppliedKey) ===
      Buffer.byteLength(ORDER_ADMIN_KEY) &&
    crypto.timingSafeEqual(
      Buffer.from(suppliedKey),
      Buffer.from(ORDER_ADMIN_KEY)
    )
  ) {
    req.shopAdminEmail = "order-admin";
    return next();
  }

  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin token is missing. Please log in again.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const isAdmin =
      decoded.role === "admin" ||
      decoded.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "This session does not have admin permissions.",
      });
    }

    req.shopAdmin = decoded;
    req.shopAdminEmail = decoded.email || "admin";

    return next();
  } catch (error) {
    console.error(
      "Shop admin token verification failed:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Admin token is invalid or expired. Please log in again.",
    });
  }
}


function ensureDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not connected.",
    });
  }

  return next();
}

/* =====================================================
   PUBLIC PRODUCT ROUTES
===================================================== */

router.get("/products", (req, res) => {
  return res.json({
    success: true,
    products: PRODUCTS,
  });
});

router.get("/payment-details", (req, res) => {
  return res.json({
    success: true,
    upiId: UPI_ID,
    upiName: UPI_NAME,
    methods: ["COD", "UPI"],
  });
});

/* =====================================================
   CUSTOMER: CREATE ORDER
===================================================== */

router.post(
  "/orders",
  authenticateCustomer,
  ensureDatabase,
  async (req, res) => {
    try {
      const {
        items,
        paymentMethod,
        customer = {},
      } = req.body || {};

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Your cart is empty.",
        });
      }

      const method = String(paymentMethod || "COD").toUpperCase();

      if (!["COD", "UPI"].includes(method)) {
        return res.status(400).json({
          success: false,
          message: "Payment method must be COD or UPI.",
        });
      }

      const safeItems = [];

      for (const item of items) {
        const productId = String(
          item.productId || item.id || ""
        );

        const product = PRODUCTS.find(
          (p) => p.id === productId
        );

        // Only accept catalogue products and prices from the server.
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Invalid product: ${productId}`,
          });
        }

        const quantity = Number(item.quantity || 1);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 100
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid product quantity.",
          });
        }

        safeItems.push({
          productId: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity,
          subtotal: product.price * quantity,
        });
      }

      const totalAmount = safeItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      const orderNumber =
        "SKIN-" +
        Date.now().toString().slice(-8) +
        "-" +
        crypto.randomBytes(2).toString("hex").toUpperCase();

      const order = await Order.create({
        orderNumber,
        userId: req.shopCustomer.id,
        customer: {
          name: String(customer.name || req.shopCustomer.name).slice(0, 120),
          email: String(customer.email || req.shopCustomer.email).slice(0, 180),
          phone: String(customer.phone || "").slice(0, 30),
          address: String(customer.address || "").slice(0, 500),
          city: String(customer.city || "").slice(0, 100),
          state: String(customer.state || "").slice(0, 100),
          pincode: String(customer.pincode || "").slice(0, 20),
        },
        items: safeItems,
        totalAmount,
        paymentMethod: method,
        paymentStatus: "Pending",
        orderStatus: "Order Placed",
        statusHistory: [
          {
            status: "Order Placed",
            note: "Order created successfully.",
            updatedAt: new Date(),
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        order,
      });
    } catch (error) {
      console.error("Create order error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not place your order.",
      });
    }
  }
);

/* =====================================================
   CUSTOMER: ORDER HISTORY
===================================================== */

router.get(
  "/orders/mine",
  authenticateCustomer,
  ensureDatabase,
  async (req, res) => {
    try {
      const orders = await Order.find({
        userId: req.shopCustomer.id,
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Customer order history error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not load your orders.",
      });
    }
  }
);

/* =====================================================
   CUSTOMER: SUBMIT UPI TRANSACTION REFERENCE
===================================================== */

router.post(
  "/orders/:id/submit-utr",
  authenticateCustomer,
  ensureDatabase,
  async (req, res) => {
    try {
      const utr = String(req.body?.utr || "").trim();

      if (!/^[A-Za-z0-9-]{6,40}$/.test(utr)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid UPI transaction reference.",
        });
      }

      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.shopCustomer.id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (order.paymentMethod !== "UPI") {
        return res.status(400).json({
          success: false,
          message: "This order does not use UPI payment.",
        });
      }

      if (order.paymentStatus === "Verified") {
        return res.status(400).json({
          success: false,
          message: "Payment has already been verified.",
        });
      }

      order.utr = utr;
      order.paymentStatus = "Submitted";
      await order.save();

      return res.json({
        success: true,
        message: "Transaction reference submitted for admin verification.",
        order,
      });
    } catch (error) {
      console.error("Submit UTR error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not submit transaction reference.",
      });
    }
  }
);

/* =====================================================
   ADMIN: VIEW ALL ORDERS
===================================================== */

router.get(
  "/admin/orders",
  authenticateShopAdmin,
  ensureDatabase,
  async (req, res) => {
    try {
      console.log("========== ADMIN ORDERS ==========");
      console.log("Database:", mongoose.connection.name);
      console.log("Collection:", Order.collection.name);
      console.log("Admin:", req.shopAdminEmail);

      const orders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

      console.log("Orders found:", orders.length);

      return res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Admin orders error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders.",
      });
    }
  }
);

/* =====================================================
   ADMIN: VERIFY OR REJECT UPI PAYMENT
===================================================== */

router.patch(
  "/admin/orders/:id/verify-payment",
  authenticateShopAdmin,
  ensureDatabase,
  async (req, res) => {
    try {
      const action = String(
        req.body?.action || "verify"
      ).toLowerCase();

      if (!["verify", "reject"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action must be verify or reject.",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (order.paymentMethod !== "UPI") {
        return res.status(400).json({
          success: false,
          message: "This order is not a UPI order.",
        });
      }

      if (action === "verify") {
        order.paymentStatus = "Verified";
        order.verifiedAt = new Date();
        order.adminNote = "Payment verified by administrator.";
      } else {
        order.paymentStatus = "Failed";
        order.adminNote = String(
          req.body?.note || "Payment verification rejected."
        ).slice(0, 500);
      }

      await order.save();

      return res.json({
        success: true,
        message:
          action === "verify"
            ? "Payment verified."
            : "Payment rejected.",
        order,
      });
    } catch (error) {
      console.error("Payment verification error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not update payment status.",
      });
    }
  }
);

/* =====================================================
   ADMIN: UPDATE ORDER / DELIVERY STATUS
===================================================== */

router.patch(
  "/admin/orders/:id/status",
  authenticateShopAdmin,
  ensureDatabase,
  async (req, res) => {
    try {
      const allowedStatuses = [
        "Order Placed",
        "Confirmed",
        "To Be Shipped",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      const status = String(req.body?.status || "").trim();

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
          allowedStatuses,
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (order.orderStatus === "Delivered") {
        return res.status(400).json({
          success: false,
          message: "A delivered order cannot be changed.",
        });
      }

      if (order.orderStatus === "Cancelled") {
        return res.status(400).json({
          success: false,
          message: "A cancelled order cannot be changed.",
        });
      }

      order.orderStatus = status;

      order.statusHistory.push({
        status,
        note: String(req.body?.note || "").slice(0, 500),
        updatedAt: new Date(),
      });

      if (req.body?.note) {
        order.adminNote = String(req.body.note).slice(0, 500);
      }

      await order.save();

      return res.json({
        success: true,
        message: "Order status updated.",
        order,
      });
    } catch (error) {
      console.error("Update order status error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not update order status.",
      });
    }
  }
);

/* =====================================================
   EXPORT ROUTER
===================================================== */

module.exports = router;
