// @ts-nocheck
import { NextResponse } from "next/server";
import { AI_COLLECTIONS, validate } from "../../../lib/aiCollections.firestore";
import { ToolRegistryDoc } from "../../../lib/aiCollections.schemas";
import admin from "../../../lib/firebaseAdmin";
const adminDb = admin.db;
const adminFieldValue = admin.firestore.FieldValue;

const now = () => adminFieldValue.serverTimestamp();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });

  const snap = await adminDb.collection(AI_COLLECTIONS.tool_registry).where("workspaceId", "==", workspaceId).limit(200).get();
  const items = snap.docs.map((d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = validate(ToolRegistryDoc, {
      ...body,
      createdAt: now(),
      updatedAt: now(),
    });

    const docId = `${data.workspaceId}_${data.toolKey}`;
    await adminDb.collection(AI_COLLECTIONS.tool_registry).doc(docId).set(data, { merge: true });

    return NextResponse.json({ ok: true, id: docId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
