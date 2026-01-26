import type { NextApiRequest, NextApiResponse } from 'next';

// LinkedIn OAuth initiation endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/linkedin/callback`;
    const state = Math.random().toString(36).substring(2);
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    res.redirect(linkedinAuthUrl);
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}
