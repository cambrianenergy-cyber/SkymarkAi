import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type SocialConnection from "./types/socialConnection";

// Create or update a social connection
type ConnectionInput = Omit<SocialConnection, "id" | "lastChecked"> & { lastChecked?: number };
export async function upsertSocialConnection(input: ConnectionInput) {
  const id = `${input.userId}_${input.platform}`;
  const ref = doc(db, "connections", id);
  const data: SocialConnection = {
    ...input,
    id,
    lastChecked: input.lastChecked || Date.now(),
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

// Get a social connection by user/platform
export async function getSocialConnection(userId: string, platform: string) {
  const id = `${userId}_${platform}`;
  const ref = doc(db, "connections", id);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SocialConnection) : null;
}

// Mark connection as expired
export async function expireSocialConnection(userId: string, platform: string) {
  const id = `${userId}_${platform}`;
  const ref = doc(db, "connections", id);
  await updateDoc(ref, { status: "expired", lastChecked: Date.now() });
}

// Mark connection as revoked
export async function revokeSocialConnection(userId: string, platform: string) {
  const id = `${userId}_${platform}`;
  const ref = doc(db, "connections", id);
  await updateDoc(ref, { status: "revoked", lastChecked: Date.now() });
}

// Refresh token (stub, to be implemented per platform)
export async function refreshSocialToken(userId: string, platform: string) {
  // TODO: Implement platform-specific refresh logic
  throw new Error("Not implemented");
}
