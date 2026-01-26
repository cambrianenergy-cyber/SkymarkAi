"use client";

import { useState } from "react";
import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "./_shared";

const ROLES = [
  { id: "owner", label: "Owner / Founder" },
  { id: "exec", label: "Executive" },
  { id: "admin", label: "Admin / Ops" },
  { id: "lead", label: "Team Lead" },
  { id: "member", label: "Team Member" },
  { id: "contractor", label: "Contractor / Agency" },
] as const;

export function CompanyRoleStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const initialRole = onboarding.inputs?.user?.businessRole || "member";
  const initialBilling = onboarding.inputs?.user?.billingAuthority ?? false;

  const [role, setRole] = useState<string>(initialRole);
  const [billingAuthority, setBillingAuthority] = useState<boolean>(initialBilling);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true); setErr(null);
    try {
      await saveOnboarding(workspaceId, "company_role", {
        "inputs.user.businessRole": role,
        "inputs.user.billingAuthority": billingAuthority,
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onContinue() {
    setBusy(true); setErr(null);
    try {
      await onSave();
      await advanceOnboarding(workspaceId, onboarding.currentStep);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">What’s your role?</div>
        <div className="text-sm opacity-70">This helps us set the right access and onboarding path.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`border rounded px-4 py-3 text-left ${role === r.id ? "bg-black text-white" : ""}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={billingAuthority} onChange={(e) => setBillingAuthority(e.target.checked)} />
        I’m responsible for billing
      </label>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex gap-2">
        <button disabled={busy} onClick={onSave} className="border rounded px-4 py-2">Save</button>
        <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">Continue</button>
      </div>
    </div>
  );
}
