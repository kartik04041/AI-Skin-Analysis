
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

const ORDER_STATUSES = [
  "Order Placed",
  "Confirmed",
  "To Be Shipped",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_COLORS = {
  "Order Placed": "pending",
  Confirmed: "confirmed",
  "To Be Shipped": "shipping",
  Shipped: "shipping",
  "Out for Delivery": "delivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
  Pending: "pending",
  Submitted: "pending",
  Verified: "delivered",
  Rejected: "cancelled",
};

const DEFAULT_STATS = {
  totalUsers: 0,
  todayUsers: 0,
  currentUsers: 0,
  totalLogins: 0,
  todayLogins: 0,
  totalScans: 0,
  todayScans: 0,
  modelAccuracy: null,
  modelAccuracySource: null,
  avgRating: 0,
  totalFeedback: 0,
  systemHealth: 0,
  avgResponseTime: null,
  responseTimeSamples: 0,
  userGrowth: [],
  scanTrend: [],
  popularConcerns: [],
  recentUsers: [],
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const number = (value) => Number(value || 0).toLocaleString("en-IN");

const dateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN");
};

const getErrorMessage = (data, fallback) =>
  data?.message || data?.error || fallback;

const getUserRole = (user) => {
  if (user?.isAdmin === true) return "Administrator";
  const role = String(user?.role || "").trim();
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Customer";
};

const isValidMetric = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const getMetricSource = (stats) => {
  const source = String(
    stats?.modelAccuracySource ||
      stats?.accuracySource ||
      stats?.modelMetrics?.source ||
      ""
  ).toLowerCase();

  return ["validation", "validated", "test", "test-set", "evaluation"].includes(
    source
  )
    ? "Validated metric"
    : "Backend-reported metric";
};

const extractArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export default function AdminDashboard({
  user,
  token,
  reviews = [],
  onRefreshReviews,
  onLogout,
  API_BASE_URL = "http://localhost:5000",
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [health, setHealth] = useState({
    node: "Checking",
    mongodb: "Checking",
    python: "Unknown",
  });

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);

  const [userSearch, setUserSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("All");

  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderNote, setOrderNote] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const adminName = user?.name || user?.username || "Administrator";
  const adminInitial = adminName.charAt(0).toUpperCase();

  const showNotice = useCallback((message, type = "success") => {
    setNotice({ message, type });
  }, []);

  // =====================================================
  // API REQUEST HELPER
  // =====================================================

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, `Request failed with status ${response.status}`)
        );
      }

      return data;
    },
    [API_BASE_URL, token]
  );

  // =====================================================
  // LOAD STATISTICS
  // =====================================================

  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await request("/api/admin/stats");
      const result = data.stats || data.data?.stats || data.data || data;

      if (result && typeof result === "object" && !Array.isArray(result)) {
        setStats((previous) => ({
          ...previous,
          ...result,
          userGrowth: Array.isArray(result.userGrowth)
            ? result.userGrowth
            : previous.userGrowth,
          scanTrend: Array.isArray(result.scanTrend)
            ? result.scanTrend
            : previous.scanTrend,
          popularConcerns: Array.isArray(result.popularConcerns)
            ? result.popularConcerns
            : previous.popularConcerns,
          recentUsers: Array.isArray(result.recentUsers)
            ? result.recentUsers
            : previous.recentUsers,
        }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Admin statistics error:", error);
      showNotice(error.message || "Could not load statistics.", "error");
    } finally {
      setLoading(false);
    }
  }, [request, token, showNotice]);

  // =====================================================
  // LOAD USERS
  // =====================================================

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    setUsersLoading(true);

    try {
      const data = await request("/api/admin/users");
      setUsers(extractArray(data, "users"));
    } catch (error) {
      console.error("Admin users error:", error);
      showNotice(error.message || "Could not load users.", "error");
    } finally {
      setUsersLoading(false);
    }
  }, [request, token, showNotice]);

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);

    try {
      const data = await request("/api/shop/admin/orders");
      setOrders(extractArray(data, "orders"));
    } catch (error) {
      console.error("Admin orders error:", error);
      showNotice(
        `${error.message || "Could not load orders."} Check your admin token and MongoDB connection.`,
        "error"
      );
    } finally {
      setOrdersLoading(false);
    }
  }, [request, token, showNotice]);

  // =====================================================
  // CHECK BACKEND HEALTH
  // =====================================================

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error("Health check failed");
      }

      const mongoStatus = String(data.mongodb || "").toLowerCase();
      const pythonStatus = String(
        data.python || data.pythonService || ""
      ).toLowerCase();

      setHealth({
        node: data.status === "online" ? "Online" : "Offline",
        mongodb:
          mongoStatus === "connected"
            ? "Connected"
            : mongoStatus === "disconnected"
              ? "Disconnected"
              : "Unknown",
        python: ["online", "connected", "healthy"].includes(pythonStatus)
          ? "Online"
          : ["offline", "disconnected", "unhealthy"].includes(pythonStatus)
            ? "Offline"
            : pythonStatus === "configured"
              ? "Configured"
              : "Unknown",
      });
    } catch (error) {
      console.error("Health check error:", error);
      setHealth({
        node: "Offline",
        mongodb: "Unknown",
        python: "Unknown",
      });
    } finally {
      setHealthLoading(false);
    }
  }, [API_BASE_URL]);

  // =====================================================
  // INITIAL LOAD AND TAB-BASED LOADS
  // =====================================================

  useEffect(() => {
    fetchStats();
    fetchHealth();
  }, [fetchStats, fetchHealth]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }

    if (activeTab === "overview" || activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, fetchUsers, fetchOrders]);

  // =====================================================
  // REVIEW METRICS
  // =====================================================

  const safeReviews = Array.isArray(reviews) ? reviews : [];

  const averageRating = useMemo(() => {
    if (!safeReviews.length) return "0.0";

    const ratings = safeReviews
      .map((review) => Number(review.rating))
      .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);

    if (!ratings.length) return "0.0";

    return (
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    ).toFixed(1);
  }, [safeReviews]);

  const ratingDistribution = useMemo(() => {
    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    safeReviews.forEach((review) => {
      const rating = Math.round(Number(review.rating) || 0);
      if (result[rating] !== undefined) result[rating]++;
    });

    return result;
  }, [safeReviews]);

  // =====================================================
  // FILTER USERS AND ORDERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((item) =>
      [item.name, item.username, item.email].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [users, userSearch]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = [
        order.orderNumber,
        order.customer?.name,
        order.customer?.email,
        ...(Array.isArray(order.items)
          ? order.items.map((item) => item.name)
          : []),
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        orderFilter === "All" || order.orderStatus === orderFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderFilter]);

  // =====================================================
  // ORDER SUMMARY
  // =====================================================

  const orderSummary = useMemo(() => {
    const summary = {
      total: orders.length,
      pending: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
      revenue: 0,
      paymentReview: 0,
    };

    orders.forEach((order) => {
      if (order.orderStatus === "Order Placed") summary.pending++;

      if (
        ["Confirmed", "To Be Shipped", "Shipped", "Out for Delivery"].includes(
          order.orderStatus
        )
      ) {
        summary.shipping++;
      }

      if (order.orderStatus === "Delivered") summary.delivered++;
      if (order.orderStatus === "Cancelled") summary.cancelled++;
      if (order.paymentStatus === "Submitted") summary.paymentReview++;

      if (order.orderStatus !== "Cancelled") {
        summary.revenue += Number(order.totalAmount) || 0;
      }
    });

    return summary;
  }, [orders]);

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) {
      showNotice("Review ID is missing.", "error");
      return;
    }

    if (!window.confirm("Delete this review permanently?")) return;

    try {
      setDeletingId(reviewId);

      await request(`/api/reviews/${reviewId}`, { method: "DELETE" });

      if (onRefreshReviews) await onRefreshReviews();

      showNotice("Review deleted successfully.");
    } catch (error) {
      showNotice(error.message || "Could not delete review.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateOrderStatus = async (order, status) => {
    if (!order?._id || !status) return;

    if (
      ["Delivered", "Cancelled"].includes(order.orderStatus) &&
      status !== order.orderStatus
    ) {
      showNotice("This order is already finalized.", "error");
      return;
    }

    try {
      setUpdatingOrderId(order._id);

      const data = await request(
        `/api/shop/admin/orders/${order._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, note: orderNote.trim() }),
        }
      );

      const updatedOrder = {
        ...order,
        ...(data.order || {}),
        orderStatus: data.order?.orderStatus || status,
      };

      setOrders((previous) =>
        previous.map((item) =>
          item._id === order._id ? { ...item, ...updatedOrder } : item
        )
      );

      setSelectedOrder((previous) =>
        previous?._id === order._id
          ? { ...previous, ...updatedOrder }
          : previous
      );

      setOrderNote("");
      showNotice(data.message || "Order status updated.");
    } catch (error) {
      showNotice(error.message || "Could not update order status.", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // =====================================================
  // VERIFY / REJECT UPI PAYMENT
  // =====================================================

  const verifyPayment = async (order, action) => {
    if (!order?._id) return;

    const message =
      action === "verify"
        ? "Verify this UPI payment?"
        : "Reject this UPI payment?";

    if (!window.confirm(message)) return;

    try {
      setVerifyingOrderId(order._id);

      const data = await request(
        `/api/shop/admin/orders/${order._id}/verify-payment`,
        {
          method: "PATCH",
          body: JSON.stringify({ action, note: paymentNote.trim() }),
        }
      );

      const fallbackPaymentStatus =
        action === "verify" ? "Verified" : "Rejected";

      const updatedOrder = {
        ...order,
        ...(data.order || {}),
        paymentStatus: data.order?.paymentStatus || fallbackPaymentStatus,
      };

      setOrders((previous) =>
        previous.map((item) =>
          item._id === order._id ? { ...item, ...updatedOrder } : item
        )
      );

      setSelectedOrder((previous) =>
        previous?._id === order._id
          ? { ...previous, ...updatedOrder }
          : previous
      );

      setPaymentNote("");
      showNotice(data.message || "Payment status updated.");
    } catch (error) {
      showNotice(error.message || "Payment update failed.", "error");
    } finally {
      setVerifyingOrderId(null);
    }
  };

  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  const refreshAll = async () => {
    const tasks = [
      fetchStats(),
      fetchHealth(),
      activeTab === "overview" || activeTab === "orders"
        ? fetchOrders()
        : Promise.resolve(),
      activeTab === "users" ? fetchUsers() : Promise.resolve(),
      onRefreshReviews
        ? Promise.resolve().then(() => onRefreshReviews())
        : Promise.resolve(),
    ];

    const results = await Promise.allSettled(tasks);

    setLastUpdated(new Date());

    if (results.some((result) => result.status === "rejected")) {
      showNotice(
        "Some dashboard data could not be refreshed. Check the console and backend.",
        "error"
      );
    }
  };

  // =====================================================
  // REUSABLE COMPONENTS
  // =====================================================

  const StatCard = ({ icon, title, value, subtitle, accent = "pink" }) => (
    <article className={`admin-stat-card accent-${accent}`}>
      <div className="admin-stat-top">
        <div className="admin-stat-icon">{icon}</div>
        <span className="stat-card-mark">↗</span>
      </div>
      <p className="admin-stat-title">{title}</p>
      <h3 className="admin-stat-value">{loading ? "—" : value}</h3>
      <span className="admin-stat-subtitle">{subtitle}</span>
    </article>
  );

  const PanelHeading = ({ eyebrow, title, description, action }) => (
    <div className="panel-heading">
      <div>
        {eyebrow && <span className="panel-kicker">{eyebrow}</span>}
        <h3>{title}</h3>
        {description && <p className="panel-description">{description}</p>}
      </div>
      {action && <div className="panel-heading-action">{action}</div>}
    </div>
  );

  const EmptyState = ({ icon = "◌", title, message }) => (
    <div className="empty-admin-state">
      <span>{icon}</span>
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  );

  const ProgressBar = ({ label, value }) => {
    const valid = isValidMetric(value);
    const percentage = valid
      ? Math.min(100, Math.max(0, Number(value)))
      : 0;

    return (
      <div className="admin-progress-item">
        <div className="admin-progress-header">
          <span>{label}</span>
          <strong>
            {valid ? `${percentage.toFixed(1)}%` : "Not available"}
          </strong>
        </div>
        <div className="admin-progress-track">
          <div
            className="admin-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const LineChart = ({ data = [], label = "Count" }) => {
    const values = data.map((item) => Number(item.count) || 0);
    const max = Math.max(...values, 1);

    if (!data.length) {
      return (
        <EmptyState
          icon="▥"
          title="No chart data yet"
          message="Statistics will appear here as activity is recorded."
        />
      );
    }

    return (
      <div className="admin-chart">
        <div className="chart-axis-labels">
          <span>{number(max)}</span>
          <span>{number(Math.round(max / 2))}</span>
          <span>0</span>
        </div>
        <div className="chart-plot">
          <div className="chart-grid-line top" />
          <div className="chart-grid-line middle" />
          <div className="chart-grid-line bottom" />
          {data.map((item, index) => {
            const value = Number(item.count) || 0;
            const height = value ? Math.max(5, (value / max) * 100) : 2;

            return (
              <div
                className="chart-bar-column"
                key={`${item.label || item.date || "day"}-${index}`}
              >
                <div className="chart-bar-area">
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${label}: ${value}`}
                  />
                </div>
                <small>{item.label || item.date || `Day ${index + 1}`}</small>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DonutChart = () => {
    const concerns = Array.isArray(stats.popularConcerns)
      ? stats.popularConcerns
      : [];

    const total = concerns.reduce(
      (sum, item) => sum + (Number(item.count) || 0),
      0
    );

    const colors = ["#db2777", "#8b5cf6", "#0891b2", "#d97706", "#059669"];

    if (!total) {
      return (
        <EmptyState
          icon="◉"
          title="No scan distribution"
          message="Skin concern data will appear when scans are recorded."
        />
      );
    }

    let current = 0;

    const segments = concerns.map((item, index) => {
      const percentage = ((Number(item.count) || 0) / total) * 100;
      const start = current;
      current += percentage;

      return {
        ...item,
        percentage,
        start,
        color: colors[index % colors.length],
      };
    });

    const gradient = segments
      .map(
        (item) =>
          `${item.color} ${item.start}% ${item.start + item.percentage}%`
      )
      .join(", ");

    return (
      <div className="donut-layout">
        <div
          className="donut-chart"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="donut-inner">
            <strong>{number(total)}</strong>
            <span>Total scans</span>
          </div>
        </div>
        <div className="donut-legend">
          {segments.map((item, index) => (
            <div
              className="legend-item"
              key={item._id || item.label || index}
            >
              <span
                className="legend-dot"
                style={{ background: item.color }}
              />
              <span>{item._id || item.label || "Other"}</span>
              <strong>{item.percentage.toFixed(0)}%</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StatusBadge = ({ value }) => (
    <span
      className={`admin-status-badge ${STATUS_COLORS[value] || "neutral"}`}
    >
      {value || "Unknown"}
    </span>
  );

  const ServiceStatus = ({ name, status, detail }) => {
    const good = ["Online", "Connected", "Active"].includes(status);
    const pending = ["Checking", "Unknown", "Configured"].includes(status);

    return (
      <div className="service-status-item">
        <span
          className={`service-indicator ${
            good ? "good" : pending ? "pending" : "bad"
          }`}
        />
        <div className="service-copy">
          <strong>{name}</strong>
          <small>{detail}</small>
        </div>
        <span
          className={`service-state ${
            good ? "good" : pending ? "pending" : "bad"
          }`}
        >
          {status}
        </span>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <div className="admin-brand-area">
          <div className="admin-logo">✦</div>
          <div>
            <h1>
              AI Skincare
              <span>Admin Center</span>
            </h1>
            <p>Administration · Analytics · Operations</p>
          </div>
        </div>

        <div className="admin-header-actions">
          <div className="admin-status">
            <span
              className={`status-dot ${
                health.node === "Online" ? "" : "status-dot-offline"
              }`}
            />
            {health.node === "Online" ? "Backend Online" : "Backend Status"}
          </div>

          <div className="admin-user">
            <div className="admin-avatar">{adminInitial}</div>
            <div>
              <strong>{adminName}</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button
            className="admin-logout-button"
            onClick={onLogout}
            type="button"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </header>

      <section className="admin-welcome-card">
        <div>
          <span className="admin-small-label">ADMINISTRATION / DASHBOARD</span>
          <h2>Welcome back, {adminName}.</h2>
          <p>
            Your central workspace for monitoring platform activity, reviewing
            customer feedback, managing orders and checking system health.
          </p>
        </div>
        <div className="admin-last-updated">
          <span>Last data refresh</span>
          <strong>
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "Not refreshed"}
          </strong>
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading || healthLoading}
          >
            ↻ Refresh data
          </button>
        </div>
      </section>

      {notice && (
        <div
          className={`admin-notice ${notice.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{notice.type === "error" ? "!" : "✓"}</span>
          <p>{notice.message}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <nav className="admin-tabs" aria-label="Admin navigation">
        {[
          ["overview", "▦", "Overview"],
          ["users", "♙", "Users"],
          ["orders", "▤", "Orders"],
          ["reviews", "☆", "Reviews"],
          ["model", "◈", "AI Performance"],
          ["system", "⚙", "System"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-tab ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <span>{icon}</span>
            {label}
            {id === "reviews" && (
              <span className="tab-count">{safeReviews.length}</span>
            )}
            {id === "orders" && (
              <span className="tab-count">{orderSummary.total}</span>
            )}
          </button>
        ))}
      </nav>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <main>
          <div className="admin-section-intro">
            <div>
              <h2>Platform overview</h2>
              <p>
                A snapshot of user activity, AI scans and customer experience.
              </p>
            </div>
            <span className="admin-data-label">Live API data</span>
          </div>

          <div className="admin-stats-grid">
            <StatCard
              icon="♙"
              title="Registered Users"
              value={number(stats.totalUsers)}
              subtitle="Total accounts"
            />
            <StatCard
              icon="◎"
              title="Skin Scans"
              value={number(stats.totalScans)}
              subtitle={`${number(stats.todayScans)} today`}
              accent="purple"
            />
            <StatCard
              icon="☆"
              title="Average Rating"
              value={`${averageRating}/5`}
              subtitle={`${safeReviews.length} customer reviews`}
              accent="amber"
            />
            <StatCard
              icon="▤"
              title="Shop Orders"
              value={number(orderSummary.total)}
              subtitle={
                ordersLoading
                  ? "Refreshing orders..."
                  : `${orderSummary.pending} awaiting processing`
              }
              accent="blue"
            />
            <StatCard
              icon="↗"
              title="Today's Sign-ups"
              value={number(stats.todayUsers)}
              subtitle="New accounts today"
              accent="green"
            />
            <StatCard
              icon="◷"
              title="AI Response Time"
              value={
                isValidMetric(stats.avgResponseTime)
                  ? `${Number(stats.avgResponseTime).toFixed(2)}s`
                  : "Not measured"
              }
              subtitle={
                Number(stats.responseTimeSamples) > 0
                  ? `Measured from ${number(stats.responseTimeSamples)} scans`
                  : "Waiting for measured scan timings"
              }
              accent="purple"
            />
          </div>

          <div className="admin-dashboard-grid">
            <section className="admin-panel large">
              <PanelHeading
                eyebrow="USER ANALYTICS"
                title="Registration activity"
                description="Daily new user registrations over the last seven days."
              />
              <LineChart data={stats.userGrowth} label="Users" />
            </section>
            <section className="admin-panel">
              <PanelHeading
                eyebrow="SKIN ANALYTICS"
                title="Popular concerns"
                description="Distribution of recorded skin analysis results."
              />
              <DonutChart />
            </section>
          </div>

          <div className="admin-dashboard-grid">
            <section className="admin-panel large">
              <PanelHeading
                eyebrow="DAILY ACTIVITY"
                title="Skin scan trend"
                description="Recorded analyses over the last seven days."
              />
              <LineChart data={stats.scanTrend} label="Scans" />
            </section>
            <section className="admin-panel">
              <PanelHeading eyebrow="MODEL MONITORING" title="Model accuracy" />
              <div className="accuracy-display">
                <div
                  className="accuracy-ring"
                  style={{
                    background: isValidMetric(stats.modelAccuracy)
                      ? `conic-gradient(#db2777 ${Math.min(
                          100,
                          Math.max(0, Number(stats.modelAccuracy))
                        )}%, #f1e5ed 0)`
                      : "conic-gradient(#e5dbe3 100%, #e5dbe3 0)",
                  }}
                >
                  <div>
                    <strong>
                      {isValidMetric(stats.modelAccuracy)
                        ? `${Number(stats.modelAccuracy).toFixed(1)}%`
                        : "N/A"}
                    </strong>
                    <span>
                      {isValidMetric(stats.modelAccuracy)
                        ? getMetricSource(stats)
                        : "No verified metric"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="admin-disclaimer">
                Accuracy is displayed only when supplied by the backend. A
                reported configuration value is not proof of measured model
                performance. Use held-out validation results for academic
                reporting.
              </p>
            </section>
          </div>

          <div className="admin-dashboard-grid">
            <section className="admin-panel">
              <PanelHeading eyebrow="INFRASTRUCTURE" title="Service health" />
              <div className="service-status-list">
                <ServiceStatus
                  name="Node.js API"
                  status={health.node}
                  detail="Port 5000"
                />
                <ServiceStatus
                  name="MongoDB"
                  status={health.mongodb}
                  detail="Database connection"
                />
                <ServiceStatus
                  name="Python AI service"
                  status={health.python}
                  detail="Endpoint status from backend health response"
                />
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={fetchHealth}
                disabled={healthLoading}
              >
                {healthLoading ? "Checking..." : "Check services"}
              </button>
            </section>

            <section className="admin-panel">
              <PanelHeading eyebrow="SHOP OPERATIONS" title="Order summary" />
              <div className="order-summary-list">
                <div>
                  <span>Awaiting processing</span>
                  <strong>{orderSummary.pending}</strong>
                </div>
                <div>
                  <span>In transit</span>
                  <strong>{orderSummary.shipping}</strong>
                </div>
                <div>
                  <span>Delivered</span>
                  <strong>{orderSummary.delivered}</strong>
                </div>
                <div>
                  <span>Cancelled</span>
                  <strong>{orderSummary.cancelled}</strong>
                </div>
                <div>
                  <span>UPI payments to review</span>
                  <strong>{orderSummary.paymentReview}</strong>
                </div>
              </div>
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setActiveTab("orders")}
              >
                Manage orders →
              </button>
            </section>
          </div>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="RECENT REGISTRATIONS"
              title="Latest platform activity"
              description="Most recently registered accounts returned by the statistics API."
              action={
                <button
                  type="button"
                  className="admin-text-button"
                  onClick={() => setActiveTab("users")}
                >
                  View users →
                </button>
              }
            />
            {stats.recentUsers?.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Account</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((item, index) => (
                      <tr key={item._id || item.id || index}>
                        <td>
                          <strong>{item.name || item.username || "User"}</strong>
                        </td>
                        <td>{item.email || "—"}</td>
                        <td>{dateTime(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No recent registrations"
                message="New account activity will appear here."
              />
            )}
          </section>
        </main>
      )}

      {/* USERS */}
      {activeTab === "users" && (
        <section>
          <div className="admin-section-intro">
            <div>
              <h2>User management</h2>
              <p>Review registered accounts and account creation dates.</p>
            </div>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={fetchUsers}
              disabled={usersLoading}
            >
              {usersLoading ? "Loading..." : "↻ Refresh users"}
            </button>
          </div>

          <div className="admin-stats-grid">
            <StatCard
              icon="♙"
              title="Registered Users"
              value={number(stats.totalUsers)}
              subtitle="Total accounts"
            />
            <StatCard
              icon="↗"
              title="New Today"
              value={number(stats.todayUsers)}
              subtitle="Today's registrations"
              accent="green"
            />
            <StatCard
              icon="◎"
              title="Total Scans"
              value={number(stats.totalScans)}
              subtitle="Recorded analyses"
              accent="purple"
            />
            <StatCard
              icon="▤"
              title="Total Logins"
              value={number(stats.totalLogins)}
              subtitle="Login count supplied by API"
              accent="blue"
            />
          </div>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="ACCOUNT DIRECTORY"
              title="Registered users"
              description={`${filteredUsers.length} accounts shown`}
            />
            <div className="admin-toolbar">
              <input
                className="admin-search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name or email..."
                aria-label="Search users"
              />
            </div>

            {usersLoading ? (
              <EmptyState
                title="Loading users..."
                message="Fetching accounts from the backend."
              />
            ) : filteredUsers.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item, index) => (
                      <tr key={item._id || item.id || index}>
                        <td>
                          <div className="table-user">
                            <span className="table-avatar">
                              {(item.name || item.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <strong>{item.name || item.username || "User"}</strong>
                          </div>
                        </td>
                        <td>{item.email || "—"}</td>
                        <td>
                          <span className="admin-role-badge">
                            {getUserRole(item)}
                          </span>
                        </td>
                        <td>{dateTime(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No users found"
                message="Try another search or check whether accounts have been registered."
              />
            )}
          </section>

          <div className="admin-info-banner">
            <strong>Privacy and security</strong>
            <p>
              Passwords and authentication credentials are excluded from the
              account directory.
            </p>
          </div>
        </section>
      )}

      {/* ORDERS */}
      {activeTab === "orders" && (
        <section>
          <div className="admin-section-intro">
            <div>
              <h2>Order management</h2>
              <p>
                Manage customer purchases, delivery progress and UPI payment
                verification.
              </p>
            </div>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={fetchOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Loading..." : "↻ Refresh orders"}
            </button>
          </div>

          <div className="admin-stats-grid">
            <StatCard
              icon="▤"
              title="Total Orders"
              value={number(orderSummary.total)}
              subtitle="All retrieved orders"
              accent="blue"
            />
            <StatCard
              icon="◷"
              title="Processing"
              value={number(orderSummary.pending)}
              subtitle="Order placed"
              accent="amber"
            />
            <StatCard
              icon="⇢"
              title="In Transit"
              value={number(orderSummary.shipping)}
              subtitle="Confirmed or shipping"
              accent="purple"
            />
            <StatCard
              icon="✓"
              title="Delivered"
              value={number(orderSummary.delivered)}
              subtitle="Completed deliveries"
              accent="green"
            />
          </div>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="SHOP OPERATIONS"
              title="Customer orders"
              description="Update delivery statuses and review submitted UPI transaction references."
            />
            <div className="admin-toolbar admin-orders-toolbar">
              <input
                className="admin-search"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search order number, customer or product..."
                aria-label="Search orders"
              />
              <select
                className="admin-select"
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
                aria-label="Filter orders by status"
              >
                <option value="All">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {ordersLoading ? (
              <EmptyState
                title="Loading orders..."
                message="Retrieving customer orders from MongoDB."
              />
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                icon="▤"
                title="No orders found"
                message="Orders will appear here after customers complete checkout."
              />
            ) : (
              <div className="admin-orders-list">
                {filteredOrders.map((order) => (
                  <article className="admin-order-card" key={order._id}>
                    <div className="admin-order-top">
                      <div>
                        <span className="panel-kicker">ORDER REFERENCE</span>
                        <h3>{order.orderNumber || order._id}</h3>
                        <p>{dateTime(order.createdAt)}</p>
                      </div>
                      <StatusBadge value={order.orderStatus} />
                    </div>

                    <div className="admin-order-customer">
                      <div>
                        <span>Customer</span>
                        <strong>{order.customer?.name || "Customer"}</strong>
                        <small>
                          {order.customer?.email || "No email provided"}
                        </small>
                      </div>
                      <div>
                        <span>Payment method</span>
                        <strong>{order.paymentMethod || "—"}</strong>
                        <StatusBadge value={order.paymentStatus || "Pending"} />
                      </div>
                      <div>
                        <span>Order total</span>
                        <strong className="order-total">
                          {money(order.totalAmount)}
                        </strong>
                        <small>
                          {(order.items || []).length} product line(s)
                        </small>
                      </div>
                    </div>

                    <div className="admin-order-products">
                      {(order.items || []).map((item, index) => (
                        <div
                          className="admin-order-product"
                          key={item.productId || index}
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name || "Product"} />
                          ) : (
                            <span className="order-product-placeholder">✦</span>
                          )}
                          <div>
                            <strong>{item.name || "Product"}</strong>
                            <small>
                              Qty: {item.quantity || 1} × {money(item.price)}
                            </small>
                          </div>
                          <strong>
                            {money(
                              item.subtotal ??
                                Number(item.price) * Number(item.quantity || 1)
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {order.paymentMethod === "UPI" && (
                      <div className="admin-payment-box">
                        <div>
                          <strong>UPI payment verification</strong>
                          <p>Reference: {order.utr || "Not submitted yet"}</p>
                          {order.verifiedAt && (
                            <small>Verified: {dateTime(order.verifiedAt)}</small>
                          )}
                          {order.adminNote && (
                            <small>Admin note: {order.adminNote}</small>
                          )}
                        </div>
                        {order.paymentStatus === "Submitted" && (
                          <div className="admin-payment-actions">
                            <button
                              type="button"
                              className="admin-primary-button"
                              disabled={verifyingOrderId === order._id}
                              onClick={() => verifyPayment(order, "verify")}
                            >
                              {verifyingOrderId === order._id
                                ? "Updating..."
                                : "Verify payment"}
                            </button>
                            <button
                              type="button"
                              className="admin-danger-button"
                              disabled={verifyingOrderId === order._id}
                              onClick={() => verifyPayment(order, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="admin-order-footer">
                      <div className="admin-order-status-control">
                        <label htmlFor={`status-${order._id}`}>
                          Delivery status
                        </label>
                        <select
                          id={`status-${order._id}`}
                          className="admin-select"
                          value={order.orderStatus || "Order Placed"}
                          disabled={
                            updatingOrderId === order._id ||
                            ["Delivered", "Cancelled"].includes(order.orderStatus)
                          }
                          onChange={(event) =>
                            updateOrderStatus(order, event.target.value)
                          }
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option
                              key={status}
                              value={status}
                              disabled={
                                ["Delivered", "Cancelled"].includes(
                                  order.orderStatus
                                ) && status !== order.orderStatus
                              }
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setOrderNote("");
                          setPaymentNote("");
                        }}
                      >
                        View details
                      </button>
                    </div>
                    {updatingOrderId === order._id && (
                      <p className="admin-inline-message">
                        Updating order status...
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {/* REVIEWS */}
      {activeTab === "reviews" && (
        <section>
          <div className="admin-section-intro">
            <div>
              <h2>Reviews and feedback</h2>
              <p>Monitor customer ratings and manage submitted feedback.</p>
            </div>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={onRefreshReviews}
              disabled={!onRefreshReviews}
            >
              ↻ Refresh reviews
            </button>
          </div>

          <div className="review-overview admin-panel">
            <div className="review-big-score">
              <strong>{averageRating}</strong>
              <span>Average customer rating</span>
              <div className="review-big-stars">
                {"★".repeat(Math.round(Number(averageRating)))}
              </div>
              <small>{safeReviews.length} total reviews</small>
            </div>
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating];
                const percentage = safeReviews.length
                  ? (count / safeReviews.length) * 100
                  : 0;

                return (
                  <div className="rating-row" key={rating}>
                    <span>{rating} ★</span>
                    <div className="rating-track">
                      <div style={{ width: `${percentage}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="CUSTOMER EXPERIENCE"
              title="All reviews"
              description="Review feedback and remove inappropriate submissions."
            />
            {safeReviews.length === 0 ? (
              <EmptyState
                icon="☆"
                title="No reviews yet"
                message="Customer feedback will appear here after submission."
              />
            ) : (
              <div className="admin-review-list">
                {safeReviews.map((review, index) => {
                  const reviewName =
                    typeof review.user === "string"
                      ? review.user
                      : review.user?.name || review.name || "Anonymous";

                  const rating = Math.min(
                    5,
                    Math.max(1, Number(review.rating) || 5)
                  );

                  return (
                    <article
                      className="admin-review-card"
                      key={review._id || index}
                    >
                      <div className="review-user-avatar">
                        {reviewName.charAt(0).toUpperCase()}
                      </div>
                      <div className="review-content">
                        <div className="review-top">
                          <strong>{reviewName}</strong>
                          <span className="review-stars">
                            {"★".repeat(rating)}
                            {"☆".repeat(5 - rating)}
                          </span>
                        </div>
                        <p>{review.text || "No comment provided."}</p>
                        <small>{dateTime(review.createdAt)}</small>
                      </div>
                      <button
                        type="button"
                        className="review-delete-button"
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={deletingId === review._id || !review._id}
                        title="Delete review"
                        aria-label="Delete review"
                      >
                        {deletingId === review._id ? "…" : "×"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      )}

      {/* AI PERFORMANCE */}
      {activeTab === "model" && (
        <section>
          <div className="admin-section-intro">
            <div>
              <h2>AI performance</h2>
              <p>Review model configuration and recorded scan activity.</p>
            </div>
            <span className="admin-data-label">Backend metrics</span>
          </div>

          <div className="model-hero-panel">
            <div className="model-icon">◈</div>
            <div className="model-hero-copy">
              <span>CURRENT MODEL CONFIGURATION</span>
              <h2>Convolutional Neural Network</h2>
              <p>
                Image-based skin concern classification through your Python AI
                service.
              </p>
            </div>
            <div className="model-accuracy-big">
              <strong>
                {isValidMetric(stats.modelAccuracy)
                  ? `${Number(stats.modelAccuracy).toFixed(1)}%`
                  : "N/A"}
              </strong>
              <span>
                {isValidMetric(stats.modelAccuracy)
                  ? getMetricSource(stats)
                  : "Accuracy not supplied"}
              </span>
            </div>
          </div>

          <div className="model-metrics-grid">
            <article className="admin-panel">
              <span className="panel-kicker">INPUT</span>
              <h3>Facial images</h3>
              <p>
                Front, left and right image inputs are supported by the
                application workflow.
              </p>
            </article>
            <article className="admin-panel">
              <span className="panel-kicker">ACTIVITY</span>
              <h3>{number(stats.totalScans)} scans</h3>
              <p>Total scan records reported by the backend.</p>
            </article>
            <article className="admin-panel">
              <span className="panel-kicker">RESPONSE TIME</span>
              <h3>
                {isValidMetric(stats.avgResponseTime)
                  ? `${Number(stats.avgResponseTime).toFixed(2)} seconds`
                  : "Not measured"}
              </h3>
              <p>
                Average timing supplied by the backend. Live benchmarking
                requires measured request durations.
              </p>
            </article>
          </div>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="MODEL QUALITY"
              title="Reported performance"
              description="Accuracy should be based on a held-out evaluation dataset."
            />
            <ProgressBar
              label="Backend-reported model accuracy"
              value={stats.modelAccuracy}
            />
          </section>

          <div className="admin-info-banner">
            <strong>Model evaluation recommendation</strong>
            <p>
              For academic reporting, calculate accuracy, precision, recall and
              F1-score from a held-out test set. Avoid presenting illustrative
              or configured metrics as measured results. This dashboard does
              not calculate those metrics from the model itself.
            </p>
          </div>
        </section>
      )}

      {/* SYSTEM */}
      {activeTab === "system" && (
        <section>
          <div className="admin-section-intro">
            <div>
              <h2>System diagnostics</h2>
              <p>
                Check backend availability and infrastructure configuration.
              </p>
            </div>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={fetchHealth}
              disabled={healthLoading}
            >
              {healthLoading ? "Checking..." : "↻ Run health check"}
            </button>
          </div>

          <div className="admin-stats-grid">
            <StatCard
              icon="◉"
              title="Backend API"
              value={health.node}
              subtitle="HTTP health check"
            />
            <StatCard
              icon="▤"
              title="MongoDB"
              value={health.mongodb}
              subtitle="Database connection"
              accent="purple"
            />
            <StatCard
              icon="◈"
              title="Python Service"
              value={health.python}
              subtitle="Reported service status"
              accent="blue"
            />
            <StatCard
              icon="🔒"
              title="Authentication"
              value={token ? "Active" : "Unavailable"}
              subtitle="JWT token supplied to dashboard"
              accent="green"
            />
          </div>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="INFRASTRUCTURE"
              title="Service diagnostics"
              description="Node.js and MongoDB are checked against the backend health endpoint."
            />
            <div className="service-status-list">
              <ServiceStatus
                name="Node.js backend"
                status={health.node}
                detail="http://localhost:5000 · Port 5000"
              />
              <ServiceStatus
                name="MongoDB"
                status={health.mongodb}
                detail="Database connectivity reported by /health"
              />
              <ServiceStatus
                name="Python AI service"
                status={health.python}
                detail="Python status reported by backend health endpoint"
              />
              <ServiceStatus
                name="JWT authentication"
                status={token ? "Active" : "Unknown"}
                detail="Admin session token supplied to dashboard"
              />
            </div>
            <p className="admin-disclaimer">
              Python is shown as Online only when the health endpoint
              explicitly reports an online or connected state. If your /health
              endpoint does not check Python, its status remains Unknown or
              Configured.
            </p>
          </section>

          <section className="admin-panel">
            <PanelHeading
              eyebrow="PLATFORM METRICS"
              title="Operational summary"
            />
            <div className="order-summary-list">
              <div>
                <span>Registered users</span>
                <strong>{number(stats.totalUsers)}</strong>
              </div>
              <div>
                <span>Recorded scans</span>
                <strong>{number(stats.totalScans)}</strong>
              </div>
              <div>
                <span>Customer reviews</span>
                <strong>{number(safeReviews.length)}</strong>
              </div>
              <div>
                <span>Shop orders</span>
                <strong>{number(orderSummary.total)}</strong>
              </div>
              <div>
                <span>Non-cancelled order value</span>
                <strong>{money(orderSummary.revenue)}</strong>
              </div>
              <div>
                <span>Last refresh</span>
                <strong>
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
                </strong>
              </div>
            </div>
          </section>
        </section>
      )}

      <footer className="admin-footer">
        <span>✦ AI Skincare Analysis System</span>
        <span>Administration Console · {new Date().getFullYear()}</span>
      </footer>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            className="admin-order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-heading">
              <div>
                <span className="panel-kicker">ORDER DETAILS</span>
                <h2 id="order-modal-title">
                  {selectedOrder.orderNumber || selectedOrder._id}
                </h2>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-detail-grid">
                <div>
                  <span>Customer</span>
                  <strong>{selectedOrder.customer?.name || "—"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{selectedOrder.customer?.email || "—"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{selectedOrder.customer?.phone || "—"}</strong>
                </div>
                <div>
                  <span>Order date</span>
                  <strong>{dateTime(selectedOrder.createdAt)}</strong>
                </div>
                <div>
                  <span>Payment method</span>
                  <strong>{selectedOrder.paymentMethod || "—"}</strong>
                </div>
                <div>
                  <span>Payment status</span>
                  <StatusBadge value={selectedOrder.paymentStatus} />
                </div>
                <div>
                  <span>Delivery status</span>
                  <StatusBadge value={selectedOrder.orderStatus} />
                </div>
                <div>
                  <span>Total amount</span>
                  <strong>{money(selectedOrder.totalAmount)}</strong>
                </div>
              </div>

              <div className="admin-address-box">
                <strong>Shipping address</strong>
                <p>
                  {[
                    selectedOrder.customer?.address,
                    selectedOrder.customer?.city,
                    selectedOrder.customer?.state,
                    selectedOrder.customer?.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No shipping address provided."}
                </p>
              </div>

              <h3>Order items</h3>
              {(selectedOrder.items || []).map((item, index) => (
                <div
                  className="admin-order-product"
                  key={item.productId || index}
                >
                  <div>
                    <strong>{item.name || "Product"}</strong>
                    <small>Quantity: {item.quantity || 1}</small>
                  </div>
                  <strong>
                    {money(
                      item.subtotal ??
                        Number(item.price) * Number(item.quantity || 1)
                    )}
                  </strong>
                </div>
              ))}

              <div className="admin-address-box">
                <strong>Update note (optional)</strong>
                <textarea
                  className="admin-note-input"
                  rows={3}
                  value={orderNote}
                  onChange={(event) => setOrderNote(event.target.value)}
                  maxLength={500}
                  placeholder="Add a delivery or order note..."
                />
              </div>

              <div className="admin-address-box">
                <strong>Payment verification note (optional)</strong>
                <textarea
                  className="admin-note-input"
                  rows={2}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  maxLength={500}
                  placeholder="Add a payment verification note..."
                />
              </div>

              {Array.isArray(selectedOrder.statusHistory) &&
                selectedOrder.statusHistory.length > 0 && (
                  <div className="admin-order-history">
                    <h3>Status history</h3>
                    {selectedOrder.statusHistory
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                        <div
                          className="admin-history-entry"
                          key={`${entry.updatedAt}-${index}`}
                        >
                          <span className="service-indicator good" />
                          <div>
                            <strong>{entry.status}</strong>
                            <small>{dateTime(entry.updatedAt)}</small>
                            {entry.note && <p>{entry.note}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              {selectedOrder.paymentMethod === "UPI" &&
                selectedOrder.paymentStatus === "Submitted" && (
                  <>
                    <button
                      type="button"
                      className="admin-danger-button"
                      disabled={verifyingOrderId === selectedOrder._id}
                      onClick={() => verifyPayment(selectedOrder, "reject")}
                    >
                      Reject payment
                    </button>
                    <button
                      type="button"
                      className="admin-primary-button"
                      disabled={verifyingOrderId === selectedOrder._id}
                      onClick={() => verifyPayment(selectedOrder, "verify")}
                    >
                      Verify payment
                    </button>
                  </>
                )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
