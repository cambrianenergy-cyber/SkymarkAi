"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Example agent data (replace with real data or fetch from backend)
const agents = [
  { id: "leadgen", name: "Lead Generator", description: "Finds and qualifies new leads for your business.", recommended: true },
  { id: "scheduler", name: "Appointment Scheduler", description: "Books appointments automatically with your prospects.", recommended: true },
  { id: "content", name: "Content Automator", description: "Creates and publishes content for your brand.", recommended: false },
  { id: "campaign", name: "Campaign Runner", description: "Runs multi-channel marketing campaigns.", recommended: false },
  { id: "teamreplace", name: "Team Replacer", description: "Automates tasks usually done by a marketing team.", recommended: false }
];

export default function OnboardingAgents() {
  const router = useRouter();
  // Pre-select recommended agents (max 3)
  const [selected, setSelected] = useState<string[]>(agents.filter(a => a.recommended).map(a => a.id));
  const [error, setError] = useState("");

  function handleToggle(agentId: string) {
    if (selected.includes(agentId)) {
      setSelected(selected.filter(id => id !== agentId));
    } else if (selected.length < 3) {
      setSelected([...selected, agentId]);
    }
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Please select at least one agent.");
      return;
    }
    // TODO: Create agents/{agentId} docs and assign to workspace
    router.push("/app");
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <progress value={5} max={5} style={{ width: "100%" }} />
        <div style={{ marginTop: 8, fontWeight: 600 }}>Step 5 of 5</div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Select Your Agents</h1>
      <p style={{ marginBottom: 18 }}>We've pre-selected the best agents for your goals. Toggle any on or off. <br />You can add or remove agents later.</p>
      <form onSubmit={handleContinue} style={{ display: "grid", gap: 16 }}>
        {agents.filter((_, i) => i < 5).map(agent => (
          <label key={agent.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", background: selected.includes(agent.id) ? "#e3f2fd" : "#fff", border: selected.includes(agent.id) ? "2px solid #1976d2" : "1px solid #ccc", borderRadius: 6, padding: 16, flexDirection: "row" }}>
            <input
              type="checkbox"
              checked={selected.includes(agent.id)}
              onChange={() => handleToggle(agent.id)}
              style={{ accentColor: "#1976d2", marginTop: 4 }}
              disabled={selected.length >= 3 && !selected.includes(agent.id)}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{agent.name}</div>
              <div style={{ fontSize: 15, color: "#444" }}>{agent.description}</div>
            </div>
          </label>
        ))}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" style={{ padding: 12, fontWeight: 900 }}>
          Continue →
        </button>
      </form>
    </main>
  );
}
