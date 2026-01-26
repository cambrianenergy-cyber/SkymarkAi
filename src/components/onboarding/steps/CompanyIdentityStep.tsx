"use client";

import { useState } from "react";
import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";
import { saveOnboarding, advanceOnboarding } from "../steps/_shared";

export function CompanyIdentityStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId, onboarding } = props;

  const initial = onboarding.inputs?.company ?? ({} as any);

  const [legalName, setLegalName] = useState(initial.legalName || "");
  const [dba, setDba] = useState(initial.dba || "");
  const [industry, setIndustry] = useState(initial.industry || "");
  const [website, setWebsite] = useState(initial.website || "");
  const [country, setCountry] = useState(initial.country || "US");
  const [state, setState] = useState(initial.state || "TX");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true); setErr(null);
    try {
      await saveOnboarding(workspaceId, "company_identity", {
        "inputs.company.legalName": legalName.trim(),
        "inputs.company.dba": dba.trim() || null,
        "inputs.company.industry": industry.trim() || null,
        "inputs.company.website": website.trim() || null,
        "inputs.company.country": country || null,
        "inputs.company.state": state || null,
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
        <div className="text-lg font-semibold">What company do you represent?</div>
        <div className="text-sm opacity-70">This helps Uqentra tailor your workspace and plan.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          Company legal name
          <input className="mt-1 w-full border rounded px-3 py-2"
            value={legalName} onChange={(e) => setLegalName(e.target.value)} />
        </label>

        <label className="text-sm">
          DBA (optional)
          <input className="mt-1 w-full border rounded px-3 py-2"
            value={dba} onChange={(e) => setDba(e.target.value)} />
        </label>

        <label className="text-sm">
          Industry
          <input className="mt-1 w-full border rounded px-3 py-2"
            value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </label>

        <label className="text-sm">
          Website (optional)
          <input className="mt-1 w-full border rounded px-3 py-2"
            value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>

        <label className="text-sm">
          Country
          <input className="mt-1 w-full border rounded px-3 py-2"
            value={country} onChange={(e) => setCountry(e.target.value)} />
        </label>

        <label className="text-sm">
          State / Region
          <input className="mt-1 w-full border rounded px-3 py-2"
            value={state} onChange={(e) => setState(e.target.value)} />
        </label>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex gap-2">
        <button disabled={busy} onClick={onSave} className="border rounded px-4 py-2">
          Save
        </button>
        <button disabled={busy} onClick={onContinue} className="rounded bg-black text-white px-4 py-2">
          Continue
        </button>
      </div>
    </div>
  );
}
