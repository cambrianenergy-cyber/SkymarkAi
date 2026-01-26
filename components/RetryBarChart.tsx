import React from "react";

// Simple horizontal bar chart for retry counts
export function RetryBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ width: "100%", padding: 8 }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ marginBottom: 6 }}>
          <span style={{ display: "inline-block", width: 120, fontWeight: 500 }}>{d.label}</span>
          <span style={{
            display: "inline-block",
            height: 18,
            background: d.value > 0 ? "#dc3545" : "#28a745",
            width: `${(d.value / max) * 60 + 10}%`,
            minWidth: 20,
            borderRadius: 6,
            marginLeft: 8,
            color: "#fff",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            transition: "width 0.3s"
          }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}
