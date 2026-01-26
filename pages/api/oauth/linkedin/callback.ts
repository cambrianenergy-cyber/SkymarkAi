import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/linkedin/callback`;
    // Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const accessToken = tokenRes.data.access_token;
    // Fetch user profile
    let profile = null;
    try {
      const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      profile = profileRes.data;
    } catch {}
    // Store accessToken in Firestore via internal API
    if (req.cookies && req.cookies.workspaceId && req.cookies.userId) {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/store-token`, {
        workspaceId: req.cookies.workspaceId,
        userId: req.cookies.userId,
        platform: 'linkedin',
        accessToken,
        profile,
      });
    }
    // Redirect to onboarding with success notification
    res.redirect(`/app/onboarding?connected=linkedin`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
