import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { storeMetaToken } from "@/lib/integrations/social/meta";

export async function POST(req: Request) {
  const { code, state: workspaceId } = await req.json();
  if (!code || !workspaceId) return NextResponse.json({ ok: false, error: "Missing code or workspaceId" }, { status: 400 });

  // Exchange code for access token
  const token = await storeMetaToken(code, workspaceId);
  if (!token) return NextResponse.json({ ok: false, error: "Token exchange failed" }, { status: 500 });

  // Store token in integration_secrets (server-only)
  await adminDb.collection("integration_secrets").doc(workspaceId + "_meta").set({
    accessToken: token.access_token,
    expiresIn: token.expires_in,
    tokenType: token.token_type,
    obtainedAt: Date.now(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
