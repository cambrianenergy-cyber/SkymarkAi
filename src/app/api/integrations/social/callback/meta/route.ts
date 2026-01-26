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
  if (attempt.state !== state || attempt.workspaceId !== workspaceId || attempt.platform !== "meta") {
    return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=state_mismatch`);
  }

  // Exchange code for token (Meta)
  const tokenParams = new URLSearchParams({
    client_id: process.env.META_CLIENT_ID || "",
    client_secret: process.env.META_CLIENT_SECRET || "",
    redirect_uri: process.env.META_REDIRECT_URI || "",
    code,
  });

  const tokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`, {
    method: "GET",
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    await attemptRef.delete().catch(() => {});
    return NextResponse.redirect(`${process.env.APP_URL}/onboarding?error=token_exchange_failed`);
  }

  const now = admin.firestore.Timestamp.now();

  // Upsert integration doc
  const integrationId = `social_meta_${workspaceId}`;
  await adminDb.collection("integrations").doc(integrationId).set(
    {
      workspaceId,
      type: "social",
      platform: "meta",
      status: "connected",
      grantedScopes: (tokenJson.scope ? String(tokenJson.scope).split(",") : []),
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
      platform: "meta",
      token: encrypted,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );


  // Update onboarding snapshot: recalc connectedCount and set deferred
  const onboardingRef = adminDb.collection("workspace_onboarding").doc(workspaceId);
  const onboardingSnap = await onboardingRef.get();
  let connectedPlatforms: string[] = ["meta"];
  let statusByPlatform: any = { meta: { status: "connected" } };
  let deferred = false;
  if (onboardingSnap.exists) {
    const onboarding = onboardingSnap.data();
    // Merge with any existing connected platforms
    const prev = onboarding?.integrations?.social || {};
    connectedPlatforms = Array.isArray(prev.connectedPlatforms)
      ? Array.from(new Set([...prev.connectedPlatforms, "meta"]))
      : ["meta"];
    statusByPlatform = { ...(prev.statusByPlatform || {}), meta: { status: "connected" } };
    deferred = !!prev.deferred && connectedPlatforms.length === 0;
  }
  const connectedCount = connectedPlatforms.length;
  await onboardingRef.set(
    {
      "integrations.social.statusByPlatform": statusByPlatform,
      "integrations.social.connectedPlatforms": connectedPlatforms,
      "integrations.social.connectedCount": connectedCount,
      "integrations.social.deferred": deferred,
      "integrations.social.updatedAt": now,
    },
    { merge: true }
  );

  await attemptRef.delete().catch(() => {});

  return NextResponse.redirect(`${process.env.APP_URL}/app/${workspaceId}/onboarding`);
}
