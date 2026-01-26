"use client";

import { useState } from "react";

export function NextButton(props: { workspaceId: string; currentStep: string }) {
  const { workspaceId, currentStep } = props;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onNext() {
    setBusy(true);
    setError(null);

    const res = await fetch("/api/onboarding/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, expectedCurrentStep: currentStep }),
    });

    const json = await res.json();

    if (!res.ok || json.ok === false) {
      setError((json?.reasons?.[0] as string) || "Could not advance onboarding.");
    }

    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onNext}
        disabled={busy}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {busy ? "Continuing..." : "Continue"}
      </button>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
