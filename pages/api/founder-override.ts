import type { NextApiRequest, NextApiResponse } from 'next';
import { founderEmergencyOverride } from '../../src/lib/orchestrator/founderOverride';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await founderEmergencyOverride(req.body);
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
}
