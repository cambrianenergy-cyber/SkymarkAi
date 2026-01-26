"use client";

import { useState } from "react";
import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "../steps/_shared";

const PLANS = [
  ["starter", "Starter"],
  ["team", "Team"],
  ["business", "Business"],
  ["enterprise", "Enterprise"],
] as const;

export function PlanRecommendationStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const rec = onboarding.planIntent?.recommendedPlan || "starter";
  const seats = onboarding.planIntent?.seatsPlanned || 1;
  const workspaces = onboarding.planIntent?.workspacesPlanned || 1;
  const reasons = onboarding.planIntent?.reasonCodes || [];
  const billingAuthority = onboarding.inputs?.user?.billingAuthority ?? false;

  const [selectedPlan, setSelectedPlan] = useState<string>(onboarding.planIntent?.selectedPlan || rec);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true); setErr(null);
    try {
      await saveOnboarding(workspaceId, "plan_recommendation", {
        "planIntent.selectedPlan": selectedPlan,
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
        <div className="text-lg font-semibold">Recommended plan</div>
        <div className="text-sm opacity-70">
          Based on your answers: <span className="font-medium">{seats}</span> seats,{" "}
          <span className="font-medium">{workspaces}</span> workspace(s).
        </div>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm opacity-70">Recommended</div>
        <div className="text-xl font-semibold">{rec.toUpperCase()}</div>
        {reasons.length ? (
          <div className="mt-2 text-sm opacity-80">
            Why: {reasons.join(", ")}
          </div>
        ) : null}
      </div>


      <div>
        <div className="text-sm font-medium mb-2">Choose a plan</div>
        <div className="flex flex-wrap gap-2">
          {PLANS.map(([id, label]) => (
            <button key={id} onClick={() => setSelectedPlan(id)}
              className={`border rounded px-3 py-2 ${selectedPlan === id ? "bg-black text-white" : ""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {selectedPlan === "founders" && (
        <div className="mt-6 p-4 border rounded bg-yellow-50">
          <h3 className="text-lg font-bold mb-2">Founders Plan Qualification Checklist</h3>
          <ul className="list-disc ml-6 mb-2">
            <li>Demonstrated need for advanced orchestration, compliance, or custom infrastructure</li>
            <li>Minimum annual contract value (negotiated, typically $25k+)</li>
            <li>Use case review and approval by Uqentra team</li>
            <li>Security and compliance requirements documented</li>
            <li>Willingness to provide architecture feedback and roadmap input</li>
            <li>Intent for white-label, reseller, or partnership (if applicable)</li>
            <li>Agreement to custom SLAs and support terms</li>
          </ul>
          <div className="text-sm mb-1">Review Process:</div>
          <ol className="list-decimal ml-6 mb-2">
            <li>Submit application with business case and requirements</li>
            <li>Internal review by Uqentra product and engineering leads</li>
            <li>Security/compliance review (if required)</li>
            <li>Interview or call with founder/leadership</li>
            <li>Final approval and onboarding</li>
          </ol>
          <div className="text-xs text-gray-600">Founders Plan is by invitation only. Custom pricing and terms apply. Roadmap influence and direct support included. White-label/reseller permissions require additional review.</div>
        </div>
      )}

      {!billingAuthority ? (
        <div className="rounded border p-3 text-sm">
          You marked that you’re <span className="font-medium">not</span> responsible for billing.
          You can continue — but you may want to invite an admin/owner to finalize billing later.
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
