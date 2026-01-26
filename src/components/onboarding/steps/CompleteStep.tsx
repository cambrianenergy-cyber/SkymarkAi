"use client";

import type { WorkspaceOnboardingDoc } from "../../../lib/onboarding/types";

export function CompleteStep(props: { workspaceId: string; onboarding: WorkspaceOnboardingDoc }) {
  const { workspaceId } = props;

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">You’re set up.</div>
      <div className="text-sm opacity-70">Next, launch your first workflow or go to the dashboard.</div>

      <div className="flex flex-wrap gap-2">
        <a className="border rounded px-4 py-2" href={`/app/${workspaceId}/workflows/new`}>Create a workflow</a>
        <a className="border rounded px-4 py-2" href={`/app/${workspaceId}/agents/new`}>Create an agent</a>
        <a className="rounded bg-black text-white px-4 py-2" href={`/app/${workspaceId}`}>Go to dashboard</a>
      </div>
    </div>
  );
}
