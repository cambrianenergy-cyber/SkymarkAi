"use client";

import { useState } from "react";
import type { WorkspaceCountRange, WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "../steps/_shared";

const COUNT: WorkspaceCountRange[] = ["2-3", "4-10", "11-25", "25+"];

export function WorkspaceNeedsStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const initMulti = onboarding.inputs?.workspaceNeeds?.multiWorkspace ?? false;
  const initUseCase = onboarding.inputs?.workspaceNeeds?.useCase || null;
  const initCount = onboarding.inputs?.workspaceNeeds?.workspaceCountRange || null;

  const [multiWorkspace, setMultiWorkspace] = useState<boolean>(initMulti);
  const [useCase, setUseCase] = useState<string | null>(initUseCase);
  const [workspaceCountRange, setWorkspaceCountRange] = useState<string | null>(initCount);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true); setErr(null);
    try {
      await saveOnboarding(workspaceId, "workspace_needs", {
        "inputs.workspaceNeeds.multiWorkspace": multiWorkspace,
        "inputs.workspaceNeeds.useCase": multiWorkspace ? useCase : null,
        "inputs.workspaceNeeds.workspaceCountRange": multiWorkspace ? workspaceCountRange : null,
      });
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function onContinue() {
    setBusy(true); setErr(null);
    try {
      await onSave();
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold">Workspaces</div>
        <div className="text-sm opacity-70">Single workspace or multiple workspaces?</div>
      </div>

      <div className="flex gap-2">
        <button className={`border rounded px-4 py-2 ${!multiWorkspace ? "bg-black text-white" : ""}`}
          onClick={() => { setMultiWorkspace(false); setUseCase(null); setWorkspaceCountRange(null); }}>
          Single workspace
        </button>
        <button className={`border rounded px-4 py-2 ${multiWorkspace ? "bg-black text-white" : ""}`}
          onClick={() => setMultiWorkspace(true)}>
          Multiple workspaces
        </button>
      </div>

      {multiWorkspace ? (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Why do you need multiple workspaces?</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ["locations", "Multiple locations"],
                ["divisions", "Divisions / departments"],
                ["brands", "Multiple brands"],
                ["agency", "Agency (client workspaces)"],
              ].map(([id, label]) => (
                <button key={id}
                  onClick={() => setUseCase(id)}
                  className={`border rounded px-4 py-3 text-left ${useCase === id ? "bg-black text-white" : ""}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">How many workspaces do you anticipate?</div>
            <div className="flex flex-wrap gap-2">
              {COUNT.map((c) => (
                <button key={c} onClick={() => setWorkspaceCountRange(c)}
                  className={`border rounded px-3 py-2 ${workspaceCountRange === c ? "bg-black text-white" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex gap-2">
        <button disabled={busy} onClick={onSave} className="border rounded px-4 py-2">Save</button>
        <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">Continue</button>
      </div>
    </div>
  );
}
