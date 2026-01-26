import { NextButton } from "../../hooks/NextButton";

export function OnboardingFinishScreen({ workspaceId, onboarding }: { workspaceId: string; onboarding: any }) {
  const primaryOutcome = onboarding.inputs?.primaryOutcome || "your chosen outcome";

  async function handleFinish(action: string) {
    // Mark onboarding as done
    await fetch(`/api/workspace_onboarding/${workspaceId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep: "done", action }),
    });
    // Optionally create starter workflow/agent templates here
    // Redirect based on action
    if (action === "quickstart") {
      window.location.href = `/workflows/quickstart?workspaceId=${workspaceId}`;
    } else if (action === "agent") {
      window.location.href = `/agents/create?workspaceId=${workspaceId}`;
    } else {
      window.location.href = `/dashboard?workspaceId=${workspaceId}`;
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Onboarding Complete!</h2>
      <div className="mb-4">We set you up for: <span className="font-semibold">{primaryOutcome}</span></div>
      <div className="flex flex-col gap-4">
        <button className="rounded bg-blue-600 text-white px-4 py-2" onClick={() => handleFinish("quickstart")}>Launch Quickstart Workflow</button>
        <button className="rounded bg-green-600 text-white px-4 py-2" onClick={() => handleFinish("agent")}>Create an Agent</button>
        <button className="rounded bg-black text-white px-4 py-2" onClick={() => handleFinish("dashboard")}>Go to Dashboard</button>
      </div>
    </div>
  );
}
