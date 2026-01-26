"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard } from "../../../lib/useAuthWorkspaceGuard";
import { marked } from "marked";
import { useFounderStatus } from "../../../lib/useFounderStatus";

const FOUNDER_EMAILS = [
  "cambrianenergy@gmail.com",
  "financialgrowthdfw@gmail.com",
];

export default function FounderManualPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [manual, setManual] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { isFounder } = useFounderStatus(user, workspaceId);

  // Fallback: direct email check for founders
  const isFounderEmail = !!(user?.email && FOUNDER_EMAILS.includes(user.email));

  useEffect(() => {
    if (!isReady || !user) return;
    if (!(isFounder || isFounderEmail)) {
      router.replace("/app");
      return;
    }
    fetch("/FOUNDER_MANUAL.md")
      .then((res) => res.text())
      .then((text) => {
        setManual(text);
        setLoading(false);
      });
  }, [isReady, isFounder, isFounderEmail, user, router]);

  if (!isReady || !user) {
    return (
      <main style={{ padding: 48, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900 }}>Loading</h1>
      </main>
    );
  }

  if (!(isFounder || isFounderEmail)) {
    return (
      <main style={{ padding: 48, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#b91c1c" }}>Access Denied</h1>
        <p style={{ fontSize: 18, marginTop: 12 }}>This manual is only accessible by the founder.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: 48, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900 }}>Loading Founder's Manual</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 48, maxWidth: 900, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/app")}
        style={{
          marginBottom: 24,
          padding: "10px 20px",
          backgroundColor: "#f0f0f0",
          color: "#333",
          border: "1px solid #d0d0d0",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
         Back to Dashboard
      </button>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>Founder's Manual</h1>
      <div dangerouslySetInnerHTML={{ __html: marked.parse(manual) }} />
    </main>
  );
}

