"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import { db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { trackEvent } from "../../../lib/analytics";

import { generateComplianceReport, ComplianceReport } from "../../../lib/complianceReport";

interface WorkspaceSettingsDoc {
  workspaceId: string;
  name: string;
  logoUrl?: string;
  brandColor?: string;
  timezone?: string;
  defaultPlatforms?: string[];
  notifications?: { email: boolean; push: boolean };
  autoArchiveInboxDays?: number;
  createdAt?: any;
  updatedAt?: any;
}

const ALL_PLATFORMS = ["twitter", "linkedin", "instagram", "tiktok", "youtube"];
const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [plan, setPlan] = useState<string>("free");

  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string>("");

  async function handleGenerateComplianceReport() {
    if (!workspaceId) return;
    setReportLoading(true);
    setReportError("");
    try {
      const report = await generateComplianceReport({ workspaceId });
      setComplianceReport(report);
    } catch (e: any) {
      setReportError(e.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  }

  const [settings, setSettings] = useState<WorkspaceSettingsDoc | null>(null);
  const debouncedTimer = useRef<any>(null);

  // Derived display name fallback from workspace doc if settings missing
  const displayName = useMemo(() => settings?.name || "", [settings]);

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    setLoading(true);

    // Ensure a settings doc exists with sane defaults
    const wsRef = doc(db, "workspaces", workspaceId);
    const settingsRef = doc(db, "workspace_settings", workspaceId);

    let unsub: (() => void) | null = null;

    (async () => {
      const wsSnap = await getDoc(wsRef);
      const wsData = wsSnap.data() as any;
      setPlan(wsData?.plan || "free");

      const sSnap = await getDoc(settingsRef);
      if (!sSnap.exists()) {
        const defaults: WorkspaceSettingsDoc = {
          workspaceId,
          name: wsData?.name || "My Workspace",
          logoUrl: "",
          brandColor: "#0ea5e9",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          defaultPlatforms: ["twitter", "linkedin"],
          notifications: { email: true, push: false },
          autoArchiveInboxDays: 14,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(settingsRef, defaults, { merge: true });
      }

      // Live updates
      unsub = onSnapshot(settingsRef, (snap) => {
        const data = snap.data() as WorkspaceSettingsDoc | undefined;
        if (data) setSettings(data);
        setLoading(false);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [isReady, isAuthorized, workspaceId]);

  function queueSave(patch: Partial<WorkspaceSettingsDoc>) {
    if (!workspaceId) return;
    setSettings((prev) => ({ ...(prev as WorkspaceSettingsDoc), ...patch }));
    setSaving("saving");
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    debouncedTimer.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "workspace_settings", workspaceId), {
          ...patch,
          updatedAt: serverTimestamp(),
        });
        setSaving("saved");
        trackEvent("settings_updated", { workspaceId, keys: Object.keys(patch) });
        setTimeout(() => setSaving("idle"), 1200);
      } catch (e) {
        console.error("Failed to save settings", e);
        setSaving("idle");
        alert("Failed to save settings: " + (e as any).message);
      }
    }, 500);
  }

  if (!isReady) return <GuardLoadingScreen />;
  if (!isAuthorized || !workspaceId) return null;
  if (loading || !settings) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading Settings</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Settings</h1>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Plan: {plan}</div>
          {/* Show included agents for the plan */}
          {(() => {
            const PLAN_AGENT_MAP: Record<string, string[]> = {
              foundation: ["Copywriter", "Content Creator", "Scheduler & Publisher"],
              accelerate: ["Copywriter", "Content Creator", "Scheduler & Publisher", "Campaign Director"],
              dominion: ["Copywriter", "Content Creator", "Scheduler & Publisher", "Campaign Director", "Trend Hunter"],
              sovereign: ["Copywriter", "Content Creator", "Scheduler & Publisher", "Campaign Director", "Trend Hunter", "Competitor Watchdog"],
            };
            const planKey = (plan || "foundation").toLowerCase();
            const included = PLAN_AGENT_MAP[planKey];
            if (!included) return null;
            return (
              <div style={{ marginTop: 6, fontSize: 13, color: '#374151' }}>
                <b>Included Agents:</b> {included.join(", ")}
              </div>
            );
          })()}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: saving === "saved" ? "#15803d" : saving === "saving" ? "#b45309" : "#6b7280" }}>
            {saving === "saving" ? "Saving" : saving === "saved" ? "Saved" : ""}
          </span>
          <button onClick={() => router.push("/app")} style={{ border: "1px solid #d1d5db", background: "#f9fafb", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>Exit to Dashboard</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Workspace Info */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Workspace</h3>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Name</label>
          <input
            value={displayName}
            onChange={(e) => queueSave({ name: e.target.value })}
            placeholder="My Workspace"
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />

          <div style={{ height: 12 }} />
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Logo URL</label>
          <input
            value={settings.logoUrl || ""}
            onChange={(e) => queueSave({ logoUrl: e.target.value })}
            placeholder="https://..."
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />

          {settings.logoUrl ? (
            <div style={{ marginTop: 12 }}>
              <img src={settings.logoUrl} alt="Logo preview" style={{ maxHeight: 48 }} />
            </div>
          ) : null}
        </section>

        {/* Branding */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Branding</h3>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Primary Color</label>
          <input
            type="color"
            value={settings.brandColor || "#0ea5e9"}
            onChange={(e) => queueSave({ brandColor: e.target.value })}
            style={{ width: 64, height: 36, padding: 0, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />

          <div style={{ height: 12 }} />
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Default Platforms</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {ALL_PLATFORMS.map((p) => {
              const active = settings.defaultPlatforms?.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => {
                    const next = new Set(settings.defaultPlatforms || []);
                    if (next.has(p)) next.delete(p); else next.add(p);
                    queueSave({ defaultPlatforms: Array.from(next) });
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 20,
                    border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
                    background: active ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </section>

        {/* Preferences */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Preferences</h3>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Timezone</label>
          <select
            value={settings.timezone || "UTC"}
            onChange={(e) => queueSave({ timezone: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          >
            {[settings.timezone || "UTC", ...COMMON_TIMEZONES.filter((t) => t !== (settings.timezone || "UTC"))].map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>

          <div style={{ height: 12 }} />
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Auto-archive Inbox After (days)</label>
          <input
            type="number"
            min={0}
            max={365}
            value={settings.autoArchiveInboxDays ?? 14}
            onChange={(e) => queueSave({ autoArchiveInboxDays: Math.max(0, Math.min(365, Number(e.target.value) || 0)) })}
            style={{ width: 120, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />
        </section>

        {/* Notifications */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Notifications</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!settings.notifications?.email}
                onChange={(e) => queueSave({ notifications: { ...(settings.notifications || { email: false, push: false }), email: e.target.checked } })}
              />
              Email notifications
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!settings.notifications?.push}
                onChange={(e) => queueSave({ notifications: { ...(settings.notifications || { email: false, push: false }), push: e.target.checked } })}
              />
              Push notifications
            </label>
          </div>
        </section>

        {/* Owner's Manual */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff", marginTop: 32 }}>
          <h3 style={{ marginTop: 0, color: '#1976d2' }}>Owner's Manual</h3>
          <div style={{ fontSize: 14, color: '#263238', marginBottom: 12 }}>
            Comprehensive guide for workspace owners. For full details, see the manual below.
          </div>
          <iframe
            src="/OWNERS_MANUAL.md"
            style={{ width: '100%', minHeight: 800, border: '1px solid #b0bec5', borderRadius: 10, background: '#fff' }}
            title="Owner's Manual"
          />
        </section>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <a href="/app/billing" onClick={(e) => { e.preventDefault(); router.push("/app/billing"); }} style={{ fontSize: 12, color: "#2563eb" }}>Manage Billing </a>
        <a href="/app/workspaces" onClick={(e) => { e.preventDefault(); router.push("/app/workspaces"); }} style={{ fontSize: 12, color: "#2563eb" }}>Manage Workspaces </a>
        </div>

        {/* Compliance Reporting Section */}
        <section style={{ marginTop: 32, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#f8fafc" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Compliance Reporting</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            Generate an automated compliance report for this workspace. Reports summarize audit log activity, security events, and anomalies for operational and regulatory review.
          </p>
          <button onClick={handleGenerateComplianceReport} disabled={reportLoading} style={{ padding: "10px 18px", fontWeight: 700, borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: reportLoading ? "not-allowed" : "pointer" }}>
            {reportLoading ? "Generating" : "Generate Compliance Report"}
          </button>
          {reportError && <div style={{ color: "crimson", marginTop: 8 }}>{reportError}</div>}
          {complianceReport && (
            <div style={{ marginTop: 18, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Report Summary</h3>
              <div style={{ fontSize: 13, color: "#334155" }}>
                <div><strong>Period:</strong> {complianceReport.period.start.toLocaleString()}  {complianceReport.period.end.toLocaleString()}</div>
                <div><strong>Total Actions:</strong> {complianceReport.totalActions}</div>
                <div><strong>Last Login:</strong> {complianceReport.lastLogin || "N/A"}</div>
                <div><strong>Last Config Change:</strong> {complianceReport.lastConfigChange || "N/A"}</div>
                <div><strong>Last Permission Change:</strong> {complianceReport.lastPermissionChange || "N/A"}</div>
                <div style={{ marginTop: 10 }}><strong>Actions by Type:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {Object.entries(complianceReport.actionsByType).map(([type, count]) => (
                      <li key={type}>{type}: {count}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: 10 }}><strong>Security Events:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {complianceReport.securityEvents.length === 0 ? <li>None</li> : complianceReport.securityEvents.map((ev, i) => (
                      <li key={i}>{ev.action} by {ev.actorEmail || ev.actorUid} at {ev.timestamp}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ marginTop: 10 }}><strong>Anomalies:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {complianceReport.anomalies.length === 0 ? <li>None</li> : complianceReport.anomalies.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
    </main>
  );
}

