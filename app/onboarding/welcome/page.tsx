"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function OnboardingWelcome() {
  const router = useRouter();
  return (
    <main style={{ padding: "2rem", maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}>
        <progress value={1} max={3} style={{ width: "100%" }} />
        <div style={{ marginTop: 8, fontWeight: 600 }}>Step 1 of 3</div>
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Welcome to Uqentra</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        We’ll get you live in under 5 minutes.
      </p>
      <button
        style={{ padding: "12px 32px", fontSize: 18, fontWeight: 700, background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        onClick={() => router.push("/onboarding/step2")}
      >
        Get Started →
      </button>
    </main>
  );
}
