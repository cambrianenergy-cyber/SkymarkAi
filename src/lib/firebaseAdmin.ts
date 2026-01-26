import * as admin from "firebase-admin";

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });

export const adminDb = admin.firestore();
export const adminFieldValue = admin.firestore.FieldValue;
