"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const goals = [
  "Generate leads",
  "Book appointments",
  "Automate content",
  "Run client campaigns",
  "Replace a marketing team"
];

export default function OnboardingGoal() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  function handleSelect(goal: string) {
    if (selected.includes(goal)) {
      setSelected(selected.filter(g => g !== goal));
    } else if (selected.length < 2) {
      setSelected([...selected, goal]);
    }
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Please select at least one goal");
      return;
    }
    // TODO: Save goal(s) to Firestore or user profile
    router.push("/app");
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <progress value={3} max={3} style={{ width: "100%" }} />
        <div style={{ marginTop: 8, fontWeight: 600 }}>Step 3 of 3</div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>What's your primary goal?</h1>
      <p style={{ marginBottom: 18 }}>This helps us suggest the right agents, templates, and dashboards. <br /><strong>You can change this later.</strong></p>
      <form onSubmit={handleContinue} style={{ display: "grid", gap: 16 }}>
        {goals.map(goal => (
          <label key={goal} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: selected.includes(goal) ? "#e3f2fd" : "#fff", border: selected.includes(goal) ? "2px solid #1976d2" : "1px solid #ccc", borderRadius: 6, padding: 12 }}>
            <input
              type="checkbox"
              checked={selected.includes(goal)}
              onChange={() => handleSelect(goal)}
              disabled={selected.length >= 2 && !selected.includes(goal)}
              style={{ accentColor: "#1976d2" }}
            />
            {goal}
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
