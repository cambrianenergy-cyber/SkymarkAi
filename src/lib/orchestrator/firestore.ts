import admin from "firebase-admin";

export function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return admin;
}

export const db = () => getAdmin().firestore();
export const now = () => getAdmin().firestore.FieldValue.serverTimestamp();

export function col(path: string) {
  return db().collection(path);
}

export function doc(path: string) {
  return db().doc(path);
}
