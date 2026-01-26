// ...existing code...
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import { db } from "../../../lib/firebase";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";


interface ManualSectionDoc {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  order: number;
  content: string;
  updatedAt?: any;
}

// ...existing code...

// Static manual sections for sidebar and content
function getSections(isFounder: boolean) {
  const baseSections = [
    // ...existing code...
    {
      slug: "getting-started",
      title: "Getting Started",
      tagline: "Start strong in 10 minutes",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <p>Uqentra AI is your operating system for running campaigns, workflows, content, and follow-ups across workspaces.</p>
          <p>How the app is organized: Workspaces  Campaigns  Workflows  Assets.</p>
          <div>
            <strong>Recommended first action:</strong>
            <ul style={{ margin: "8px 0 0 16px" }}>
              <li>Create a campaign</li>
              <li>Generate a plan</li>
              <li>Run workflows inside that campaign</li>
              <li>Schedule the content you approve</li>
            </ul>
          </div>
        </div>
      ),
    },
    // ...rest of the sections below...
  ];
  if (isFounder) {
    baseSections.unshift({
      slug: "owners-manual",
      title: "Owner's Manual (Content Model)",
      tagline: "Uqentra Owners Manual content model (dashboard-ready)",
      content: (
        <pre style={{ fontSize: 14, background: '#f5f7fa', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
{`// Owner's Manual Content Model
export type OwnersManualSection = {
  slug: string;
  title: string;
  tagline?: string;
  content: string | JSX.Element;
  children?: OwnersManualSection[];
};

export const OWNERS_MANUAL: OwnersManualSection[] = [
  {
    slug: "overview",
    title: "Overview",
    tagline: "What is the Owners Manual?",
    content: "The Owners Manual is your always-up-to-date guide to using, configuring, and scaling your Uqentra workspace.",
  },
  // ...more sections
];`}
        </pre>
      ),
    });
  }
  return baseSections;
}
export default function ManualPage() {
  const router = useRouter();
  const { isReady, isAuthorized, user } = useAuthWorkspaceGuard();
  // Robust founder check: match email to known founder emails
  const FOUNDER_EMAILS = [
    'cambrianenergy@gmail.com',
    'financialgrowthdfw@gmail.com',
    // Add more founder emails as needed
  ];
  const isFounder = !!user && typeof user.email === 'string' && FOUNDER_EMAILS.includes(user.email);
  const sections = useMemo(() => getSections(isFounder), [isFounder]);
  const [activeSlug, setActiveSlug] = useState(sections[0].slug);
  const activeStatic = useMemo(() => sections.find((s) => s.slug === activeSlug) || sections[0], [activeSlug, sections]);

  const [dbSections, setDbSections] = useState<ManualSectionDoc[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const usingDb = !!dbSections && dbSections.length > 0;

  useEffect(() => {
    if (!isReady || !isAuthorized) return;
    // DB loading logic can be added here if needed
  }, [isReady, isAuthorized]);

  async function handleSeed() {
    setLoading(true);
    try {
      // Seed logic removed: SEED_SECTIONS no longer exists
      setDbSections([]);
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  }

  if (!isReady) return <GuardLoadingScreen />;

  return (
    <main style={{
      padding: 32,
      maxWidth: 1300,
      margin: "0 auto",
      fontFamily: 'Segoe UI, Arial, sans-serif',
      background: 'linear-gradient(120deg, #fafdff 0%, #e3f2fd 100%)', // lighter background
      minHeight: '100vh',
      boxShadow: '0 8px 32px rgba(33,150,243,0.07)',
    }}>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <div style={{ width: 290, borderRight: "2px solid #b0bec5", paddingRight: 24, background: 'linear-gradient(120deg, #bbdefb 0%, #e3f2fd 100%)', borderRadius: 18, boxShadow: '0 4px 16px rgba(33,150,243,0.07)' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: '#1565c0', letterSpacing: 1 }}>Operations Manual</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!usingDb && (
                <button
                  onClick={handleSeed}
                  disabled={loading}
                  style={{
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    color: "#374151",
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 12,
                  }}
                >
                  Seed
                </button>
              )}
              <button
                onClick={() => router.push("/app")}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  color: "#374151",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                 Home
              </button>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#1976d2", marginBottom: 18, fontWeight: 600 }}>Guided operating system manual for Uqentra AI</div>
          {/* Sidebar list: show DB if available, else static */}
          {usingDb ? (
            <div style={{ display: "grid", gap: 10 }}>
              {dbSections!.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveId(section.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: activeId === section.id ? "1px solid #2563eb" : "1px solid transparent",
                    backgroundColor: activeId === section.id ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#111827",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 15, color: '#0d47a1', fontWeight: 700 }}>{section.title}</div>
                  {section.tagline && <div style={{ fontSize: 12, color: "#1976d2", marginTop: 2 }}>{section.tagline}</div>}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {sections.map((section) => (
                <button
                  key={section.slug}
                  onClick={() => setActiveSlug(section.slug)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: activeSlug === section.slug ? "1px solid #2563eb" : "1px solid transparent",
                    backgroundColor: activeSlug === section.slug ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#111827",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 14 }}>{section.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{section.tagline}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{
          flex: 1,
          background: "linear-gradient(120deg, #fff 60%, #e3f2fd 100%)",
          border: "2px solid #b0bec5",
          borderRadius: 22,
          padding: 44,
          boxShadow: "0 8px 32px rgba(33,150,243,0.10)",
          minHeight: 600,
        }}>
          {/* Header */}
          {usingDb ? (
            (() => {
              const s = dbSections!.find((x) => x.id === activeId) ?? dbSections![0];
              if (!s) return null;
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{s.title}</h2>
                      {s.tagline && <div style={{ fontSize: 13, color: "#6b7280" }}>{s.tagline}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Last updated: {s.updatedAt ? "Recently" : ""}</div>
                  </div>
                  <div style={{ fontSize: 14, color: "#1f2937", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.content}</div>
                </>
              );
            })()
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: '#1976d2', letterSpacing: 1 }}>{activeStatic.title}</h2>
                  <div style={{ fontSize: 15, color: "#00897b", fontWeight: 600 }}>{activeStatic.tagline}</div>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Last updated: </div>
              </div>
              <div style={{ fontSize: 16, color: "#263238", lineHeight: 1.7 }}>{activeStatic.content}</div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

