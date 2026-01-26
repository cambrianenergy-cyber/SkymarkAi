import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// This is a placeholder for the Facebook OAuth callback handler
// In production, use a secure OAuth library and store secrets in environment variables

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }
  try {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/facebook/callback`;
    // Exchange code for access token
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      },
    });
    const accessToken = tokenRes.data.access_token;
    // Optionally, fetch user profile here
    let profile = null;
    try {
      const profileRes = await axios.get('https://graph.facebook.com/me', {
        params: { access_token: accessToken, fields: 'id,name,email' },
      });
      profile = profileRes.data;
    } catch {}
    // Store accessToken in Firestore via internal API
    if (req.cookies && req.cookies.workspaceId && req.cookies.userId) {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/store-token`, {
        workspaceId: req.cookies.workspaceId,
        userId: req.cookies.userId,
        platform: 'facebook',
        accessToken,
        profile,
      });
    }
    // Redirect to onboarding with success notification
    res.redirect(`/app/onboarding?connected=facebook`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
