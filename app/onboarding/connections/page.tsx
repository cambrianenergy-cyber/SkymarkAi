"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const allConnections = [
  { label: "Google", value: "google" },
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "Website / Domain", value: "website" },
  { label: "CRM", value: "crm" }
];

export default function OnboardingConnections() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  function handleSelect(conn: string) {
    if (selected.includes(conn)) {
      setSelected(selected.filter(c => c !== conn));
    } else {
      setSelected([...selected, conn]);
    }
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Please connect at least one data source or skip for now.");
      return;
    }
    // TODO: Save connections to Firestore or user profile
    router.push("/app");
  }

  function handleSkip() {
    // TODO: Mark onboarding as incomplete in Firestore or user profile
    router.push("/app");
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <progress value={4} max={4} style={{ width: "100%" }} />
        <div style={{ marginTop: 8, fontWeight: 600 }}>Step 4 of 4</div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Connect Your First Data Source</h1>
      <p style={{ marginBottom: 18 }}>Connect at least one data source to activate your workspace. You can add more later.</p>
      <form onSubmit={handleContinue} style={{ display: "grid", gap: 16 }}>
        {allConnections.map(conn => (
          <label key={conn.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: selected.includes(conn.value) ? "#e3f2fd" : "#fff", border: selected.includes(conn.value) ? "2px solid #1976d2" : "1px solid #ccc", borderRadius: 6, padding: 12 }}>
            <input
              type="checkbox"
              checked={selected.includes(conn.value)}
              onChange={() => handleSelect(conn.value)}
              style={{ accentColor: "#1976d2" }}
            />
            {conn.label}
          </label>
        ))}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" style={{ padding: 12, fontWeight: 900 }}>
          Connect & Continue →
        </button>
        <button type="button" style={{ padding: 12, fontWeight: 900, background: "#eee", color: "#333", border: "none", borderRadius: 6 }} onClick={handleSkip}>
          Skip for now
        </button>
      </form>
    </main>
  );
}
