"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push("/app");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

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
        Subscription Activated!
      </h1>

      <p style={{ fontSize: 18, opacity: 0.7, marginBottom: 32 }}>
        Your workspace has been upgraded successfully.
        <br />
        You now have access to all premium features!
      </p>

      <p style={{ fontSize: 14, opacity: 0.5 }}>
        Redirecting to dashboard in 3 seconds...
      </p>

      <button
        onClick={() => router.push("/app")}
        style={{
          marginTop: 24,
          padding: "12px 32px",
          fontSize: 16,
          fontWeight: 600,
          border: "1px solid #ddd",
          borderRadius: 8,
          backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        Go to Dashboard Now
      </button>
    </main>
  );
}

