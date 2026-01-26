"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, setDoc, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import { trackEvent } from "../../../lib/analytics";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState({
    createdCampaign: false,
    installedTemplate: false,
    createdWorkflow: false,
    ranWorkflow: false,
    createdAsset: false,
    scheduledPost: false,
    connectedBilling: false,
    connectedTwitter: false,
    connectedFacebook: false,
    connectedLinkedIn: false,
    connectedInstagram: false,
    connectedTikTok: false,
    connectedAngiesList: false,
    connectedSnapchat: false,
    connectedNextdoor: false,
    connectedYouTube: false,
  });
  const [status, setStatus] = useState<"not_started"|"in_progress"|"completed">("not_started");

  // Workspace configuration state
  const [wsConfig, setWsConfig] = useState({
    name: "",
    businessDescription: "",
    brandPositioning: "",
    targetAudience: "",
    tone: "",
    geographicFocus: "",
    timezone: "",
    operatingHours: "",
    brandVoice: "",
  });
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    (async () => {
      setLoading(true);
      const wsRef = doc(db, "workspaces", workspaceId);
      const snap = await getDoc(wsRef);
      if (!snap.exists()) {
        // Prompt for required fields if not set
        setLoading(false);
        return;
      }
      const data = (await getDoc(wsRef)).data() as any;
      const c = data?.onboardingChecklist || {};
      setChecklist({ ...checklist, ...c });
      setStatus((data?.onboardingStatus as any) || "not_started");
      // Load config fields
      setWsConfig({
        name: data?.name || "",
        businessDescription: data?.businessDescription || "",
        brandPositioning: data?.brandPositioning || "",
        targetAudience: data?.targetAudience || "",
        tone: data?.tone || "",
        geographicFocus: data?.geographicFocus || "",
        timezone: data?.timezone || "",
        operatingHours: data?.operatingHours || "",
        brandVoice: data?.brandVoice || "",
      });
      // Ensure fields present
      await setDoc(wsRef, {
        onboardingStatus: (data?.onboardingStatus) || "not_started",
        onboardingChecklist: { ...checklist, ...c },
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setLoading(false);
    })();
  }, [isReady, isAuthorized, workspaceId]);

  function validateWorkspaceConfig(cfg: typeof wsConfig) {
    // Naming convention: must not contain 'test', 'client #', or be empty
    if (!cfg.name || /test|client\s*#|demo|temp|\d{1,}/i.test(cfg.name)) {
      return "Workspace name must be the official business/brand name, not a test or placeholder.";
    }
    if (!cfg.businessDescription || !cfg.brandPositioning || !cfg.targetAudience || !cfg.tone || !cfg.timezone || !cfg.brandVoice) {
      return "All required fields must be filled: business description, brand positioning, target audience, tone, timezone, and brand voice.";
    }
    return "";
  }

  async function saveWorkspaceConfig() {
    const err = validateWorkspaceConfig(wsConfig);
    setConfigError(err);
    if (err) return;
    if (!workspaceId) return;
    const wsRef = doc(db, "workspaces", workspaceId);
    await setDoc(wsRef, {
      ...wsConfig,
      status: "active",
      plan: "free",
      onboardingStatus: "not_started",
      onboardingChecklist: { ...checklist },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setConfigError("");
    setLoading(true);
    // Reload config
    const data = (await getDoc(wsRef)).data() as any;
    setWsConfig({
      name: data?.name || "",
      businessDescription: data?.businessDescription || "",
      brandPositioning: data?.brandPositioning || "",
      targetAudience: data?.targetAudience || "",
      tone: data?.tone || "",
      geographicFocus: data?.geographicFocus || "",
      timezone: data?.timezone || "",
      operatingHours: data?.operatingHours || "",
      brandVoice: data?.brandVoice || "",
    });
    setLoading(false);
  }

  function markComplete(key: keyof typeof checklist) {
    if (!workspaceId) return;
    const next = { ...checklist, [key]: true };
    setChecklist(next);
    setDoc(doc(db, "workspaces", workspaceId), {
      onboardingChecklist: next,
      onboardingStatus: "in_progress",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  const allDone = useMemo(() => Object.values(checklist).every(Boolean), [checklist]);

  useEffect(() => {
    if (!workspaceId) return;
    if (allDone) {
      setDoc(doc(db, "workspaces", workspaceId), {
        onboardingStatus: "completed",
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [allDone, workspaceId]);

  async function createDemoData() {
    if (!workspaceId || !user) return;
    setLoading(true);
    try {
      // Campaign
      const campRef = await addDoc(collection(db, "campaigns"), {
        workspaceId, name: "Welcome Campaign", status: "completed", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });

      // Workflows
      await addDoc(collection(db, "workflows"), {
        workspaceId, name: "Campaign Generator", status: "active", steps: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      await addDoc(collection(db, "workflows"), {
        workspaceId, name: "Repurpose Engine", status: "active", steps: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });

      // Assets
      for (let i=0;i<6;i++) {
        await addDoc(collection(db, "content_assets"), {
          workspaceId, type: "post", platform: i%2?"twitter":"linkedin", status: i%3?"draft":"approved", copy: `Example content #${i+1}`,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      }

      // Scheduled posts (next 7 days)
      const now = new Date();
      for (let i=1;i<=6;i++) {
        const d = new Date(now.getTime() + i*24*60*60*1000);
        await addDoc(collection(db, "scheduled_posts"), {
          workspaceId,
          assetId: "",
          platform: i%2?"twitter":"linkedin",
          scheduledFor: Timestamp.fromDate(d),
          status: "scheduled",
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      }

      // Inbox threads + messages
      for (let i=0;i<5;i++) {
        const threadRef = await addDoc(collection(db, "inbox_threads"), {
          workspaceId, channel: "twitter", source: "dm", displayName: `User ${i+1}`, handle: `user${i+1}`,
          status: "open", priority: "normal", lastMessageAt: serverTimestamp(), lastMessagePreview: "Hi there!",
          unreadCount: 1, tags: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        await addDoc(collection(db, "inbox_messages"), {
          workspaceId, threadId: threadRef.id, direction: "inbound", senderName: `User ${i+1}`, text: "Hello!",
          sentAt: serverTimestamp(), status: "delivered", createdAt: serverTimestamp()
        });
      }

      // Leads + followup sequence + queued jobs
      const seqRef = await addDoc(collection(db, "followup_sequences"), {
        workspaceId, name: "Demo Sequence", steps: [{ waitHours: 24 }, { waitHours: 48 }], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      for (let i=0;i<3;i++) {
        const leadRef = await addDoc(collection(db, "leads"), {
          workspaceId, fullName: `Lead ${i+1}`, handle: `lead${i+1}`, channel: "twitter", status: "open", stage: "new",
          score: 0, scoreLabel: "cold", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        await addDoc(collection(db, "followup_jobs"), {
          workspaceId,
          leadId: leadRef.id,
          threadId: "",
          sequenceId: seqRef.id,
          stepIndex: 0,
          scheduledFor: Timestamp.fromMillis(Date.now() + 86400000),
          status: "queued",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Marketplace install (optional)
      await addDoc(collection(db, "marketplace_installs"), {
        workspaceId, templateId: "demo_template", installedAt: serverTimestamp(), userId: user.uid
      });

      trackEvent("demo_data_created", { workspaceId });
      alert(" Demo data created!");
    } catch (e:any) {
      console.error(e);
      alert("Failed to create demo data: "+ e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isReady) return <GuardLoadingScreen />;
  if (!isAuthorized || !workspaceId) return null;

  // If required config is missing, show config form
  if (!wsConfig.name || !wsConfig.businessDescription || !wsConfig.brandPositioning || !wsConfig.targetAudience || !wsConfig.tone || !wsConfig.timezone || !wsConfig.brandVoice) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Workspace Setup</h1>
        <p style={{ opacity: 0.8 }}>Please provide the required information to create your workspace. This ensures compliance with best practices and platform rules.</p>
        <form onSubmit={e => { e.preventDefault(); saveWorkspaceConfig(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>Workspace Name* <input value={wsConfig.name} onChange={e => setWsConfig(v => ({ ...v, name: e.target.value }))} required placeholder="Official business or brand name" /></label>
          <label>Business Description* <input value={wsConfig.businessDescription} onChange={e => setWsConfig(v => ({ ...v, businessDescription: e.target.value }))} required /></label>
          <label>Brand Positioning* <input value={wsConfig.brandPositioning} onChange={e => setWsConfig(v => ({ ...v, brandPositioning: e.target.value }))} required /></label>
          <label>Target Audience* <input value={wsConfig.targetAudience} onChange={e => setWsConfig(v => ({ ...v, targetAudience: e.target.value }))} required /></label>
          <label>Preferred Tone* <input value={wsConfig.tone} onChange={e => setWsConfig(v => ({ ...v, tone: e.target.value }))} required placeholder="e.g. formal, conversational, authoritative" /></label>
          <label>Geographic Focus <input value={wsConfig.geographicFocus} onChange={e => setWsConfig(v => ({ ...v, geographicFocus: e.target.value }))} placeholder="(optional)" /></label>
          <label>Timezone* <input value={wsConfig.timezone} onChange={e => setWsConfig(v => ({ ...v, timezone: e.target.value }))} required /></label>
          <label>Operating Hours <input value={wsConfig.operatingHours} onChange={e => setWsConfig(v => ({ ...v, operatingHours: e.target.value }))} placeholder="(optional)" /></label>
          <label>Brand Voice* <input value={wsConfig.brandVoice} onChange={e => setWsConfig(v => ({ ...v, brandVoice: e.target.value }))} required placeholder="Describe the brand voice" /></label>
          {configError && <div style={{ color: 'red', fontWeight: 600 }}>{configError}</div>}
          <button type="submit" style={{ padding: '10px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>Save Workspace Configuration</button>
        </form>
      </main>
    );
  }

  // ...existing code...
  const checklistItems: Array<{ key: keyof typeof checklist; title: string; detail: string }> = [
    { key: "createdCampaign", title: "Create a campaign", detail: "Set up your first campaign so reporting has something to track." },
    { key: "installedTemplate", title: "Install a playbook", detail: "Pick a playbook that matches your industry to preconfigure agents." },
    { key: "createdWorkflow", title: "Create a workflow", detail: "Define one automated process you want the platform to run." },
    { key: "ranWorkflow", title: "Run a workflow", detail: "Execute your workflow once to verify it completes successfully." },
    { key: "createdAsset", title: "Generate an asset", detail: "Create content (post, email, or script) using your workspace voice." },
    { key: "scheduledPost", title: "Schedule a post", detail: "Schedule at least one post to confirm channel scheduling works." },
    { key: "connectedBilling", title: "Connect billing", detail: "Add a payment method so agents and workflows stay active." },
    { key: "connectedTwitter", title: "Connect Twitter", detail: "Connect your Twitter account to enable posting and analytics." },
    { key: "connectedFacebook", title: "Connect Facebook", detail: "Connect your Facebook account to enable posting and analytics." },
    { key: "connectedLinkedIn", title: "Connect LinkedIn", detail: "Connect your LinkedIn account to enable posting and analytics." },
    { key: "connectedInstagram", title: "Connect Instagram", detail: "Connect your Instagram account to enable posting and analytics." },
    { key: "connectedTikTok", title: "Connect TikTok", detail: "Connect your TikTok account to enable posting and analytics." },
    { key: "connectedAngiesList", title: "Connect Angie's List", detail: "Connect your Angie's List account to enable posting and analytics." },
    { key: "connectedSnapchat", title: "Connect Snapchat", detail: "Connect your Snapchat account to enable posting and analytics." },
    { key: "connectedNextdoor", title: "Connect Nextdoor", detail: "Connect your Nextdoor account to enable posting and analytics." },
    { key: "connectedYouTube", title: "Connect YouTube", detail: "Connect your YouTube account to enable posting and analytics." },
  ];
  // Placeholder: List of connected social media accounts (replace with real data from backend)
  type ConnectedAccount = { platform: string; username: string };
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);


  // Mark checklist as connected if redirected from OAuth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      if (connected) {
        const key = `connected${connected.charAt(0).toUpperCase()}${connected.slice(1)}`;
        if (Object.prototype.hasOwnProperty.call(checklist, key)) {
          setChecklist(prev => ({ ...prev, [key]: true }));
          // Optionally, update Firestore here as well
        }
      }
    }
  }, []);

  {/* Social Media Connections Notification */}
  const socialAccountsNotification = (
    <div style={{ background: '#e0f2fe', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <strong>Connected Social Media Accounts:</strong>
      {connectedAccounts.length === 0 ? (
        <span style={{ marginLeft: 8 }}>No accounts connected yet.</span>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {connectedAccounts.map((acc, i) => (
            <li key={i}>{acc.platform}: {acc.username}</li>
          ))}
        </ul>
      )}
    </div>
  );


  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Onboarding Checklist</h1>
        <div style={{ color: "#475467" }}>
          Status: <strong>{status === "completed" || allDone ? "Completed" : status === "in_progress" ? "In Progress" : "Not Started"}</strong>
        </div>
      </div>

      {socialAccountsNotification}
      <div style={{ display: "grid", gap: 12 }}>
        {checklistItems.map((item) => {
          const done = !!checklist[item.key];
          return (
            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, background: "#fff" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{item.detail}</div>
              </div>
              {/* Social media connect buttons for relevant checklist items */}
              {item.key.startsWith('connected') && item.key !== 'connectedBilling' ? (
                <button
                  onClick={() => {
                    if (done) return;
                    if (item.key === 'connectedFacebook') {
                      window.location.href = '/api/oauth/facebook';
                    } else if (item.key === 'connectedYouTube') {
                      window.location.href = '/api/oauth/youtube';
                    } else if (item.key === 'connectedLinkedIn') {
                      window.location.href = '/api/oauth/linkedin';
                    } else if (item.key === 'connectedInstagram') {
                      window.location.href = '/api/oauth/instagram';
                    } else {
                      alert(`Connect flow for ${item.title} coming soon!`);
                    }
                  }}
                  disabled={done}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: done ? "#e5e7eb" : "#1d4ed8",
                    color: done ? "#4b5563" : "#fff",
                    cursor: done ? "default" : "pointer",
                    minWidth: 140,
                    fontWeight: 700,
                  }}
                >
                  {done ? "Connected" : `Connect`}
                </button>
              ) : (
                <button
                  onClick={() => markComplete(item.key)}
                  disabled={done}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: done ? "#e5e7eb" : "#111827",
                    color: done ? "#4b5563" : "#fff",
                    cursor: done ? "default" : "pointer",
                    minWidth: 140,
                    fontWeight: 700,
                  }}
                >
                  {done ? "Completed" : "Mark complete"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={createDemoData}
          disabled={loading}
          style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700 }}
        >
          {loading ? "Seeding demo data..." : "Generate demo data"}
        </button>
        <button
          onClick={() => router.push("/app")}
          style={{ padding: "10px 16px", background: "#f3f4f6", color: "#111827", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer", fontWeight: 700 }}
        >
          Go to dashboard
        </button>
      </div>
    </main>
  );
}

