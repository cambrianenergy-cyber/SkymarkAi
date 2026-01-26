import { NextResponse } from "next/server";
import { advanceOnboardingStep } from "@/lib/onboarding/advance";
import { requireSession } from "@/lib/auth/requireSession";
import { assertWorkspaceAdminOrOwner } from "@/lib/auth/workspaceAccess";
import { captureApiError } from "@/lib/telemetry/capture";

export async function POST(req: Request) {
  try {
    const session = await requireSession(req);
    const { workspaceId, expectedCurrentStep } = await req.json();

    await assertWorkspaceAdminOrOwner(session.uid, workspaceId);

    const result = await advanceOnboardingStep({
      workspaceId,
      uid: session.uid,
      expectedCurrentStep,
    });

    return NextResponse.json(result);
  } catch (err) {
    captureApiError(err, { route: "onboarding/advance" });
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
