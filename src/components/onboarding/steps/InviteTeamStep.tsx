"use client";

import { useState } from "react";
import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { advanceOnboarding } from "../steps/_shared";

// This step is optional. Real invites should be a route that creates workspace_invites.
// For now, we provide UI + skip.

export function InviteTeamStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendInvitesStub() {
    // Implement later: POST /api/invites/create
    // Here we just pretend success.
    return;
  }

  async function onInviteAndContinue() {
    setBusy(true); setErr(null);
    try {
      if (emails.trim()) await sendInvitesStub();
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function onSkip() {
    setBusy(true); setErr(null);
    try {
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Invite your team</div>
        <div className="text-sm opacity-70">Optional — you can do this later.</div>
      </div>

      <label className="text-sm block">
        Emails (comma-separated)
        <textarea
          className="mt-1 w-full border rounded p-3"
          rows={4}
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="alex@company.com, sam@company.com"
        />
      </label>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex gap-2">
        <button disabled={busy} onClick={onSkip} className="border rounded px-4 py-2">Skip</button>
        <button disabled={busy} onClick={onInviteAndContinue} className="rounded bg-black text-white px-4 py-2">
          Continue
        </button>
      </div>
    </div>
  );
}
