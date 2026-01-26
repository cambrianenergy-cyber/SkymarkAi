import type { NextApiRequest, NextApiResponse } from 'next';

// Instagram OAuth initiation endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/instagram/callback`;
    const state = Math.random().toString(36).substring(2);
    const scope = 'user_profile,user_media';
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;
    res.redirect(instagramAuthUrl);
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}
