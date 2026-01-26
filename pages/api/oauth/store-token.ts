import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { workspaceId, userId, platform, accessToken, profile } = req.body;
  if (!workspaceId || !userId || !platform || !accessToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const db = getFirestore();
    await db.collection('workspace_social_accounts').add({
      workspaceId,
      userId,
      platform,
      accessToken,
      profile: profile || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(200).json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
