import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

export function OnboardingWorkspaceStructureScreen({ workspaceId, onboarding, uid }: { workspaceId: string; onboarding: any; uid: string }) {
  const multiWorkspace = onboarding.inputs?.multiWorkspace;
  const [workspaceNames, setWorkspaceNames] = useState(["", "", ""]);

  if (!multiWorkspace) {
    return <div className="p-6">No additional workspaces needed. Skipping...</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const name of workspaceNames.filter(n => n.trim())) {
      const res = await fetch(`/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, createdByUid: uid }),
      });
      const { workspaceId: newWorkspaceId } = await res.json();
      await fetch(`/api/workspace_members/${newWorkspaceId}_${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "owner", title: "" }),
      });
    }
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Create additional workspaces</h2>
      <div className="mb-4">Name your first 1–3 workspaces (Location/Client/Division):</div>
      {[0, 1, 2].map(i => (
        <div key={i} className="mb-2">
          <input
            value={workspaceNames[i]}
            onChange={e => {
              const arr = [...workspaceNames];
              arr[i] = e.target.value;
              setWorkspaceNames(arr);
            }}
            className="input"
            placeholder={`Workspace ${i + 1} name`}
          />
        </div>
      ))}
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
    </form>
  );
}
