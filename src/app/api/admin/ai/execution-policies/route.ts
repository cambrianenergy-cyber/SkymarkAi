// @ts-nocheck
import { NextResponse } from "next/server";
import { AI_COLLECTIONS, validate } from "../../../lib/aiCollections.firestore";
import { ExecutionPolicyDoc } from "../../../lib/aiCollections.schemas";
import admin from "../../../lib/firebaseAdmin";
const adminDb = admin.db;
const adminFieldValue = admin.firestore.FieldValue;

const now = () => adminFieldValue.serverTimestamp();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });

  const snap = await adminDb.collection(AI_COLLECTIONS.execution_policies).where("workspaceId", "==", workspaceId).limit(50).get();
  const items = snap.docs.map((d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = validate(ExecutionPolicyDoc, {
      ...body,
      createdAt: now(),
      updatedAt: now(),
    });

    const docId = `${data.workspaceId}_${data.policyKey}`;
    await adminDb.collection(AI_COLLECTIONS.execution_policies).doc(docId).set(data, { merge: true });
    return NextResponse.json({ ok: true, id: docId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
