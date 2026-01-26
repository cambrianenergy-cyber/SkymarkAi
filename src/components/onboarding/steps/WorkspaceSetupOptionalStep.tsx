"use client";

import { useState } from "react";
import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { advanceOnboarding } from "../steps/_shared";

// This step is optional. Real provisioning of new workspaces is a separate route.
// Here we just let them continue, or enter names you can later create.

export function WorkspaceSetupOptionalStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const multi = onboarding.inputs?.workspaceNeeds?.multiWorkspace ?? false;

  const [names, setNames] = useState<string>(""); // newline separated
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onContinue() {
    setBusy(true); setErr(null);
    try {
      // If you want to save names, store them:
      // await saveOnboarding(workspaceId, "workspace_setup_optional", {"inputs.workspaceNeeds.workspaceNamesDraft": names.split("\n").map(x=>x.trim()).filter(Boolean)})
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Workspace setup</div>

      {!multi ? (
        <div className="text-sm opacity-70">
          You selected single workspace. This step will auto-skip when you continue.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm opacity-70">
            Add the names of the first workspaces you want (optional). One per line.
          </div>
          <textarea
            className="w-full border rounded p-3"
            rows={5}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder={`Dallas\nAustin\nHouston`}
          />
        </div>
      )}

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">
        Continue
      </button>
    </div>
  );
}
