import admin from "firebase-admin";

function ensureAdminApp() {
  if (admin.apps && admin.apps.length > 0) return admin.app();

  // Prefer FIREBASE_SERVICE_ACCOUNT for self-contained JSON; otherwise use ADC.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    return admin.app();
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

  return admin.app();
}

export function getAdminApp() {
  return ensureAdminApp();
}

export const adminApp = ensureAdminApp();
export const adminAuth = admin.auth(adminApp);
export const db = admin.firestore(adminApp);
export const adminDb = db;

export function getFirestore() {
  return adminDb;
}

export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
export type FirestoreTimestamp = admin.firestore.Timestamp;
export default admin;
