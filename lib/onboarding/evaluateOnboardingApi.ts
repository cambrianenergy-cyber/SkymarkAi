export async function evaluateOnboardingApi(userId, workspaceId) {
  const res = await fetch("/api/onboarding/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, workspaceId })
  });
  if (!res.ok) throw new Error("Failed to evaluate onboarding");
  return await res.json();
}
