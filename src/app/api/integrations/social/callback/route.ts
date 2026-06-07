import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { encryptToken } from "@/lib/integrations/encryption";
import { fetchMetaToken, fetchXToken } from "@/lib/integrations/social/exchange";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const code = searchParams.get("code");
  const workspaceId = searchParams.get("state");
  if (!provider || !code || !workspaceId) {
    return NextResponse.json({ ok: false, error: "Missing provider, code, or workspaceId" }, { status: 400 });
  }

  let tokenData;
  if (provider === "meta") {
    tokenData = await fetchMetaToken(code);
  } else if (provider === "x") {
    tokenData = await fetchXToken(code);
  } else {
    return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  }
  if (!tokenData?.access_token) {
    return NextResponse.json({ ok: false, error: "Token exchange failed" }, { status: 500 });
  }

  // Encrypt and store token server-only
  const encrypted = encryptToken(tokenData.access_token);
  await adminDb.collection("integration_secrets").doc(`${workspaceId}_${provider}`).set({
    encryptedToken: encrypted,
    provider,
    workspaceId,
    obtainedAt: Date.now(),
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type,
  }, { merge: true });


  // Write integrations + onboarding snapshot
  await adminDb.collection("integrations").doc(`${workspaceId}_${provider}`).set({
    workspaceId,
    provider,
    status: "connected",
    updatedAt: Date.now(),
  });

  // Update onboarding snapshot: recalc connectedPlatforms, connectedCount, deferred, statusByPlatform
  const onboardingRef = adminDb.collection("workspace_onboarding").doc(workspaceId);
  const onboardingSnap = await onboardingRef.get();
  let connectedPlatforms = [provider];
  let statusByPlatform: any = { [provider]: { status: "connected" } };
  let deferred = false;
  if (onboardingSnap.exists) {
    const onboarding = onboardingSnap.data();
    let prev = {};
    if (onboarding && typeof onboarding === 'object' && 'integrations' in onboarding && onboarding.integrations && typeof onboarding.integrations === 'object' && 'social' in onboarding.integrations) {
      prev = onboarding.integrations.social || {};
    }
    const prevConnectedPlatforms = (prev && typeof prev === 'object' && 'connectedPlatforms' in prev && Array.isArray(prev.connectedPlatforms)) ? prev.connectedPlatforms : [];
    connectedPlatforms = Array.from(new Set([...prevConnectedPlatforms, provider]));
    const prevStatusByPlatform = (prev && typeof prev === 'object' && 'statusByPlatform' in prev && prev.statusByPlatform && typeof prev.statusByPlatform === 'object') ? prev.statusByPlatform : {};
    statusByPlatform = { ...prevStatusByPlatform, [provider]: { status: "connected" } };
    deferred = (prev && typeof prev === 'object' && 'deferred' in prev && !!prev.deferred && connectedPlatforms.length === 0);
  }
  const connectedCount = connectedPlatforms.length;
  await onboardingRef.set({
    "integrations.social.statusByPlatform": statusByPlatform,
    "integrations.social.connectedPlatforms": connectedPlatforms,
    "integrations.social.connectedCount": connectedCount,
    "integrations.social.deferred": deferred,
    "integrations.social.updatedAt": Date.now(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
