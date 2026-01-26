"use client";

import { useRouter } from "next/navigation";

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 600,
        margin: "0 auto",
        textAlign: "center",
        paddingTop: 120,
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 24,
        }}
      >
        
      </div>

      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16 }}>
        Checkout Cancelled
      </h1>

      <p style={{ fontSize: 18, opacity: 0.7, marginBottom: 32 }}>
        No charges were made. You can try again anytime.
      </p>

      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        <button
          onClick={() => router.push("/app/billing")}
          style={{
            padding: "12px 32px",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#0070f3",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>

        <button
          onClick={() => router.push("/app")}
          style={{
            padding: "12px 32px",
            fontSize: 16,
            fontWeight: 600,
            border: "1px solid #ddd",
            borderRadius: 8,
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}

