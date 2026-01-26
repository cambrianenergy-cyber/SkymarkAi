"use client";

import { useState } from "react";
import type { SeatRange, WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "../steps/_shared";

const BUCKETS: SeatRange[] = ["1", "2-5", "6-15", "16-50", "51-200", "200+"];

export function TeamSizeStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const initSeat = onboarding.inputs?.sizing?.seatRange || "1";
  const initActive = onboarding.inputs?.sizing?.activeUsersRange || "1";
  const initExt = onboarding.inputs?.sizing?.externalCollaborators ?? false;

  const [seatRange, setSeatRange] = useState<SeatRange>(initSeat);
  const [activeUsersRange, setActiveUsersRange] = useState<SeatRange>(initActive);
  const [externalCollaborators, setExternalCollaborators] = useState<boolean>(initExt);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true); setErr(null);
    try {
      await saveOnboarding(workspaceId, "team_size", {
        "inputs.sizing.seatRange": seatRange,
        "inputs.sizing.activeUsersRange": activeUsersRange,
        "inputs.sizing.externalCollaborators": externalCollaborators,
      });
    } catch (e: any) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  async function onContinue() {
    setBusy(true); setErr(null);
    try {
      await onSave();
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold">Team size</div>
        <div className="text-sm opacity-70">Used to recommend the right plan and workspace setup.</div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">How many people will you add in the next 30 days?</div>
        <div className="flex flex-wrap gap-2">
          {BUCKETS.map((b) => (
            <button key={b} onClick={() => setSeatRange(b)}
              className={`border rounded px-3 py-2 ${seatRange === b ? "bg-black text-white" : ""}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">How many will actively use Uqentra weekly?</div>
        <div className="flex flex-wrap gap-2">
          {BUCKETS.map((b) => (
            <button key={b} onClick={() => setActiveUsersRange(b)}
              className={`border rounded px-3 py-2 ${activeUsersRange === b ? "bg-black text-white" : ""}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={externalCollaborators} onChange={(e) => setExternalCollaborators(e.target.checked)} />
        We will invite external collaborators (vendors/contractors)
      </label>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex gap-2">
        <button disabled={busy} onClick={onSave} className="border rounded px-4 py-2">Save</button>
        <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">Continue</button>
      </div>
    </div>
  );
}
