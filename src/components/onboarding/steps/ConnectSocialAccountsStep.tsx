"use client";

import { useMemo, useState } from "react";
import type { SocialPlatform, WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "../steps/_shared";

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "meta", label: "Meta (Facebook + Instagram)" },
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "snapchat", label: "Snapchat" },
  { id: "nextdoor", label: "Nextdoor" },
  { id: "angi", label: "Angi (Angie's List)" },
  { id: "threads", label: "Threads" },
];

export function ConnectSocialAccountsStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const initialChoice = onboarding.inputs?.social?.connectNowChoice || "add_later";
  const initialPlanned = onboarding.inputs?.social?.plannedPlatforms || [];

  const [connectNowChoice, setConnectNowChoice] = useState<"connect_now" | "add_later">(initialChoice);
  const [plannedPlatforms, setPlannedPlatforms] = useState<SocialPlatform[]>(initialPlanned);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const statusBy = useMemo(() => onboarding.integrations?.social?.statusByPlatform ?? ({} as any), [onboarding]);

  function toggle(p: SocialPlatform) {
    setPlannedPlatforms((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function onSave() {
    await saveOnboarding(workspaceId, "connect_social_accounts", {
      "inputs.social.connectNowChoice": connectNowChoice,
      "inputs.social.plannedPlatforms": plannedPlatforms,
      "integrations.social.deferred": connectNowChoice === "add_later",
      "integrations.social.connectedPlatforms": onboarding.integrations?.social?.connectedPlatforms ?? [],
      "integrations.social.connectedCount": onboarding.integrations?.social?.connectedCount ?? 0,
    });
  }

  async function onContinue() {
    setBusy(true); setErr(null);
    try {
      await onSave();
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  // Real OAuth connect for Meta (and other platforms in future)
  async function connectStub(platform: SocialPlatform) {
    setBusy(true); setErr(null);
    try {
      // Platforms with real OAuth
      if (["meta", "linkedin", "x", "tiktok", "youtube"].includes(platform)) {
        // For X, generate PKCE code challenge and verifier
        let codeChallenge: string | undefined = undefined;
        let codeVerifier: string | undefined = undefined;
        if (platform === "x") {
          codeVerifier = Array.from(window.crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
          const encoder = new TextEncoder();
          const data = encoder.encode(codeVerifier);
          const digest = await window.crypto.subtle.digest('SHA-256', data);
          codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        }
        const res = await fetch("/api/integrations/social/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, workspaceId, codeChallenge })
        });
        const data = await res.json();
        if (data.ok && data.url) {
          if (platform === "x" && typeof codeVerifier === 'string') {
            sessionStorage.setItem(`x_pkce_${workspaceId}`, codeVerifier);
          }
          window.location.href = data.url;
        } else {
          setErr(data.error || `Failed to start ${platform} connect`);
        }
      } else {
        // Fallback: mark as needs_permission for other platforms (stub)
        await saveOnboarding(workspaceId, "connect_social_accounts", {
          [`integrations.social.statusByPlatform.${platform}`]: { status: "needs_permission" },
        });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold">Connect your social accounts</div>
        <div className="text-sm opacity-70">
          Optional — but connecting now lets Uqentra start services immediately (posting, reporting, inbox monitoring).
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`border rounded px-4 py-2 ${connectNowChoice === "connect_now" ? "bg-black text-white" : ""}`}
          onClick={() => setConnectNowChoice("connect_now")}
        >
          Connect now
        </button>
        <button
          className={`border rounded px-4 py-2 ${connectNowChoice === "add_later" ? "bg-black text-white" : ""}`}
          onClick={() => setConnectNowChoice("add_later")}
        >
          Add later
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Platforms you plan to use</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PLATFORMS.map((p) => {
            const selected = plannedPlatforms.includes(p.id);
            const status = statusBy?.[p.id]?.status ?? "not_connected";

            return (
              <div key={p.id} className="border rounded p-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => toggle(p.id)}
                    className={`text-left flex-1 ${selected ? "font-semibold" : ""}`}
                  >
                    {p.label}
                    <div className="text-xs opacity-70 mt-1">Status: {status}</div>
                  </button>

                  <button
                    className="border rounded px-3 py-2 text-sm"
                    onClick={() => connectStub(p.id)}
                    disabled={connectNowChoice !== "connect_now"}
                    title={connectNowChoice !== "connect_now" ? "Select Connect now to connect" : "Connect"}
                  >
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">
        Finish onboarding
      </button>
    </div>
  );
}
