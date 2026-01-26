"use client";

import { useState } from "react";
import { useAllowedTools } from "../../../hooks/useAllowedTools";
import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "../steps/_shared";

const OUTCOMES = [
  ["support", "Customer support + inbox automation"],
  ["sales", "Sales follow-up + lead nurturing"],
  ["ops", "Internal ops automation (tasks/approvals)"],
  ["marketing", "Content + marketing automation"],
  ["reporting", "Data extraction + reporting"],
  ["custom", "Build my own workflows from scratch"],
] as const;

const TOOLS = ["gmail", "outlook", "slack", "teams", "hubspot", "salesforce", "notion", "airtable", "gdrive", "dropbox", "zapier", "make", "custom_api"];

  const { workspaceId, onboarding } = props;
  const { allowedTools, loading: allowedLoading } = useAllowedTools(workspaceId);

  const initOutcome = onboarding.inputs?.goals?.primaryOutcome || "support";
  const initTools = onboarding.inputs?.goals?.tools || [];

  const [primaryOutcome, setPrimaryOutcome] = useState<string>(initOutcome);
  const [tools, setTools] = useState<string[]>(initTools);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleTool(t: string) {
    if (allowedTools && !allowedTools.includes(t)) {
      setErr(`You are not allowed to select the tool: ${t}`);
      return;
    }
    setTools((prev) => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function onSave() {
    setBusy(true); setErr(null);
    try {
      await saveOnboarding(workspaceId, "primary_outcome", {
        "inputs.goals.primaryOutcome": primaryOutcome,
        "inputs.goals.tools": tools,
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
      {allowedLoading && <div>Loading allowed tools...</div>}
      <div>
        <div className="text-lg font-semibold">What do you want Uqentra to do first?</div>
        <div className="text-sm opacity-70">We’ll personalize your quickstart based on this.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {OUTCOMES.map(([id, label]) => (
          <button key={id} onClick={() => setPrimaryOutcome(id)}
            className={`border rounded px-4 py-3 text-left ${primaryOutcome === id ? "bg-black text-white" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Tools you use (pick any)</div>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTool(t)}
              className={`border rounded px-3 py-2 ${tools.includes(t) ? "bg-black text-white" : ""}`}
              disabled={allowedTools && !allowedTools.includes(t)}
              title={allowedTools && !allowedTools.includes(t) ? "Not allowed by your policy" : undefined}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex gap-2">
        <button disabled={busy} onClick={onSave} className="border rounded px-4 py-2">Save</button>
        <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">Continue</button>
      </div>
    </div>
  );
}
