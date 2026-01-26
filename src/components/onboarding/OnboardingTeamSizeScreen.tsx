import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

const seatRanges = [
  "1 (just me)",
  "2–5",
  "6–15",
  "16–50",
  "51–200",
  "200+",
];

export function OnboardingTeamSizeScreen({ workspaceId, onboarding }: { workspaceId: string; onboarding: any }) {
  const [seatRange, setSeatRange] = useState("");
  const [activeUsersRange, setActiveUsersRange] = useState("");
  const [externalCollaborators, setExternalCollaborators] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/workspace_onboarding/${workspaceId}/inputs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatRange, activeUsersRange, externalCollaborators }),
    });
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Team size & seats needed</h2>
      <div className="mb-4">
        <label>How many people will you add in the next 30 days?</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {seatRanges.map(range => (
            <label key={range} className={`p-2 border rounded cursor-pointer ${seatRange === range ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
              <input type="radio" name="seatRange" value={range} checked={seatRange === range} onChange={() => setSeatRange(range)} /> {range}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label>How many will actively use Uqentra weekly?</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {seatRanges.map(range => (
            <label key={range} className={`p-2 border rounded cursor-pointer ${activeUsersRange === range ? "bg-blue-100 border-blue-500" : "bg-white"}`}>
              <input type="radio" name="activeUsersRange" value={range} checked={activeUsersRange === range} onChange={() => setActiveUsersRange(range)} /> {range}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label>Will you invite external collaborators? (vendors/contractors)</label>
        <div>
          <label>
            <input type="radio" checked={externalCollaborators} onChange={() => setExternalCollaborators(true)} /> Yes
          </label>
          <label className="ml-4">
            <input type="radio" checked={!externalCollaborators} onChange={() => setExternalCollaborators(false)} /> No
          </label>
        </div>
      </div>
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
    </form>
  );
}
