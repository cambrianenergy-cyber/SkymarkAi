import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../src/lib/orchestrator/firestore';
import { writeToDeadLetterQueue } from '../../lib/deadLetterQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workspaceId } = req.query;
  if (!workspaceId || typeof workspaceId !== 'string') {
    await writeToDeadLetterQueue({
      type: 'webhook_validation',
      payload: { workspaceId: workspaceId ?? null, reqQuery: req.query },
      error: 'Missing workspaceId',
    });
    return res.status(400).json({ error: 'Missing workspaceId' });
  }
  try {
    const snapshot = await db()
      .collection('workspace_knowledge')
      .where('workspaceId', '==', workspaceId)
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();
    const knowledge = snapshot.docs.map(d => d.data());
    res.status(200).json({ knowledge });
  } catch (error) {
    await writeToDeadLetterQueue({
      type: 'webhook_processing',
      payload: { workspaceId, reqQuery: req.query },
      error: (error as Error).message,
    });
    res.status(500).json({ error: (error as Error).message });
  }
}
