import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function createConnectAttempt({ workspaceId, platform, createdByUid, usePKCE = false }: {
  workspaceId: string;
  platform: "meta" | "x";
  createdByUid: string;
  usePKCE?: boolean;
}) {
  const state = crypto.randomBytes(16).toString("hex");
  let codeVerifier: string | undefined;
  if (usePKCE) {
    codeVerifier = crypto.randomBytes(32).toString("hex");
  }
  const attempt = {
    workspaceId,
    platform,
    createdByUid,
    state,
    codeVerifier,
    createdAt: Date.now(),
  };
  const ref = adminDb.collection("integration_connect_attempts").doc(state);
  await ref.set(attempt);
  return { state, codeVerifier };
}
