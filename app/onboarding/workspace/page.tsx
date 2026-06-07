"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import { db } from "../../lib/firebase"; // Uncomment and use your Firestore instance
// import { collection, addDoc, doc, setDoc } from "firebase/firestore";

const industries = [
  "Technology",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "Other"
];
const teamSizes = [
  { label: "Solo", value: "solo" },
  { label: "Small Team (2-10)", value: "small" },
  { label: "Agency (10+)", value: "agency" }
];

export default function OnboardingWorkspace() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // TODO: Replace with actual Firestore logic
      // const docRef = await addDoc(collection(db, "workspaces"), {
      //   company, industry, teamSize, country, timezone, createdAt: new Date().toISOString()
      // });
      // await setDoc(doc(db, "workspaces", docRef.id, "members", userId), { role: "owner" });
      // router.push(`/onboarding/nextstep`);
      setTimeout(() => {
        setLoading(false);
        router.push("/onboarding/nextstep");
      }, 800);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create workspace");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <progress value={2} max={3} style={{ width: "100%" }} />
        <div style={{ marginTop: 8, fontWeight: 600 }}>Step 2 of 3</div>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>Create Your Workspace</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <input
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Company / Brand Name"
          required
          style={{ padding: 12 }}
        />
        <select value={industry} onChange={e => setIndustry(e.target.value)} required style={{ padding: 12 }}>
          <option value="">Select Industry</option>
          {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>
        <select value={teamSize} onChange={e => setTeamSize(e.target.value)} required style={{ padding: 12 }}>
          <option value="">Team Size</option>
          {teamSizes.map(ts => <option key={ts.value} value={ts.value}>{ts.label}</option>)}
        </select>
        <input
          value={country}
          onChange={e => setCountry(e.target.value)}
          placeholder="Country"
          required
          style={{ padding: 12 }}
        />
        <input
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
          placeholder="Timezone (e.g. UTC+1)"
          required
          style={{ padding: 12 }}
        />
        <button type="submit" style={{ padding: 12, fontWeight: 900 }} disabled={loading}>
          {loading ? "Creating..." : "Continue →"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </main>
  );
}
