import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/instagram/callback`;
    // Exchange code for access token
    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const accessToken = tokenRes.data.access_token;
    // Fetch user profile
    let profile = null;
    try {
      const profileRes = await axios.get('https://graph.instagram.com/me', {
        params: { access_token: accessToken, fields: 'id,username,account_type' },
      });
      profile = profileRes.data;
    } catch {}
    // Store accessToken in Firestore via internal API
    if (req.cookies && req.cookies.workspaceId && req.cookies.userId) {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/store-token`, {
        workspaceId: req.cookies.workspaceId,
        userId: req.cookies.userId,
        platform: 'instagram',
        accessToken,
        profile,
      });
    }
    // Redirect to onboarding with success notification
    res.redirect(`/app/onboarding?connected=instagram`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
