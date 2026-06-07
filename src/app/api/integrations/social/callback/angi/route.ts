
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
  const attemptSnap = await attemptRef.get(); // attemptRef is a DocumentReference

  if (!attemptSnap.exists) return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=invalid_attempt`);
  const attempt = attemptSnap.data() as any;
  if (attempt.state !== state || attempt.workspaceId !== workspaceId || attempt.platform !== "angi") {
    return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=state_mismatch`);
  }

  // Exchange code for token (Angi)
  const tokenParams = new URLSearchParams({
    client_id: process.env.ANGI_CLIENT_ID || "",
    client_secret: process.env.ANGI_CLIENT_SECRET || "",
    redirect_uri: process.env.ANGI_REDIRECT_URI || "",
    code,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(`https://api.angi.com/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    // Delete the attempt document if token exchange fails
    await adminDb.collection("integration_connect_attempts").doc(attemptId).delete().catch(() => {});
    return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=token_exchange_failed`);
  }

  const now = admin.firestore.Timestamp.now();
  const integrationId = `social_angi_${workspaceId}`;
  await adminDb.collection("integrations").doc(integrationId).set(
    {
      workspaceId,
      type: "social",
      platform: "angi",
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
      platform: "angi",
      token: encrypted,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );

  // Update onboarding snapshot
  await adminDb.collection("workspace_onboarding").doc(workspaceId).set(
    {
      "integrations.social.statusByPlatform.angi": { status: "connected" },
      "integrations.social.connectedPlatforms": admin.firestore.FieldValue.arrayUnion("angi"),
      "integrations.social.updatedAt": now,
    },
    { merge: true }
  );

  // Delete the attempt document after successful integration
  await adminDb.collection("integration_connect_attempts").doc(attemptId).delete().catch(() => {});

  return NextResponse.redirect(`${process.env.APP_URL}/app/${workspaceId}/onboarding`);
}
