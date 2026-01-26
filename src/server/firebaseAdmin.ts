import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function adminDb() {
  if (!getApps().length) {
    // Store as JSON string in env; do NOT import local key in prod
    const svc = JSON.parse(requireEnv("FIREBASE_SERVICE_ACCOUNT_JSON"));
    initializeApp({
      credential: cert({
        projectId: svc.project_id,
        clientEmail: svc.client_email,
        privateKey: (svc.private_key as string).replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}
