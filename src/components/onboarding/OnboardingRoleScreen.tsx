import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

const roles = [
  { key: "owner", label: "Owner / Founder" },
  { key: "executive", label: "Executive (C-level / VP)" },
  { key: "admin", label: "Admin / Ops Manager" },
  { key: "lead", label: "Team Lead" },
  { key: "member", label: "Individual Contributor" },
  { key: "contractor", label: "Contractor / Agency" },
];

export function OnboardingRoleScreen({ workspaceId, onboarding, uid }: { workspaceId: string; onboarding: any; uid: string }) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [title, setTitle] = useState("");
  const [billingAuthority, setBillingAuthority] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Write to workspace_members
    await fetch(`/api/workspace_members/${workspaceId}_${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: selectedRole,
        title,
      }),
    });
    // Write to users
    await fetch(`/api/users/${uid}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billingAuthority }),
    });
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Choose your role in the company</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {roles.map(role => (
          <div
            key={role.key}
            className={`card p-4 border rounded cursor-pointer ${selectedRole === role.key ? "bg-blue-100 border-blue-500" : "bg-white"}`}
            onClick={() => setSelectedRole(role.key)}
          >
            <div className="font-semibold">{role.label}</div>
          </div>
        ))}
      </div>
      <div className="mb-2">
        <label>Business title (optional)</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="input" />
      </div>
      <div className="mb-4">
        <label>Are you responsible for billing?</label>
        <div>
          <label>
            <input type="radio" checked={billingAuthority} onChange={() => setBillingAuthority(true)} /> Yes
          </label>
          <label className="ml-4">
            <input type="radio" checked={!billingAuthority} onChange={() => setBillingAuthority(false)} /> No
          </label>
        </div>
      </div>
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
    </form>
  );
}
