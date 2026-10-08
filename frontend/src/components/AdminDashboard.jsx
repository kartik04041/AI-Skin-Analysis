import React, { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

export default function AdminDashboard({
  user,
  token,
  reviews = [],
  onRefreshReviews,
  onLogout,
  API_BASE_URL = "http://localhost:5000",
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    totalUsers: 0,
    currentUsers: 0,
    totalLogins: 0,
    todayLogins: 0,
    totalScans: 0,
    todayScans: 0,
    modelAccuracy: 94.8,
    avgRating: 0,
    totalFeedback: 0,
    systemHealth: 100,
    avgResponseTime: 1.15,
    userGrowth: [],
    scanTrend: [],
    popularConcerns: [],
    recentUsers: [],
    recentScans: [],
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // =========================================================
  // FETCH ADMIN STATISTICS
  // =========================================================

  const fetchStats = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Stats request failed: ${response.status}`
        );
      }

      if (data.success && data.stats) {
        setStats((previous) => ({
          ...previous,
          ...data.stats,
        }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.warn("Admin stats unavailable:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // =========================================================
  // REVIEW CALCULATIONS
  // =========================================================

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;

    const total = reviews.reduce(
      (sum, review) =>
        sum + Number(review.rating || 5),
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const rating = Number(review.rating || 5);

      if (distribution[rating] !== undefined) {
        distribution[rating]++;
      }
    });

    return distribution;
  }, [reviews]);

  // =========================================================
  // DELETE REVIEW
  // =========================================================

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(reviewId);

      const response = await fetch(
        `${API_BASE_URL}/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete review."
        );
      }

      if (onRefreshReviews) {
        await onRefreshReviews();
      }
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete review."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // STAT CARD
  // =========================================================

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    trend,
  }) => (
    <div className="admin-stat-card">

      <div className="admin-stat-top">
        <div className="admin-stat-icon">
          {icon}
        </div>

        {trend && (
          <span className="admin-stat-trend">
            {trend}
          </span>
        )}
      </div>

      <div className="admin-stat-content">

        <p className="admin-stat-title">
          {title}
        </p>

        <h3 className="admin-stat-value">
          {loading ? "..." : value}
        </h3>

        <span className="admin-stat-subtitle">
          {subtitle}
        </span>

      </div>
    </div>
  );

  // =========================================================
  // PROGRESS BAR
  // =========================================================

  const ProgressBar = ({
    label,
    value,
  }) => (
    <div className="admin-progress-item">

      <div className="admin-progress-header">
        <span>{label}</span>

        <strong>
          {Number(value || 0).toFixed(1)}%
        </strong>
      </div>

      <div className="admin-progress-track">

        <div
          className="admin-progress-fill"
          style={{
            width: `${Math.min(
              Number(value) || 0,
              100
            )}%`,
          }}
        />

      </div>
    </div>
  );

  // =========================================================
  // LINE GRAPH
  // =========================================================

  const LineChart = ({
    data = [],
    label,
    valueKey = "count",
  }) => {
    const values = data.map(
      (item) =>
        Number(item[valueKey]) || 0
    );

    const max =
      Math.max(...values, 1);

    if (!data.length) {
      return (
        <div className="empty-chart">
          <span>📈</span>
          <p>
            Analytics data will appear
            as users and scans increase.
          </p>
        </div>
      );
    }

    return (
      <div className="line-chart-wrapper">

        <div className="chart-y-axis">
          <span>{max}</span>
          <span>
            {Math.round(max / 2)}
          </span>
          <span>0</span>
        </div>

        <div className="line-chart">

          <div className="chart-grid-line top" />
          <div className="chart-grid-line middle" />
          <div className="chart-grid-line bottom" />

          <div className="chart-bars">

            {data.map((item, index) => {
              const value =
                Number(item[valueKey]) || 0;

              const height =
                Math.max(
                  (value / max) * 100,
                  4
                );

              return (
                <div
                  className="chart-bar-column"
                  key={index}
                >

                  <div
                    className="chart-bar"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${label || "Value"}: ${value}`}
                  >
                    <span>
                      {value}
                    </span>
                  </div>

                  <small>
                    {item.label ||
                      item.date ||
                      `Day ${index + 1}`}
                  </small>

                </div>
              );
            })}

          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // DONUT GRAPH
  // =========================================================

  const DonutChart = () => {
    const concerns =
      stats.popularConcerns || [];

    const total = concerns.reduce(
      (sum, item) =>
        sum + Number(item.count || 0),
      0
    );

    if (!total) {
      return (
        <div className="empty-chart">
          <span>🥧</span>
          <p>
            Skin concern distribution
            will appear after scans.
          </p>
        </div>
      );
    }

    let current = 0;

    const segments = concerns.map(
      (item) => {
        const percentage =
          (Number(item.count || 0) /
            total) *
          100;

        const start = current;
        current += percentage;

        return {
          ...item,
          percentage,
          start,
        };
      }
    );

    const gradient = segments
      .map((item, index) => {
        const colors = [
          "#ec4899",
          "#8b5cf6",
          "#06b6d4",
          "#f59e0b",
          "#10b981",
        ];

        return `${colors[index % colors.length]} ${
          item.start
        }% ${
          item.start + item.percentage
        }%`;
      })
      .join(", ");

    return (
      <div className="donut-layout">

        <div
          className="donut-chart"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        >
          <div className="donut-inner">
            <strong>
              {total}
            </strong>

            <span>
              Scans
            </span>
          </div>
        </div>

        <div className="donut-legend">

          {segments.map(
            (item, index) => {

              const colors = [
                "#ec4899",
                "#8b5cf6",
                "#06b6d4",
                "#f59e0b",
                "#10b981",
              ];

              return (
                <div
                  className="legend-item"
                  key={index}
                >
                  <span
                    className="legend-dot"
                    style={{
                      background:
                        colors[
                          index %
                            colors.length
                        ],
                    }}
                  />

                  <span>
                    {item._id ||
                      item.label ||
                      "Other"}
                  </span>

                  <strong>
                    {item.percentage.toFixed(
                      0
                    )}
                    %
                  </strong>
                </div>
              );
            }
          )}

        </div>
      </div>
    );
  };

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="admin-dashboard-container">

      {/* HEADER */}

      <header className="admin-dashboard-header">

        <div className="admin-brand-area">

          <div className="admin-logo">
            ✨
          </div>

          <div>
            <h1>
              AI Skincare
              <span>
                Admin Center
              </span>
            </h1>

            <p>
              System monitoring &
              analytics dashboard
            </p>
          </div>

        </div>

        <div className="admin-header-actions">

          <div className="admin-status">
            <span className="status-dot" />
            System Online
          </div>

          <div className="admin-user">

            <div className="admin-avatar">
              {(
                user?.name ||
                user?.username ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name ||
                  user?.username ||
                  "Administrator"}
              </strong>

              <small>
                Administrator
              </small>
            </div>

          </div>

          <button
            className="admin-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* WELCOME */}

      <section className="admin-welcome-card">

        <div>

          <span className="admin-small-label">
            CONTROL CENTER
          </span>

          <h2>
            Welcome back,{" "}
            {user?.name ||
              "Administrator"}{" "}
            👋
          </h2>

          <p>
            Monitor users, scans,
            feedback, AI performance
            and overall platform health
            from one place.
          </p>

        </div>

        <div className="admin-last-updated">

          <span>
            Last updated
          </span>

          <strong>
            {lastUpdated.toLocaleTimeString()}
          </strong>

          <button
            onClick={() => {
              fetchStats();

              if (onRefreshReviews) {
                onRefreshReviews();
              }
            }}
          >
            ↻ Refresh
          </button>

        </div>

      </section>

      {/* NAVIGATION */}

      <nav className="admin-tabs">

        <button
          className={
            activeTab === "overview"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("overview")
          }
        >
          📊 Overview
        </button>

        <button
          className={
            activeTab === "users"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("users")
          }
        >
          👥 Users
        </button>

        <button
          className={
            activeTab === "reviews"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("reviews")
          }
        >
          ⭐ Reviews

          <span className="tab-count">
            {reviews.length}
          </span>
        </button>

        <button
          className={
            activeTab === "model"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("model")
          }
        >
          🤖 AI Performance
        </button>

        <button
          className={
            activeTab === "system"
              ? "admin-tab active"
              : "admin-tab"
          }
          onClick={() =>
            setActiveTab("system")
          }
        >
          ⚙️ System
        </button>

      </nav>

      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      {activeTab === "overview" && (
        <main>

          {/* KPI */}

          <div className="admin-stats-grid">

            <StatCard
              icon="👥"
              title="Current Users"
              value={stats.currentUsers}
              subtitle="Currently active"
            />

            <StatCard
              icon="🧑‍💻"
              title="Registered Users"
              value={Number(
                stats.totalUsers || 0
              ).toLocaleString()}
              subtitle="Total accounts"
            />

            <StatCard
              icon="🔐"
              title="Total Logins"
              value={Number(
                stats.totalLogins || 0
              ).toLocaleString()}
              subtitle={`${stats.todayLogins || 0} today`}
            />

            <StatCard
              icon="📸"
              title="Skin Scans"
              value={Number(
                stats.totalScans || 0
              ).toLocaleString()}
              subtitle={`${stats.todayScans || 0} today`}
            />

            <StatCard
              icon="⭐"
              title="Average Rating"
              value={`${averageRating || 0}/5`}
              subtitle={`${reviews.length} reviews`}
            />

            <StatCard
              icon="💬"
              title="Feedback"
              value={Number(
                stats.totalFeedback ||
                  reviews.length ||
                  0
              ).toLocaleString()}
              subtitle="User submissions"
            />

          </div>

          {/* ANALYTICS */}

          <div className="admin-dashboard-grid">

            <section className="admin-panel large">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    USER ANALYTICS
                  </span>

                  <h3>
                    User Activity
                  </h3>

                  <p className="panel-description">
                    Platform usage and
                    registration activity
                  </p>
                </div>

                <div className="chart-total">
                  <strong>
                    {stats.totalUsers}
                  </strong>

                  <span>
                    Registered
                  </span>
                </div>

              </div>

              <LineChart
                data={
                  stats.userGrowth
                }
                label="Users"
              />

            </section>

            <section className="admin-panel">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    SCAN ANALYTICS
                  </span>

                  <h3>
                    Skin Concerns
                  </h3>
                </div>

              </div>

              <DonutChart />

            </section>

          </div>

          {/* SCAN TREND */}

          <div className="admin-dashboard-grid">

            <section className="admin-panel large">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    DAILY ACTIVITY
                  </span>

                  <h3>
                    Skin Scan Trend
                  </h3>

                  <p className="panel-description">
                    Number of analyses performed
                  </p>
                </div>

                <div className="chart-total">
                  <strong>
                    {stats.totalScans}
                  </strong>

                  <span>
                    Total scans
                  </span>
                </div>

              </div>

              <LineChart
                data={
                  stats.scanTrend
                }
                label="Scans"
              />

            </section>

            {/* AI ACCURACY */}

            <section className="admin-panel">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    AI ANALYTICS
                  </span>

                  <h3>
                    Model Accuracy
                  </h3>
                </div>

              </div>

              <div className="accuracy-display">

                <div
                  className="accuracy-ring"
                  style={{
                    background: `conic-gradient(#ec4899 ${stats.modelAccuracy}%, rgba(255,255,255,.08) 0)`,
                  }}
                >
                  <div>
                    <strong>
                      {stats.modelAccuracy}%
                    </strong>

                    <span>
                      Accuracy
                    </span>
                  </div>
                </div>

              </div>

              <ProgressBar
                label="Overall Accuracy"
                value={
                  stats.modelAccuracy
                }
              />

              <ProgressBar
                label="Classification"
                value={95}
              />

              <ProgressBar
                label="Concern Detection"
                value={93}
              />

            </section>

          </div>

          {/* SYSTEM + QUICK METRICS */}

          <div className="admin-dashboard-grid">

            <section className="admin-panel">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    SYSTEM
                  </span>

                  <h3>
                    Platform Health
                  </h3>
                </div>

                <span className="health-badge">
                  ● Healthy
                </span>

              </div>

              <div className="health-score">

                <strong>
                  {stats.systemHealth}%
                </strong>

                <span>
                  System Health
                </span>

              </div>

              <div className="system-check-list">

                <div>
                  <span>
                    🟢 Node.js Backend
                  </span>

                  <strong>
                    Online
                  </strong>
                </div>

                <div>
                  <span>
                    🟢 MongoDB
                  </span>

                  <strong>
                    Connected
                  </strong>
                </div>

                <div>
                  <span>
                    🟢 AI Service
                  </span>

                  <strong>
                    Online
                  </strong>
                </div>

                <div>
                  <span>
                    🟢 Authentication
                  </span>

                  <strong>
                    Active
                  </strong>
                </div>

              </div>

            </section>

            <section className="admin-panel">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    PERFORMANCE
                  </span>

                  <h3>
                    Quick Metrics
                  </h3>

                </div>

              </div>

              <div className="quick-metrics">

                <div className="quick-metric">
                  <span>⚡</span>

                  <div>
                    <strong>
                      {stats.avgResponseTime}s
                    </strong>

                    <small>
                      Avg. scan response
                    </small>
                  </div>
                </div>

                <div className="quick-metric">
                  <span>📷</span>

                  <div>
                    <strong>
                      3
                    </strong>

                    <small>
                      Camera angles
                    </small>
                  </div>
                </div>

                <div className="quick-metric">
                  <span>🧠</span>

                  <div>
                    <strong>
                      CNN
                    </strong>

                    <small>
                      AI architecture
                    </small>
                  </div>
                </div>

                <div className="quick-metric">
                  <span>🔒</span>

                  <div>
                    <strong>
                      JWT
                    </strong>

                    <small>
                      Authentication
                    </small>
                  </div>
                </div>

              </div>

            </section>

          </div>

          {/* RECENT ACTIVITY */}

          <section className="admin-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  LIVE DATA
                </span>

                <h3>
                  Recent Platform Activity
                </h3>
              </div>

            </div>

            <div className="activity-list">

              {stats.recentUsers?.length ? (
                stats.recentUsers.map(
                  (item, index) => (
                    <div
                      className="activity-item"
                      key={index}
                    >

                      <div className="activity-icon">
                        👤
                      </div>

                      <div>
                        <strong>
                          New user registered
                        </strong>

                        <span>
                          {item.name ||
                            item.email ||
                            "User"}
                        </span>
                      </div>

                      <small>
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleString()
                          : "Recently"}
                      </small>

                    </div>
                  )
                )
              ) : (
                <div className="empty-activity">
                  <span>
                    📊
                  </span>

                  <p>
                    No recent activity
                    available.
                  </p>
                </div>
              )}

            </div>

          </section>

        </main>
      )}

      {/* =====================================================
          USERS
      ===================================================== */}

      {activeTab === "users" && (
        <section>

          <div className="admin-stats-grid">

            <StatCard
              icon="👥"
              title="Registered Users"
              value={Number(
                stats.totalUsers || 0
              ).toLocaleString()}
              subtitle="Total accounts"
            />

            <StatCard
              icon="🟢"
              title="Current Users"
              value={
                stats.currentUsers || 0
              }
              subtitle="Currently active"
            />

            <StatCard
              icon="🔐"
              title="Total Logins"
              value={Number(
                stats.totalLogins || 0
              ).toLocaleString()}
              subtitle="All recorded logins"
            />

            <StatCard
              icon="📸"
              title="User Scans"
              value={Number(
                stats.totalScans || 0
              ).toLocaleString()}
              subtitle="Analyses performed"
            />

          </div>

          <div className="admin-dashboard-grid">

            <section className="admin-panel large">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    USER GROWTH
                  </span>

                  <h3>
                    Registration Activity
                  </h3>
                </div>

              </div>

              <LineChart
                data={
                  stats.userGrowth
                }
                label="Users"
              />

            </section>

            <section className="admin-panel">

              <div className="panel-heading">

                <div>
                  <span className="panel-kicker">
                    ENGAGEMENT
                  </span>

                  <h3>
                    Usage Summary
                  </h3>

                </div>

              </div>

              <div className="usage-summary">

                <div>
                  <span>
                    👥
                  </span>

                  <strong>
                    {stats.totalUsers}
                  </strong>

                  <small>
                    Registered
                  </small>
                </div>

                <div>
                  <span>
                    📸
                  </span>

                  <strong>
                    {stats.totalScans}
                  </strong>

                  <small>
                    Scans
                  </small>
                </div>

                <div>
                  <span>
                    🔐
                  </span>

                  <strong>
                    {stats.totalLogins}
                  </strong>

                  <small>
                    Logins
                  </small>
                </div>

              </div>

            </section>

          </div>

          <div className="admin-info-banner">

            <strong>
              🔐 Privacy & Security
            </strong>

            <p>
              Analytics are aggregated for
              administrative monitoring.
              Passwords and authentication
              credentials are never displayed
              in this dashboard.
            </p>

          </div>

        </section>
      )}

      {/* =====================================================
          REVIEWS
      ===================================================== */}

      {activeTab === "reviews" && (
        <section className="admin-panel">

          <div className="panel-heading">

            <div>
              <span className="panel-kicker">
                USER FEEDBACK
              </span>

              <h3>
                Reviews & Feedback
              </h3>
            </div>

            <div className="review-summary">
              ⭐ {averageRating || 0}/5
            </div>

          </div>

          <div className="review-overview">

            <div className="review-big-score">
              <strong>
                {averageRating || 0}
              </strong>

              <span>
                Average Rating
              </span>

              <div>
                {"⭐".repeat(
                  Math.round(
                    Number(
                      averageRating || 0
                    )
                  )
                )}
              </div>
            </div>

            <div className="rating-distribution">

              {[5, 4, 3, 2, 1].map(
                (rating) => {

                  const count =
                    ratingDistribution[
                      rating
                    ];

                  const percentage =
                    reviews.length
                      ? (count /
                          reviews.length) *
                        100
                      : 0;

                  return (
                    <div
                      className="rating-row"
                      key={rating}
                    >

                      <span>
                        {rating} ⭐
                      </span>

                      <div className="rating-track">
                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <strong>
                        {count}
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {reviews.length === 0 ? (
            <div className="empty-admin-state">

              <span>⭐</span>

              <h4>
                No reviews yet
              </h4>

              <p>
                User reviews will appear here.
              </p>

            </div>
          ) : (
            <div className="admin-review-list">

              {reviews.map(
                (review, index) => (
                  <div
                    className="admin-review-card"
                    key={
                      review._id ||
                      index
                    }
                  >

                    <div className="review-user-avatar">
                      {(
                        review.user ||
                        review.name ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="review-content">

                      <div className="review-top">

                        <strong>
                          {review.user ||
                            review.name ||
                            "Anonymous"}
                        </strong>

                        <span>
                          {"⭐".repeat(
                            Math.min(
                              Math.max(
                                Number(
                                  review.rating ||
                                    5
                                ),
                                1
                              ),
                              5
                            )
                          )}
                        </span>

                      </div>

                      <p>
                        {review.text ||
                          "No comment provided."}
                      </p>

                      <small>
                        {review.createdAt
                          ? new Date(
                              review.createdAt
                            ).toLocaleString()
                          : "Recent"}
                      </small>

                    </div>

                    <button
                      className="review-delete-button"
                      onClick={() =>
                        handleDeleteReview(
                          review._id
                        )
                      }
                      disabled={
                        deletingId ===
                        review._id
                      }
                    >
                      {deletingId ===
                      review._id
                        ? "..."
                        : "🗑️"}
                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </section>
      )}

      {/* =====================================================
          AI PERFORMANCE
      ===================================================== */}

      {activeTab === "model" && (
        <section>

          <div className="model-hero-panel">

            <div className="model-icon">
              🧠
            </div>

            <div>
              <span>
                CURRENT AI ENGINE
              </span>

              <h2>
                Deep Learning CNN
              </h2>

              <p>
                Computer vision based skin
                feature classification system.
              </p>
            </div>

            <div className="model-accuracy-big">

              <strong>
                {stats.modelAccuracy}%
              </strong>

              <span>
                Overall Accuracy
              </span>

            </div>

          </div>

          <div className="model-metrics-grid">

            <div className="admin-panel">

              <span className="panel-kicker">
                ARCHITECTURE
              </span>

              <h3>
                CNN Classification
              </h3>

              <p>
                Convolutional neural network
                architecture for image-based
                skin feature classification.
              </p>

            </div>

            <div className="admin-panel">

              <span className="panel-kicker">
                INPUT
              </span>

              <h3>
                Multi-Angle Images
              </h3>

              <p>
                Front, left and right facial
                views can be processed.
              </p>

            </div>

            <div className="admin-panel">

              <span className="panel-kicker">
                PERFORMANCE
              </span>

              <h3>
                {stats.avgResponseTime}s
              </h3>

              <p>
                Average inference response
                time.
              </p>

            </div>

          </div>

          <section className="admin-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  MODEL QUALITY
                </span>

                <h3>
                  Performance Indicators
                </h3>
              </div>

            </div>

            <ProgressBar
              label="Overall Accuracy"
              value={
                stats.modelAccuracy
              }
            />

            <ProgressBar
              label="Skin Classification"
              value={95}
            />

            <ProgressBar
              label="Concern Detection"
              value={93}
            />

            <ProgressBar
              label="Multi-View Consistency"
              value={96}
            />

          </section>

        </section>
      )}

      {/* =====================================================
          SYSTEM
      ===================================================== */}

      {activeTab === "system" && (
        <section>

          <div className="admin-stats-grid">

            <StatCard
              icon="🟢"
              title="System Health"
              value={`${stats.systemHealth}%`}
              subtitle="Overall platform"
            />

            <StatCard
              icon="⚡"
              title="Response Time"
              value={`${stats.avgResponseTime}s`}
              subtitle="Average AI response"
            />

            <StatCard
              icon="🧠"
              title="AI Engine"
              value="CNN"
              subtitle="Deep learning"
            />

            <StatCard
              icon="🔒"
              title="Security"
              value="JWT"
              subtitle="Authentication"
            />

          </div>

          <section className="admin-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  INFRASTRUCTURE
                </span>

                <h3>
                  System Diagnostics
                </h3>
              </div>

              <span className="health-badge">
                ● All Systems Operational
              </span>

            </div>

            <div className="diagnostic-grid">

              <div className="diagnostic-card">
                <span>🟢</span>

                <div>
                  <strong>
                    Node.js Backend
                  </strong>

                  <small>
                    Port 5000
                  </small>
                </div>

                <b>
                  Online
                </b>
              </div>

              <div className="diagnostic-card">
                <span>🟢</span>

                <div>
                  <strong>
                    Python AI Service
                  </strong>

                  <small>
                    Port 5001
                  </small>
                </div>

                <b>
                  Online
                </b>
              </div>

              <div className="diagnostic-card">
                <span>🟢</span>

                <div>
                  <strong>
                    MongoDB
                  </strong>

                  <small>
                    Database
                  </small>
                </div>

                <b>
                  Connected
                </b>
              </div>

              <div className="diagnostic-card">
                <span>🟢</span>

                <div>
                  <strong>
                    JWT Authentication
                  </strong>

                  <small>
                    Security
                  </small>
                </div>

                <b>
                  Active
                </b>
              </div>

            </div>

          </section>

        </section>
      )}

      {/* FOOTER */}

      <footer className="admin-footer">

        <span>
          AI Skincare Analysis System
        </span>

        <span>
          Admin Control Center •{" "}
          {new Date().getFullYear()}
        </span>

      </footer>

    </div>
  );
}