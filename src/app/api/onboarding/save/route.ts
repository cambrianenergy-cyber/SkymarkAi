import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { db } from "@/lib/firebaseAdmin";
import { recommendPlan } from "../../../../lib/onboarding/recommendPlan";
import type { OnboardingStep } from "@/lib/onboardingTypes";

export async function POST(req: Request) {
  const { uid } = await requireSession(req);
  const body = (await req.json()) as {
    workspaceId: string;
    step: number;
    patch: Record<string, any>;
  };

  if (!body.workspaceId) return NextResponse.json({ error: "MISSING_WORKSPACE" }, { status: 400 });

  const wsRef = db.collection("workspaces").doc(body.workspaceId);
  const wsSnap = await wsRef.get();
  if (!wsSnap.exists) return NextResponse.json({ error: "WORKSPACE_NOT_FOUND" }, { status: 404 });

  const ws = wsSnap.data()!;
  if (ws.ownerId !== uid) {
    // tighten later to allow admin; for now owner-only write
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const now = Date.now();
  const currentOnboarding = (ws.onboarding ?? {}) as Record<string, any>;

  // Merge patch
  function deepMerge(base: any, patch: any): any {
    if (Array.isArray(base) || Array.isArray(patch)) return patch ?? base;
    if (typeof base !== "object" || base === null) return patch ?? base;
    if (typeof patch !== "object" || patch === null) return patch ?? base;
    const out: Record<string, any> = { ...base };
    for (const k of Object.keys(patch)) {
      out[k] = deepMerge(base[k], patch[k]);
    }
    return out;
  }
  const merged = deepMerge(currentOnboarding, body.patch ?? {});
  const recommended = recommendPlan(merged);

  // Step progression (never go backwards)
  const nextStep = Math.max(Number(ws.onboardingStep ?? 1), Number(body.step ?? 1));

  await wsRef.set(
    {
      onboarding: merged,
      onboardingStep: nextStep as OnboardingStep,
      onboardingComplete: false,
      updatedAt: now,
      // keep plan recommendation always updated
      "onboarding.plan.recommended": recommended,
    },
    { merge: true }
  );

  return NextResponse.json({
    ok: true,
    onboardingStep: nextStep as OnboardingStep,
    recommendedPlan: recommended,
  });
}
