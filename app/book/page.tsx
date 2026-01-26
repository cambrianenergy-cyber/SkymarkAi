"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BookPage() {
  const search = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    campaign: search.get("campaign") || "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utmSource = search.get("utm_source") || "";
  const utmCampaign = search.get("utm_campaign") || "";
  const adId = search.get("ad_id") || "";
  const adPlatform = search.get("ad_platform") || "";
  const workspaceId = search.get("workspaceId") || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          utmSource,
          utmCampaign,
          adId,
          adPlatform,
          workspaceId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(true);
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        phone: "",
        preferredDate: "",
        preferredTime: "",
        notes: "",
      }));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Book a Call</h1>
      <p style={{ color: "#4b5563", marginBottom: 24 }}>
        Schedule an appointment so we can review your goals and get you launched.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            placeholder="Jane Doe"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            placeholder="you@example.com"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={inputStyle}
            placeholder="(555) 555-5555"
          />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", alignItems: "end" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 700 }}>Preferred Date</label>
            <input
              type="date"
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontWeight: 700 }}>Preferred Time</label>
            <input
              type="time"
              value={form.preferredTime}
              onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Campaign / Offer</label>
          <input
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
            style={inputStyle}
            placeholder="Summer Launch, Demo Request, etc."
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ ...inputStyle, minHeight: 120, paddingTop: 12 }}
            placeholder="Goals, channels, audience, timeline"
          />
        </div>

        {error && (
          <div style={{ color: "#b91c1c", fontWeight: 600, fontSize: 14 }}>{error}</div>
        )}
        {success && (
          <div style={{ color: "#065f46", fontWeight: 700, fontSize: 14 }}>
             Thanks! We received your request. Well confirm shortly.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "14px 18px",
            backgroundColor: submitting ? "#9ca3af" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Submitting..." : "Book Appointment"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  outline: "none",
};

