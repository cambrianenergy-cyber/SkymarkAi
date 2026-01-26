import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

const plans = [
  { key: "starter", label: "Starter (solo / testing)" },
  { key: "team", label: "Team (collaboration + basic governance)" },
  { key: "business", label: "Business (multi-workspace, advanced permissions, audit)" },
  { key: "agency", label: "Agency / Enterprise (client workspaces, stricter governance, custom)" },
];

export function OnboardingPlanRecommendationScreen({ workspaceId, onboarding }: { workspaceId: string; onboarding: any }) {
  // Example: derive recommendation from onboarding inputs
  const seats = onboarding.inputs?.seatRange || "1";
  const multiWorkspace = onboarding.inputs?.multiWorkspace || false;
  const billingAuthority = onboarding.inputs?.externalCollaborators || false;
  const workspacesPlanned = onboarding.inputs?.workspaceCountRange || "1";

  let recommendedPlan = "starter";
  const reasonCodes: string[] = [];
  if (multiWorkspace) {
    recommendedPlan = "business";
    reasonCodes.push("multi-workspace");
  }
  if (seats !== "1 (just me)" && seats !== "2–5") {
    recommendedPlan = "team";
    reasonCodes.push("seats");
  }
  if (workspacesPlanned === "25+" || onboarding.inputs?.workspaceUseCase === "agency managing client accounts") {
    recommendedPlan = "agency";
    reasonCodes.push("agency signals");
  }
  if (billingAuthority) reasonCodes.push("external collaborators");

  const [selectedPlan, setSelectedPlan] = useState(recommendedPlan);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/plan_intents/${workspaceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendedPlan,
        selectedPlan,
        seatsPlanned: seats,
        workspacesPlanned,
        reasonCodes,
      }),
    });
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Recommended Plan</h2>
      <div className="mb-4">
        <div className="mb-2 font-semibold">We recommend:</div>
        {plans.map(plan => (
          <label key={plan.key} className={`card p-4 border rounded cursor-pointer mb-2 ${selectedPlan === plan.key ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
            <input type="radio" name="plan" value={plan.key} checked={selectedPlan === plan.key} onChange={() => setSelectedPlan(plan.key)} /> {plan.label}
          </label>
        ))}
      </div>
      <div className="mb-4">
        <div className="font-semibold">Why we recommend this:</div>
        <ul className="list-disc ml-6">
          {reasonCodes.map(code => <li key={code}>{code}</li>)}
        </ul>
      </div>
      <div className="mb-4">
        <button type="submit" className="rounded bg-black text-white px-4 py-2 mr-2">Start trial on recommended plan</button>
        <button type="button" className="rounded bg-gray-200 text-black px-4 py-2 mr-2" onClick={() => setSelectedPlan("")}>Choose a different plan</button>
        {recommendedPlan === "agency" && (
          <button type="button" className="rounded bg-blue-200 text-black px-4 py-2" onClick={() => window.open("/contact-sales", "_blank")}>Talk to sales</button>
        )}
      </div>
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
    </form>
  );
}
