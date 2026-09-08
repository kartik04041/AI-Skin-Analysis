import React from "react";

export default function TestComparisonChart() {
  const currentTest = {
    timestamp: "21/8/2026 11:01 am",
    confidence: 65.0,
    oiliness: 85,
    hydration: 75,
  };

  const previousTest = {
    timestamp: "21/8/2026 11:00 am",
    confidence: 65.0,
    oiliness: 80,
    hydration: 65,
  };

  const metrics = [
    {
      name: "Confidence Match",
      curr: currentTest.confidence,
      prev: previousTest.confidence,
      unit: "%",
      colorCurr: "#ec4899", // Pink
    },
    {
      name: "Oiliness Metric",
      curr: currentTest.oiliness,
      prev: previousTest.oiliness,
      unit: "%",
      colorCurr: "#f59e0b", // Amber
    },
    {
      name: "Hydration Score",
      curr: currentTest.hydration,
      prev: previousTest.hydration,
      unit: "%",
      colorCurr: "#3b82f6", // Blue
    },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #fbcfe8",
        boxShadow: "0 4px 20px rgba(236, 72, 153, 0.08)",
        maxWidth: "600px",
        margin: "16px auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          color: "#831843",
          fontSize: "1.15rem",
          fontWeight: "700",
        }}
      >
        Skin Type Metrics: Current vs Previous Test
      </h3>

      {/* Legend & Timestamps */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          fontSize: "0.85rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ec4899",
              display: "inline-block",
            }}
          ></span>
          <span style={{ color: "#374151", fontWeight: "600" }}>
            Current ({currentTest.timestamp})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#94a3b8",
              display: "inline-block",
            }}
          ></span>
          <span style={{ color: "#64748b" }}>
            Previous ({previousTest.timestamp})
          </span>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {metrics.map((m, idx) => {
          const diff = m.curr - m.prev;
          const diffText =
            diff > 0
              ? `+${diff.toFixed(1)}%`
              : diff < 0
              ? `${diff.toFixed(1)}%`
              : "0.0%";
          const badgeBg =
            diff > 0 ? "#dcfce7" : diff < 0 ? "#fee2e2" : "#f1f5f9";
          const badgeColor =
            diff > 0 ? "#15803d" : diff < 0 ? "#b91c1c" : "#475569";

          return (
            <div
              key={idx}
              style={{
                background: "#fff5f8",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #fce7f3",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    color: "#4c0519",
                    fontSize: "0.95rem",
                  }}
                >
                  {m.name}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    background: badgeBg,
                    color: badgeColor,
                  }}
                >
                  {diffText}
                </span>
              </div>

              {/* Progress Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Current Test Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "65px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "#831843",
                    }}
                  >
                    Current
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "12px",
                      background: "#fbcfe8",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${m.curr}%`,
                        height: "100%",
                        background: m.colorCurr,
                        borderRadius: "6px",
                      }}
                    ></div>
                  </div>
                  <span
                    style={{
                      width: "45px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: "#831843",
                      textAlign: "right",
                    }}
                  >
                    {m.curr}{m.unit}
                  </span>
                </div>

                {/* Previous Test Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "65px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#64748b",
                    }}
                  >
                    Previous
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "10px",
                      background: "#e2e8f0",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${m.prev}%`,
                        height: "100%",
                        background: "#94a3b8",
                        borderRadius: "5px",
                      }}
                    ></div>
                  </div>
                  <span
                    style={{
                      width: "45px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#64748b",
                      textAlign: "right",
                    }}
                  >
                    {m.prev}{m.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}