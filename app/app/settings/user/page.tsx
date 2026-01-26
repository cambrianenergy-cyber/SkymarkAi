"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../../lib/useAuthWorkspaceGuard";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { trackEvent } from "../../../../lib/analytics";

interface UserSettingsDoc {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  title?: string;
  bio?: string;
  timezone?: string;
  notifications?: { email: boolean; push: boolean };
  createdAt?: any;
  updatedAt?: any;
}

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

export default function UserSettingsPage() {
  const router = useRouter();
  const { user, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [settings, setSettings] = useState<UserSettingsDoc | null>(null);
  const debouncedTimer = useRef<any>(null);

  useEffect(() => {
    if (!isReady || !isAuthorized || !user) return;
    setLoading(true);

    const userRef = doc(db, "users", user.uid);
    let unsub: (() => void) | null = null;

    (async () => {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const defaults: UserSettingsDoc = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          title: "",
          bio: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          notifications: { email: true, push: false },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, defaults, { merge: true });
      }
      unsub = onSnapshot(userRef, (s) => {
        setSettings(s.data() as UserSettingsDoc);
        setLoading(false);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [isReady, isAuthorized, user]);

  function queueSave(patch: Partial<UserSettingsDoc>) {
    if (!user) return;
    setSettings((prev) => ({ ...(prev as UserSettingsDoc), ...patch }));
    setSaving("saving");
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    debouncedTimer.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "users", user.uid), { ...patch, updatedAt: serverTimestamp() });
        trackEvent("user_settings_updated", { uid: user.uid, keys: Object.keys(patch) });
        setSaving("saved");
        setTimeout(() => setSaving("idle"), 1200);
      } catch (e) {
        console.error("Failed to save user settings", e);
        setSaving("idle");
        alert("Failed to save: " + (e as any).message);
      }
    }, 500);
  }

  if (!isReady) return <GuardLoadingScreen />;
  if (!isAuthorized || !user) return null;
  if (loading || !settings) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading User Settings</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>User Settings</h1>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{settings.email}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: saving === "saved" ? "#15803d" : saving === "saving" ? "#b45309" : "#6b7280" }}>
            {saving === "saving" ? "Saving" : saving === "saved" ? "Saved" : ""}
          </span>
          <button onClick={() => router.push("/app")} style={{ border: "1px solid #d1d5db", background: "#f9fafb", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>Exit to Dashboard</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Profile */}
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Profile</h3>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Display Name</label>
          <input
            value={settings.displayName || ""}
            onChange={(e) => queueSave({ displayName: e.target.value })}
            placeholder="Your name"
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />

          <div style={{ height: 12 }} />
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Title</label>
          <input
            value={settings.title || ""}
            onChange={(e) => queueSave({ title: e.target.value })}
            placeholder="e.g., Growth Lead"
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />

          <div style={{ height: 12 }} />
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Photo URL</label>
          <input
            value={settings.photoURL || ""}
            onChange={(e) => queueSave({ photoURL: e.target.value })}
            placeholder="https://..."
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6 }}
          />
          {settings.photoURL ? (
            <div style={{ marginTop: 12 }}>
              <img src={settings.photoURL} alt="Avatar" style={{ maxHeight: 64, borderRadius: '50%' }} />
            </div>
          ) : null}
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
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Bio</label>
          <textarea
            value={settings.bio || ""}
            onChange={(e) => queueSave({ bio: e.target.value })}
            placeholder="Tell us about yourself"
            rows={5}
            style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginTop: 6, resize: 'vertical' }}
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
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <a href="/app/settings" onClick={(e) => { e.preventDefault(); router.push('/app/settings'); }} style={{ fontSize: 12, color: '#2563eb' }}>Workspace Settings </a>
      </div>
    </main>
  );
}

