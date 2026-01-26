import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";
import { encryptToken } from "../../../../../../lib/integrations/encryption";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state"); // state:attemptId:workspaceId
  const error = url.searchParams.get("error");

  if (error) return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=${encodeURIComponent(error)}`);
  if (!code || !stateRaw) return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=missing_code_or_state`);

  const [state, attemptId, workspaceId] = stateRaw.split(":");
  const attemptRef = adminDb.collection("integration_connect_attempts").doc(attemptId);
  const attemptSnap = await attemptRef.get();

  if (!attemptSnap.exists) return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=invalid_attempt`);
  const attempt = attemptSnap.data() as any;
  if (attempt.state !== state || attempt.workspaceId !== workspaceId || attempt.platform !== "x") {
    return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=state_mismatch`);
  }

  // Exchange code for token (X)
  const tokenParams = new URLSearchParams({
    client_id: process.env.X_CLIENT_ID || "",
    client_secret: process.env.X_CLIENT_SECRET || "",
    redirect_uri: process.env.X_REDIRECT_URI || "",
    code,
    grant_type: "authorization_code",
    code_verifier: attempt.codeVerifier,
  });

  const tokenRes = await fetch(`https://api.twitter.com/2/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    await attemptRef.delete().catch(() => {});
    return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=token_exchange_failed`);
  }

  const now = admin.firestore.Timestamp.now();

  // Upsert integration doc
  const integrationId = `social_x_${workspaceId}`;
  await adminDb.collection("integrations").doc(integrationId).set(
    {
      workspaceId,
      type: "social",
      platform: "x",
      status: "connected",
      grantedScopes: (tokenJson.scope ? String(tokenJson.scope).split(" ") : []),
      connectedByUid: attempt.createdByUid,
      connectedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  // Store encrypted tokens server-only
  const encrypted = encryptToken(JSON.stringify(tokenJson));
  await adminDb.collection("integration_secrets").doc(integrationId).set(
    {
      workspaceId,
      platform: "x",
      token: encrypted,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );

  // Update onboarding snapshot
  await adminDb.collection("workspace_onboarding").doc(workspaceId).set(
    {
      "integrations.social.statusByPlatform.x": { status: "connected" },
      "integrations.social.connectedPlatforms": admin.firestore.FieldValue.arrayUnion("x"),
      "integrations.social.updatedAt": now,
    },
    { merge: true }
  );

  await attemptRef.delete().catch(() => {});

  return NextResponse.redirect(`${process.env.APP_URL}/app/${workspaceId}/onboarding`);
}
