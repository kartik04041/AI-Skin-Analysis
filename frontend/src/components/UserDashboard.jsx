import React, { useEffect, useMemo, useState } from "react";
import "./UserDashboard.css";
import Shop from "./Shop";

const API_BASE_URL = "http://localhost:5000";

const getStoredToken = () => {
  try {
    return localStorage.getItem("glow_token") || "";
  } catch {
    return "";
  }
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getSkinType = (record) =>
  record?.skinType ||
  record?.skin_type ||
  record?.result?.skinType ||
  record?.prediction ||
  record?.label ||
  "Skin analysis";

const getAnalysisDate = (record) =>
  record?.createdAt ||
  record?.date ||
  record?.timestamp ||
  record?.updatedAt;

const getRecordId = (record, index) =>
  record?._id || record?.id || `${getAnalysisDate(record) || "analysis"}-${index}`;

const normalizeOrderItems = (order) => {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.products)) return order.products;
  return [];
};

const ORDER_STEPS = [
  { key: "placed", label: "Order Placed", detail: "We've received your order." },
  { key: "confirmed", label: "Confirmed", detail: "Your order is confirmed." },
  { key: "packed", label: "Packed", detail: "Your items are being prepared." },
  { key: "shipped", label: "Shipped", detail: "Your package is on its way." },
  { key: "out_for_delivery", label: "Out for Delivery", detail: "Your package is near you." },
  { key: "delivered", label: "Delivered", detail: "Your order has arrived." },
];

const ORDER_STATUS_LABELS = {
  placed: "Order Placed",
  pending: "Order Placed",
  processing: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  to_be_shipped: "To Be Shipped",
  shipped: "Shipped",
  in_transit: "In Transit",
  final_destination: "Reached Final Destination",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const normalizeOrderStatus = (value) => {
  const status = String(value || "placed")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (status.includes("cancel")) return "cancelled";
  if (status.includes("deliver") && !status.includes("out_for")) {
    return "delivered";
  }
  if (status.includes("out_for_delivery")) return "out_for_delivery";
  if (status.includes("final_destination")) return "shipped";
  if (status.includes("transit")) return "shipped";
  if (status.includes("ship")) return "shipped";
  if (status.includes("pack")) return "packed";
  if (status.includes("confirm")) return "confirmed";
  if (status.includes("process") || status.includes("pending")) {
    return "placed";
  }

  return ORDER_STATUS_LABELS[status] ? status : "placed";
};


function OrderTimeline({ status }) {
  const currentStatus = normalizeOrderStatus(status);

  const currentIndex = ORDER_STEPS.findIndex(
    (step) => step.key === currentStatus
  );

  if (currentStatus === "cancelled") {
    return (
      <div className="ud-order-cancelled">
        <strong>✕ Order Cancelled</strong>
        <p>Please contact support if you need help with this order.</p>
      </div>
    );
  }

  return (
    <div className="ud-order-timeline">
      {ORDER_STEPS.map((step, index) => {
        const complete = currentIndex >= index;
        const current = currentIndex === index;

        return (
          <div
            key={step.key}
            className={[
              "ud-order-step",
              complete ? "complete" : "",
              current ? "current" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="ud-order-step-marker">
              {complete ? "✓" : index + 1}
            </div>

            <div className="ud-order-step-content">
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export default function UserDashboard({
  user = {},
  history = [],
  onClose,
  onAddReview,
  onLogout,
  onStartTest,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("glow_cart") || "[]");
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("glow_wishlist") || "[]");
    } catch {
      return [];
    }
  });

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Skincare User";

  const userEmail = user?.email || "Email not provided";

  const normalizedHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];

    return [...history].sort((a, b) => {
      const dateA = new Date(getAnalysisDate(a) || 0).getTime();
      const dateB = new Date(getAnalysisDate(b) || 0).getTime();

      return dateB - dateA;
    });
  }, [history]);

  const latestAnalysis = normalizedHistory[0] || null;

  const skinScore = useMemo(() => {
    if (!latestAnalysis) return null;

    const possibleScores = [
      latestAnalysis.skinScore,
      latestAnalysis.score,
      latestAnalysis.result?.skinScore,
      latestAnalysis.result?.score,
    ];

    const score = possibleScores.find(
      (value) => value !== undefined && value !== null && Number.isFinite(Number(value))
    );

    if (score === undefined) return null;

    return Math.max(0, Math.min(100, Number(score)));
  }, [latestAnalysis]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price || item.displayed_price || 0);
      const quantity = Math.max(1, Number(item.quantity || 1));

      return sum + price * quantity;
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Math.max(1, Number(item.quantity || 1)),
        0
      ),
    [cart]
  );

  useEffect(() => {
    try {
      localStorage.setItem("glow_cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("glow_wishlist", JSON.stringify(wishlist));
    } catch (error) {
      console.error("Unable to save wishlist:", error);
    }
  }, [wishlist]);

  useEffect(() => {
    if (activeTab !== "orders") return;

    let cancelled = false;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Please log in again to view your orders.");
        }

        const response = await fetch(`${API_BASE_URL}/api/shop/orders/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || `Unable to load orders (${response.status}).`
          );
        }

        const orderList = Array.isArray(data)
          ? data
          : Array.isArray(data.orders)
          ? data.orders
          : Array.isArray(data.data)
          ? data.data
          : [];

        if (!cancelled) {
          setOrders(orderList);
        }
      } catch (error) {
        if (!cancelled) {
          setOrdersError(error.message || "Unable to load your orders.");
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewText.trim()) {
      setMessage("Please enter your review.");
      return;
    }

    try {
      if (typeof onAddReview === "function") {
        await onAddReview({
          rating,
          comment: reviewText.trim(),
          text: reviewText.trim(),
          name: displayName,
          email: userEmail,
        });
      }

      setReviewText("");
      setRating(5);
      setMessage("Thank you! Your review has been submitted.");
    } catch (error) {
      setMessage(error.message || "Unable to submit your review.");
    }
  };

  const handleFeedbackSubmit = (event) => {
    event.preventDefault();

    if (!feedback.trim()) {
      setMessage("Please enter your feedback.");
      return;
    }

    const feedbackData = {
      message: feedback.trim(),
      name: displayName,
      email: userEmail,
      createdAt: new Date().toISOString(),
    };

    try {
      const previousFeedback = JSON.parse(
        localStorage.getItem("glow_feedback") || "[]"
      );

      localStorage.setItem(
        "glow_feedback",
        JSON.stringify([feedbackData, ...previousFeedback])
      );

      setFeedback("");
      setMessage(
        "Feedback saved in this browser. Connect a backend feedback route to share it with the administrator."
      );
    } catch (error) {
      setMessage("Unable to save your feedback.");
    }
  };

  const addToCart = (product) => {
    if (!product) return;

    const productId =
      product._id || product.id || product.productId || product.name;

    setCart((previous) => {
      const existing = previous.find(
        (item) =>
          String(item._id || item.id || item.productId || item.name) ===
          String(productId)
      );

      if (existing) {
        return previous.map((item) =>
          String(item._id || item.id || item.productId || item.name) ===
          String(productId)
            ? { ...item, quantity: Number(item.quantity || 1) + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ];
    });

    setMessage("Product added to cart.");
  };

  const removeFromCart = (productId) => {
    setCart((previous) =>
      previous.filter(
        (item) =>
          String(item._id || item.id || item.productId || item.name) !==
          String(productId)
      )
    );
  };

  const changeQuantity = (productId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCart((previous) =>
      previous.map((item) =>
        String(item._id || item.id || item.productId || item.name) ===
        String(productId)
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
  };

  const addToWishlist = (product) => {
    if (!product) return;

    const productId =
      product._id || product.id || product.productId || product.name;

    setWishlist((previous) => {
      const exists = previous.some(
        (item) =>
          String(item._id || item.id || item.productId || item.name) ===
          String(productId)
      );

      if (exists) {
        setMessage("This product is already in your wishlist.");
        return previous;
      }

      setMessage("Product added to wishlist.");

      return [
        ...previous,
        {
          ...product,
          id: productId,
        },
      ];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((previous) =>
      previous.filter(
        (item) =>
          String(item._id || item.id || item.productId || item.name) !==
          String(productId)
      )
    );
  };

  const moveWishlistItemToCart = (product) => {
    addToCart(product);
    removeFromWishlist(
      product._id || product.id || product.productId || product.name
    );
  };

  const startTest = () => {
    if (typeof onStartTest === "function") {
      onStartTest();
    } else {
      setMessage("Use the skin analysis section to start a new test.");
    }
  };

  const renderProductName = (product) =>
    product.name || product.title || product.productName || "Skincare product";

  const renderProductPrice = (product) =>
    formatCurrency(product.price || product.displayed_price || 0);

  const renderCart = () => {
    if (!cart.length) {
      return (
        <div className="ud-empty-state">
          <div className="ud-empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse skincare products and add items to your cart.</p>
          <button
            type="button"
            className="ud-primary-button"
            onClick={() => setActiveTab("shop")}
          >
            Browse products
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="ud-product-list">
          {cart.map((product, index) => {
            const productId =
              product._id ||
              product.id ||
              product.productId ||
              product.name ||
              index;

            return (
              <article className="ud-product-row" key={String(productId)}>
                <div className="ud-product-icon">🧴</div>

                <div className="ud-product-details">
                  <h4>{renderProductName(product)}</h4>
                  <p>{renderProductPrice(product)} each</p>

                  <div className="ud-quantity-control">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(productId, Number(product.quantity || 1) - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <span>{product.quantity || 1}</span>

                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(productId, Number(product.quantity || 1) + 1)
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="ud-product-actions">
                  <strong>
                    {formatCurrency(
                      Number(product.price || product.displayed_price || 0) *
                        Number(product.quantity || 1)
                    )}
                  </strong>

                  <button
                    type="button"
                    className="ud-text-button ud-danger-text"
                    onClick={() => removeFromCart(productId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="ud-cart-summary">
          <div className="ud-summary-line">
            <span>Items</span>
            <strong>{cartItemCount}</strong>
          </div>

          <div className="ud-summary-line">
            <span>Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>

          <p className="ud-muted">
            Checkout must be connected to your backend order-creation endpoint
            before orders can be placed.
          </p>

          <button
            type="button"
            className="ud-primary-button"
            onClick={() => {
              setMessage(
                "Checkout is not submitted by this dashboard. Connect your existing secure UPI/COD checkout endpoint to place an order."
              );
            }}
          >
            Continue to checkout
          </button>
        </div>
      </>
    );
  };

  const renderWishlist = () => {
    if (!wishlist.length) {
      return (
        <div className="ud-empty-state">
          <div className="ud-empty-icon">♡</div>
          <h3>Your wishlist is empty</h3>
          <p>Save skincare products here to find them later.</p>
          <button
            type="button"
            className="ud-primary-button"
            onClick={() => setActiveTab("shop")}
          >
            Explore products
          </button>
        </div>
      );
    }

    return (
      <div className="ud-product-list">
        {wishlist.map((product, index) => {
          const productId =
            product._id ||
            product.id ||
            product.productId ||
            product.name ||
            index;

          return (
            <article className="ud-product-row" key={String(productId)}>
              <div className="ud-product-icon">💗</div>

              <div className="ud-product-details">
                <h4>{renderProductName(product)}</h4>
                <p>{renderProductPrice(product)}</p>
              </div>

              <div className="ud-product-actions">
                <button
                  type="button"
                  className="ud-primary-button ud-small-button"
                  onClick={() => moveWishlistItemToCart(product)}
                >
                  Add to cart
                </button>

                <button
                  type="button"
                  className="ud-text-button ud-danger-text"
                  onClick={() => removeFromWishlist(productId)}
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

 
const renderOrders = () => {
  if (ordersLoading) {
    return <div className="ud-loading">Loading your orders...</div>;
  }

  if (ordersError) {
    return (
      <div className="ud-empty-state">
        <div className="ud-empty-icon">📦</div>
        <h3>Unable to load orders</h3>
        <p>{ordersError}</p>

        <button
          type="button"
          className="ud-secondary-button"
          onClick={() => {
            setOrdersError("");
            setActiveTab("overview");
            setTimeout(() => setActiveTab("orders"), 0);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="ud-empty-state">
        <div className="ud-empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>
          Once you complete checkout, your purchases and delivery
          progress will appear here.
        </p>

        <button
          type="button"
          className="ud-primary-button"
          onClick={() => setActiveTab("shop")}
        >
          🛍 Shop skincare
        </button>
      </div>
    );
  }

  return (
    <div className="ud-orders-list">
      {orders.map((order, index) => {
        const orderId = order._id || order.id || `order-${index}`;
        const items = normalizeOrderItems(order);

        const rawStatus =
          order.orderStatus || order.status || "placed";

        const status = normalizeOrderStatus(rawStatus);
        const statusLabel =
          ORDER_STATUS_LABELS[status] || "Order Placed";

        const paymentStatus =
          order.paymentStatus ||
          order.payment?.status ||
          (String(order.paymentMethod || order.payment?.method || "")
            .toLowerCase()
            .includes("cod")
            ? "Cash on Delivery"
            : "Pending");

        const total = Number(
          order.totalAmount ?? order.total ?? order.amount ?? 0
        );

        const address =
          order.shippingAddress ||
          order.deliveryAddress ||
          order.address;

        return (
          <article className="ud-order-card" key={String(orderId)}>
            <div className="ud-order-header">
              <div>
                <span className="ud-overline">ORDER ID</span>
                <h4>{String(orderId)}</h4>
                <p>Placed on {formatDate(order.createdAt || order.date)}</p>
              </div>

              <span
                className={`ud-status-pill ${
                  status === "cancelled" ? "ud-order-cancelled" : ""
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="ud-order-items">
              {items.length ? (
                items.map((item, itemIndex) => {
                  const quantity = Math.max(
                    1,
                    Number(item.quantity || 1)
                  );

                  const price = Number(
                    item.price || item.displayed_price || 0
                  );

                  return (
                    <div
                      className="ud-order-item"
                      key={
                        item._id ||
                        item.id ||
                        `${orderId}-${itemIndex}`
                      }
                    >
                      <div className="ud-order-product-name">
                        <span className="ud-product-icon">🧴</span>
                        <span>
                          {item.name ||
                            item.title ||
                            item.productName ||
                            "Skincare product"}
                          <small>Qty: {quantity}</small>
                        </span>
                      </div>

                      <strong>{formatCurrency(price * quantity)}</strong>
                    </div>
                  );
                })
              ) : (
                <p className="ud-muted">
                  Product details are unavailable for this order.
                </p>
              )}
            </div>

            {address && (
              <div className="ud-order-address">
                <span className="ud-overline">DELIVERY ADDRESS</span>
                <p>
                  {typeof address === "string"
                    ? address
                    : [
                        address.fullName,
                        address.addressLine1 || address.address,
                        address.addressLine2,
                        address.city,
                        address.state,
                        address.pincode || address.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                </p>
              </div>
            )}

            <div className="ud-order-tracking-heading">
              <div>
                <span className="ud-overline">DELIVERY UPDATES</span>
                <h4>Track your order</h4>
              </div>
              <span className="ud-tracking-icon">🚚</span>
            </div>

            <OrderTimeline status={status} />

            <div className="ud-order-footer">
              <div>
                <span className="ud-overline">PAYMENT</span>
                <p>
                  {String(paymentStatus).replace(/[_-]/g, " ")}
                </p>
                <p className="ud-order-payment-method">
                  {order.paymentMethod || order.payment?.method || ""}
                </p>
              </div>

              <div className="ud-order-total">
                <span className="ud-overline">ORDER TOTAL</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};


  const tabs = [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "progress", label: "Progress", icon: "◷" },
    { id: "history", label: "Analysis History", icon: "▤" },
    { id: "routine", label: "Skincare Routine", icon: "✧" },
    { id: "shop", label: "Shop", icon: "🛍", count: null },
    { id: "cart", label: "Cart", icon: "🛒", count: cartItemCount },
    { id: "wishlist", label: "Wishlist", icon: "♡", count: wishlist.length },
    
{ id: "orders", label: "My Orders", icon: "📦" },
{ id: "feedback", label: "Feedback", icon: "✉" },
{ id: "contact", label: "Contact Us", icon: "☎" },

    
  ];

  return (
    <div className="user-dashboard-container">
      <header className="ud-header">
        <div className="ud-brand">
          <div className="ud-brand-icon">✿</div>
          <div>
            <h2>GlowAI</h2>
            <p>AI Skincare Dashboard</p>
          </div>
        </div>

        <div className="ud-header-actions">
          <div className="ud-user-chip">
            <div className="ud-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="ud-user-details">
              <strong>{displayName}</strong>
              <span>{userEmail}</span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              className="ud-icon-button"
              onClick={onClose}
              aria-label="Close dashboard"
              title="Close dashboard"
            >
              ✕
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              className="ud-secondary-button"
              onClick={onLogout}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="ud-layout">
        <aside className="ud-sidebar">
          <div className="ud-sidebar-intro">
            <span className="ud-overline">YOUR SPACE</span>
            <h3>My Dashboard</h3>
            <p>Manage your skincare journey and orders.</p>
          </div>

          <nav className="ud-nav" aria-label="User dashboard navigation">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={`ud-nav-item ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => {
                  setMessage("");
                  setActiveTab(tab.id);
                }}
              >
                <span className="ud-nav-icon">{tab.icon}</span>
                <span>{tab.label}</span>

                {tab.count > 0 && (
                  <span className="ud-nav-count">{tab.count}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="ud-sidebar-bottom">
            <div className="ud-help-card">
              <span className="ud-help-icon">🌸</span>
              <strong>Healthy skin starts here</strong>
              <p>Keep your routine consistent and gentle.</p>
            </div>

          </div>
        </aside>

        <main className="ud-main">
          {message && (
            <div className="ud-message" role="status">
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === "overview" && (
            <section className="ud-tab-content">
              <div className="ud-welcome-banner">
                <div>
                  <span className="ud-overline">YOUR SKINCARE JOURNEY</span>
                  <h1>Hello, {displayName.split(" ")[0]}! ✨</h1>
                  <p>
                    Welcome back. Review your skin analysis and keep your
                    skincare journey moving forward.
                  </p>

                  <button
                    type="button"
                    className="ud-primary-button"
                    onClick={startTest}
                  >
                    Start skin analysis
                  </button>
                </div>

                <div className="ud-welcome-art" aria-hidden="true">
                  <span>🌷</span>
                  <span>✨</span>
                  <span>🌸</span>
                </div>
              </div>

              <div className="ud-section-heading">
                <div>
                  <span className="ud-overline">YOUR ACTIVITY</span>
                  <h2>Dashboard Overview</h2>
                </div>
              </div>

              <div className="ud-stats-grid">
                <article className="ud-stat-card">
                  <div className="ud-stat-icon pink">✧</div>
                  <span>Total Analyses</span>
                  <strong>{normalizedHistory.length}</strong>
                  <small>Saved skin analysis records</small>
                </article>

                <article className="ud-stat-card">
                  <div className="ud-stat-icon purple">♡</div>
                  <span>Latest Result</span>
                  <strong className="ud-stat-text">
                    {latestAnalysis ? getSkinType(latestAnalysis) : "Not tested"}
                  </strong>
                  <small>
                    {latestAnalysis
                      ? formatDate(getAnalysisDate(latestAnalysis))
                      : "Start your first analysis"}
                  </small>
                </article>

                <article className="ud-stat-card">
                  <div className="ud-stat-icon peach">🛒</div>
                  <span>Cart Items</span>
                  <strong>{cartItemCount}</strong>
                  <small>{formatCurrency(cartTotal)} cart value</small>
                </article>

                <article className="ud-stat-card">
                  <div className="ud-stat-icon lavender">♡</div>
                  <span>Wishlist</span>
                  <strong>{wishlist.length}</strong>
                  <small>Products saved for later</small>
                </article>
              </div>

              <div className="ud-content-grid">
                <article className="ud-panel">
                  <div className="ud-panel-heading">
                    <div>
                      <span className="ud-overline">MOST RECENT</span>
                      <h3>Latest Skin Analysis</h3>
                    </div>

                    <button
                      type="button"
                      className="ud-text-button"
                      onClick={() => setActiveTab("history")}
                    >
                      View all
                    </button>
                  </div>

                  {latestAnalysis ? (
                    <div className="ud-latest-analysis">
                      <div className="ud-result-icon">🌸</div>
                      <div className="ud-result-details">
                        <h4>{getSkinType(latestAnalysis)}</h4>
                        <p>{formatDate(getAnalysisDate(latestAnalysis))}</p>

                        {skinScore !== null && (
                          <div className="ud-score">
                            <span>Recorded score</span>
                            <strong>{skinScore}/100</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ud-inline-empty">
                      <span>🌿</span>
                      <p>You have not saved a skin analysis yet.</p>
                      <button
                        type="button"
                        className="ud-text-button"
                        onClick={startTest}
                      >
                        Start your first test →
                      </button>
                    </div>
                  )}
                </article>

                <article className="ud-panel">
                  <div className="ud-panel-heading">
                    <div>
                      <span className="ud-overline">DAILY CARE</span>
                      <h3>Routine Reminder</h3>
                    </div>
                    <span className="ud-round-icon">☀</span>
                  </div>

                  <div className="ud-routine-preview">
                    <div className="ud-routine-line">
                      <span className="ud-routine-dot morning" />
                      <div>
                        <strong>Morning</strong>
                        <p>Gentle cleanser, moisturizer, sunscreen</p>
                      </div>
                    </div>

                    <div className="ud-routine-line">
                      <span className="ud-routine-dot evening" />
                      <div>
                        <strong>Evening</strong>
                        <p>Cleanser and moisturizer</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ud-secondary-button"
                      onClick={() => setActiveTab("routine")}
                    >
                      View routine
                    </button>
                  </div>
                </article>
              </div>

              <article className="ud-panel ud-quick-actions">
                <div>
                  <span className="ud-overline">QUICK ACCESS</span>
                  <h3>What would you like to do?</h3>
                </div>

                <div className="ud-quick-action-grid">
                  <button
                    type="button"
                    onClick={startTest}
                    className="ud-quick-action"
                  >
                    <span>📸</span>
                    <strong>Analyze Skin</strong>
                    <small>Start a new test</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("shop")}
                    className="ud-quick-action"
                  >
                    <span>🧴</span>
                    <strong>Shop Products</strong>
                    <small>Explore skincare</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="ud-quick-action"
                  >
                    <span>📦</span>
                    <strong>My Orders</strong>
                    <small>Track your orders</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("feedback")}
                    className="ud-quick-action"
                  >
                    <span>💌</span>
                    <strong>Give Feedback</strong>
                    <small>Share your thoughts</small>
                  </button>
                </div>
              </article>
            </section>
          )}

          {activeTab === "progress" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">YOUR JOURNEY</span>
                <h1>Skin Progress</h1>
                <p>Review your saved analysis records over time.</p>
              </div>

              <article className="ud-panel">
                <div className="ud-panel-heading">
                  <div>
                    <h3>Analysis Activity</h3>
                    <p className="ud-muted">
                      {normalizedHistory.length} saved analysis record(s)
                    </p>
                  </div>
                </div>

                {normalizedHistory.length ? (
                  <div className="ud-progress-list">
                    {normalizedHistory.map((record, index) => (
                      <div
                        className="ud-progress-item"
                        key={getRecordId(record, index)}
                      >
                        <div className="ud-progress-marker">{index + 1}</div>
                        <div className="ud-progress-info">
                          <strong>{getSkinType(record)}</strong>
                          <span>{formatDate(getAnalysisDate(record))}</span>
                        </div>
                        <span className="ud-status-pill">Recorded</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ud-empty-state">
                    <div className="ud-empty-icon">📈</div>
                    <h3>No progress records yet</h3>
                    <p>Complete a skin analysis to start building your history.</p>
                    <button
                      type="button"
                      className="ud-primary-button"
                      onClick={startTest}
                    >
                      Start analysis
                    </button>
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === "history" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">ARCHIVE</span>
                <h1>Analysis History</h1>
                <p>All past AI skin scans and diagnostic results.</p>
              </div>

              <article className="ud-panel">
                {normalizedHistory.length ? (
                  <div className="ud-history-list">
                    {normalizedHistory.map((record, index) => (
                      <div className="ud-history-item" key={getRecordId(record, index)}>
                        <div>
                          <h4>{getSkinType(record)}</h4>
                          <p>{formatDate(getAnalysisDate(record))}</p>
                        </div>
                        <span className="ud-status-pill">Completed</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ud-empty-state">
                    <div className="ud-empty-icon">▤</div>
                    <h3>No history available</h3>
                    <p>Your previous scan results will appear here.</p>
                    <button
                      type="button"
                      className="ud-primary-button"
                      onClick={startTest}
                    >
                      Start new scan
                    </button>
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === "routine" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">CUSTOMIZED CARE</span>
                <h1>Skincare Routine</h1>
                <p>Recommended steps based on your latest skin analysis.</p>
              </div>

              <article className="ud-panel">
                {latestAnalysis ? (
                  <div className="ud-routine-container">
                    <h3>Your Plan for {getSkinType(latestAnalysis)} Skin</h3>
                    <div className="routine-tables" style={{ marginTop: "20px" }}>
                      <div className="routine-card am-card">
                        <h4>☀️ Morning Routine (AM)</h4>
                        <ul>
                          <li><span className="step-num">1</span> Gentle Cleanser</li>
                          <li><span className="step-num">2</span> Hydrating Serum</li>
                          <li><span className="step-num">3</span> Moisturizer & SPF 50</li>
                        </ul>
                      </div>
                      <div className="routine-card pm-card">
                        <h4>🌙 Evening Routine (PM)</h4>
                        <ul>
                          <li><span className="step-num">1</span> Double Cleanse</li>
                          <li><span className="step-num">2</span> Treatment / Actives</li>
                          <li><span className="step-num">3</span> Nourishing Night Cream</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ud-empty-state">
                    <div className="ud-empty-icon">✧</div>
                    <h3>No routine generated yet</h3>
                    <p>Complete your skin analysis to get a customized routine.</p>
                    <button
                      type="button"
                      className="ud-primary-button"
                      onClick={startTest}
                    >
                      Start analysis
                    </button>
                  </div>
                )}
              </article>
            </section>
          )}

          {activeTab === "shop" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">MARKETPLACE</span>
                <h1>Skincare Shop</h1>
                <p>Explore recommended products and add them to your cart or wishlist.</p>
              </div>
              <Shop
                onAddToCart={addToCart}
                onAddToWishlist={addToWishlist}
              />
            </section>
          )}

          {activeTab === "cart" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">CHECKOUT</span>
                <h1>Shopping Cart</h1>
                <p>Review items in your cart before checkout.</p>
              </div>
              <article className="ud-panel">{renderCart()}</article>
            </section>
          )}

          {activeTab === "wishlist" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">SAVED ITEMS</span>
                <h1>My Wishlist</h1>
                <p>Products you have saved for later.</p>
              </div>
              <article className="ud-panel">{renderWishlist()}</article>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">PURCHASES</span>
                <h1>My Orders</h1>
                <p>Track your past orders and status.</p>
              </div>
              <article className="ud-panel">{renderOrders()}</article>
            </section>
          )}

          {activeTab === "feedback" && (
            <section className="ud-tab-content">
              <div className="ud-page-heading">
                <span className="ud-overline">WE VALUE YOUR OPINION</span>
                <h1>Feedback & Reviews</h1>
                <p>Share your experience or submit a review.</p>
              </div>

              <div className="ud-content-grid">
                <article className="ud-panel">
                  <h3>Submit a Public Review</h3>
                  <form onSubmit={handleReviewSubmit} className="ud-form">
                    <div className="ud-form-group">
                      <label>Rating (1 - 5 Stars)</label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                        <option value={3}>⭐⭐⭐ (3/5)</option>
                        <option value={2}>⭐⭐ (2/5)</option>
                        <option value={1}>⭐ (1/5)</option>
                      </select>
                    </div>

                    <div className="ud-form-group">
                      <label>Review Comment</label>
                      <textarea
                        rows={4}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write your review here..."
                      />
                    </div>

                    <button type="submit" className="ud-primary-button">
                      Submit Review
                    </button>
                  </form>
                </article>

                <article className="ud-panel">
                  <h3>Send Private Feedback</h3>
                  <form onSubmit={handleFeedbackSubmit} className="ud-form">
                    <div className="ud-form-group">
                      <label>Your Feedback</label>
                      <textarea
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Let us know how we can improve..."
                      />
                    </div>

                    <button type="submit" className="ud-primary-button">
                      Send Feedback
                    </button>
                  </form>
                </article>
              </div>
            </section>
          )}

         {activeTab === "contact" && (
            <section className="ud-tab-content">
              
<div className="contact-us-section">
  <h2>Contact Us</h2>
  <p className="contact-description">
    Have questions or need assistance? We're here to help you on your skincare journey.
  </p>

  <div className="contact-details">
    <p>
      <strong>Email:</strong>{" "}
      <a href="mailto:kartik.ghuge1@vsit.edu.in">
        kartik.ghuge1@vsit.edu.in
      </a>
    </p>

    <p>
      <strong>Instagram:</strong>{" "}
      <a
        href="https://www.instagram.com/AI_Skin_Buddy/"
        target="_blank"
        rel="noopener noreferrer"
      >
        @AI_Skin_Buddy
      </a>
    </p>

    <p>
      <strong>Contact:</strong> 022-768-758
    </p>
  </div>

  <div className="contact-footer">
    <p>
      &copy; {new Date().getFullYear()} AI Skin Buddy. All rights reserved.
    </p>
  </div>
</div>


              <article className="ud-panel">
                <div className="ud-empty-state">
                  <div className="ud-empty-icon">✦</div>
                  <h3>More features on the way</h3>
                  <p>Stay tuned for advanced analytics, dermatologist chat, and more!</p>
                </div>
              </article>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

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
      }
    ]
  }
};