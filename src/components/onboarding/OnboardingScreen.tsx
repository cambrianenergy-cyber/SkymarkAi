import { useState } from "react";
import { NextButton } from "../../hooks/NextButton";

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Other",
];

export function OnboardingScreen({ workspaceId, onboarding }: { workspaceId: string; onboarding: any }) {
  const [companyName, setCompanyName] = useState("");
  const [dba, setDba] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [mode, setMode] = useState<"join" | "create">("create");

  // TODO: Replace with actual user ID from session/auth context
  const uid = "CURRENT_USER_UID";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Write user profile
    await fetch(`/api/users/${uid}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        industry,
        companyWebsite,
        dba,
        country,
        state,
      }),
    });
    // If creating new workspace
    if (mode === "create") {
      await fetch(`/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          industry,
          createdByUid: uid,
        }),
      });
    }
    // If joining, you would validate/join workspace by code
    // ...
  }

  return (
    <>
      <form className="p-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">What company do you represent?</h2>
        <div className="mb-2">
          <label>Company legal name</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="input" required />
        </div>
        <div className="mb-2">
          <label>Doing business as (optional)</label>
          <input value={dba} onChange={e => setDba(e.target.value)} className="input" />
        </div>
        <div className="mb-2">
          <label>Industry</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)} className="input" required>
            <option value="">Select industry</option>
            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div className="mb-2">
          <label>Country</label>
          <input value={country} onChange={e => setCountry(e.target.value)} className="input" required />
        </div>
        <div className="mb-2">
          <label>State</label>
          <input value={state} onChange={e => setState(e.target.value)} className="input" required />
        </div>
        <div className="mb-2">
          <label>Company website (optional)</label>
          <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} className="input" />
        </div>
        <div className="mb-4">
          <label>Do you already have a Uqentra workspace?</label>
          <div>
            <label>
              <input type="radio" checked={mode === "join"} onChange={() => setMode("join")} /> Join existing
            </label>
            <label className="ml-4">
              <input type="radio" checked={mode === "create"} onChange={() => setMode("create")} /> Create new workspace
            </label>
          </div>
          {mode === "join" && (
            <div className="mt-2">
              <label>Workspace code / invite</label>
              <input value={workspaceCode} onChange={e => setWorkspaceCode(e.target.value)} className="input" />
            </div>
          )}
        </div>
        <NextButton workspaceId={workspaceId} currentStep={onboarding.currentStep} />
      </form>
      {process.env.NODE_ENV !== "production" ? (
        <details className="mt-6 text-xs opacity-80">
          <summary>Debug</summary>
          <pre className="whitespace-pre-wrap">{JSON.stringify(onboarding, null, 2)}</pre>
        </details>
      ) : null}
    </>
  );
}
