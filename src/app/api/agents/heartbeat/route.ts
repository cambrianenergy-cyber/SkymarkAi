import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workspaceId, agentId } = body;

    if (!workspaceId || typeof workspaceId !== "string") throw new Error("workspaceId required");
    if (!agentId || typeof agentId !== "string") throw new Error("agentId required");

    const db = getFirestore();

    const agentRef = db.collection(`workspaces/${workspaceId}/agents`).doc(agentId);
    await agentRef.set(
      {
        workspaceId,
        agentId,
        health: "ok",
        lastHeartbeatAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const evtRef = db.collection(`workspaces/${workspaceId}/events`).doc();
    await evtRef.set({
      workspaceId,
      type: "AGENT_HEARTBEAT",
      actor: { agentId },
      severity: "info",
      createdAt: FieldValue.serverTimestamp(),
      meta: null,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "unknown" }, { status: 400 });
  }
}
