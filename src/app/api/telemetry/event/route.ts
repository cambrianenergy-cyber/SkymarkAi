import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

function requireWorkspaceId(workspaceId: unknown): asserts workspaceId is string {
  if (!workspaceId || typeof workspaceId !== "string") throw new Error("workspaceId required");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getFirestore();

    const { workspaceId, type, actor, severity, message, meta, runId, workflowId, stepId, approvalId, leadId, platform } = body;

    requireWorkspaceId(workspaceId);
    if (!type || typeof type !== "string") throw new Error("type required");
    if (!severity || typeof severity !== "string") throw new Error("severity required");
    if (!actor || typeof actor !== "object") throw new Error("actor required");

    // TODO: enforce auth + RBAC guard here (requireWorkspaceMember)
    // e.g. await requireWorkspaceMember(workspaceId, uidFromSession)

    const ref = db.collection(`workspaces/${workspaceId}/events`).doc();

    await ref.set({
      workspaceId,
      type,
      actor,
      runId: runId ?? null,
      workflowId: workflowId ?? null,
      stepId: stepId ?? null,
      approvalId: approvalId ?? null,
      leadId: leadId ?? null,
      platform: platform ?? null,
      severity,
      message: message ?? null,
      meta: meta ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "unknown" }, { status: 400 });
  }
}
