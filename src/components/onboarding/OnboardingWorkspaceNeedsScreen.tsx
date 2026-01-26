import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

const useCases = [
  "multiple locations (Dallas, Austin, etc.)",
  "multiple brands/divisions",
  "agency managing client accounts",
];
const workspaceCountRanges = ["2–3", "4–10", "11–25", "25+"];

export function OnboardingWorkspaceNeedsScreen({ workspaceId, onboarding }: { workspaceId: string; onboarding: any }) {
  const [multiWorkspace, setMultiWorkspace] = useState(false);
  const [workspaceUseCase, setWorkspaceUseCase] = useState("");
  const [workspaceCountRange, setWorkspaceCountRange] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/workspace_onboarding/${workspaceId}/inputs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ multiWorkspace, workspaceUseCase, workspaceCountRange }),
    });
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Workspaces needed</h2>
      <div className="mb-4">
        <label>Do you need more than one workspace?</label>
        <div>
          <label>
            <input type="radio" checked={!multiWorkspace} onChange={() => setMultiWorkspace(false)} /> No, single company
          </label>
          <label className="ml-4">
            <input type="radio" checked={multiWorkspace} onChange={() => setMultiWorkspace(true)} /> Yes
          </label>
        </div>
      </div>
      {multiWorkspace && (
        <>
          <div className="mb-4">
            <label>What is your use case?</label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {useCases.map(useCase => (
                <label key={useCase} className={`p-2 border rounded cursor-pointer ${workspaceUseCase === useCase ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
                  <input type="radio" name="workspaceUseCase" value={useCase} checked={workspaceUseCase === useCase} onChange={() => setWorkspaceUseCase(useCase)} /> {useCase}
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label>How many workspaces do you anticipate?</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {workspaceCountRanges.map(range => (
                <label key={range} className={`p-2 border rounded cursor-pointer ${workspaceCountRange === range ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
                  <input type="radio" name="workspaceCountRange" value={range} checked={workspaceCountRange === range} onChange={() => setWorkspaceCountRange(range)} /> {range}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
    </form>
  );
}
