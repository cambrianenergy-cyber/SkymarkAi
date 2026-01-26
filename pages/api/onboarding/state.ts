
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from "@lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const ref = db.collection('onboarding_states').doc(userId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(200).json({ state: 'profile' });
    const data = snap.data();
    res.status(200).json({ state: (data && data.state) ? data.state : 'profile' });
  } catch (err: any) {
    console.error('Error in onboarding state API:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || err });
  }
}
