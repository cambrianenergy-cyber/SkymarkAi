"use client";

import { useState } from "react";
// Placeholder for system signals and checklist state fetching
// import { getReadinessChecklist, updateChecklistItem } from "../../lib/readinessChecklist";

const SECTIONS = [
  {
    key: "A",
    title: "Core System Readiness (FOUNDATION)",
    items: [
      { label: "Workspace created intentionally (not test clutter)", key: "A1_1" },
      { label: "Workspace purpose clearly defined", key: "A1_2" },
      { label: "No unused or abandoned configurations", key: "A1_3" },
      { label: "Workspace permissions reviewed", key: "A1_4" },
      { label: "All required channels connected", key: "A2_1" },
      { label: "Permissions verified manually", key: "A2_2" },
      { label: "Test message/post successfully delivered", key: "A2_3" },
      { label: "No expired or warning states present", key: "A2_4" },
      { label: "Lead Conversion Agent enabled", key: "A3_1" },
      { label: "Content Generation Agent enabled (if applicable)", key: "A3_2" },
      { label: "Scheduler / Publisher Agent enabled", key: "A3_3" },
      { label: "Agents have clear, non-generic instructions", key: "A3_4" },
      { label: "At least 2 core workflows exist", key: "A4_1" },
      { label: "Each workflow has one responsibility", key: "A4_2" },
      { label: "All workflows run end-to-end manually", key: "A4_3" },
      { label: "All workflows produce visible outputs", key: "A4_4" },
      { label: "Multiple successful runs confirmed", key: "A5_1" },
      { label: "Run logs reviewed line-by-line", key: "A5_2" },
      { label: "Failures (if any) are explainable", key: "A5_3" },
      { label: "Outputs verified externally (channels, inbox, CRM)", key: "A5_4" },
    ],
    statusKey: "A_status"
  },
  // ...repeat for sections BF (omitted for brevity)
];

export default function ReadinessChecklistPage() {
  // Placeholder: fetch checklist state from backend
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  function handleCheck(key: string, checked: boolean) {
    setChecklist((prev) => ({ ...prev, [key]: checked }));
    // TODO: update backend
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>UQENTRA READINESS CHECKLIST</h1>
      <p style={{ color: "#64748b", marginBottom: 24 }}>
        This checklist confirms that Uqentra is operating as a stable, trustworthy automation system  not an experiment. Do not rush this. Progression is earned through evidence.
      </p>
      {SECTIONS.map((section) => (
        <section key={section.key} style={{ marginBottom: 32, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#f8fafc" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{section.title}</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {section.items.map((item) => (
              <li key={item.key} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!checklist[item.key]}
                  onChange={(e) => handleCheck(item.key, e.target.checked)}
                  style={{ marginRight: 10 }}
                />
                {item.label}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 600, marginRight: 12 }}>Section Status:</label>
            <select
              value={status[section.statusKey] || "NOT READY"}
              onChange={(e) => setStatus((prev) => ({ ...prev, [section.statusKey]: e.target.value }))}
              style={{ padding: 6, borderRadius: 6 }}
            >
              <option value="NOT READY">NOT READY</option>
              <option value="READY TO PROCEED">READY TO PROCEED</option>
            </select>
          </div>
        </section>
      ))}
      {/* Final system status and summary (to be implemented) */}
    </main>
  );
}

