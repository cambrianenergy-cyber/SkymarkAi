// Shared onboarding step utilities
export async function saveOnboarding(workspaceId: string, step: string, patch: Record<string, any>) {
  const res = await fetch("/api/onboarding/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, step, patch })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save onboarding step");
  }
  return res.json();
}

export async function advanceOnboarding(workspaceId: string, step: string) {
  const res = await fetch("/api/onboarding/advance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, expectedCurrentStep: step })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to advance onboarding step");
  }
  return res.json();
}