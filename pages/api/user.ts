import type { NextApiRequest, NextApiResponse } from 'next';

// Minimal user endpoint (mock user)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      id: 'user_123',
      name: 'Demo User',
      email: 'demo@example.com',
      onboarding: 'not_started',
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
