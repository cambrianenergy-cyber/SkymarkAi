import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

const roles = ["admin", "member", "viewer"];

export function OnboardingInviteTeamScreen({ workspaceId, onboarding }: { workspaceId: string; onboarding: any }) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("member");
  const [invited, setInvited] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailList = emails.split(",").map(e => e.trim()).filter(Boolean);
    for (const email of emailList) {
      // Create invitation doc
      await fetch(`/api/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, email, role }),
      });
      // Send notification (stub)
      await fetch(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: email, type: "invite", workspaceId }),
      });
    }
    setInvited(emailList);
  }

  return (
    <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Invite your team</h2>
      <div className="mb-4">
        <label>Add emails (comma separated)</label>
        <input value={emails} onChange={e => setEmails(e.target.value)} className="input" placeholder="user1@email.com, user2@email.com" />
      </div>
      <div className="mb-4">
        <label>Assign role</label>
        <select value={role} onChange={e => setRole(e.target.value)} className="input">
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
      {invited.length > 0 && (
        <div className="mt-4 text-green-600">Invited: {invited.join(", ")}</div>
      )}
    </form>
  );
}
