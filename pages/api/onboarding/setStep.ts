// API route to set onboarding step, with RBAC check
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Initialize firebase-admin if not already
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Helper to get user role from users/{uid}.role
async function getUserRole(userId: string): Promise<string | null> {
  const userSnap = await db.collection('users').doc(userId).get();
  return userSnap.exists ? userSnap.data()?.role || null : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, step } = req.body;
  if (!userId || !step) return res.status(400).json({ error: 'Missing userId or step' });
  const role = await getUserRole(userId);
  if (role === 'viewer') return res.status(403).json({ error: 'Viewers cannot update onboarding state' });
  await db.collection('onboarding_states').doc(userId).set({ state: step }, { merge: true });
  res.status(200).json({ ok: true });
}
