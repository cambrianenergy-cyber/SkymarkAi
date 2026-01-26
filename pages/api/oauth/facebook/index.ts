import type { NextApiRequest, NextApiResponse } from 'next';

// This is a placeholder for the Facebook OAuth handler
// In production, use a secure OAuth library and store secrets in environment variables

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Step 1: Redirect user to Facebook's OAuth URL
  if (req.method === 'GET') {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/facebook/callback`;
    const state = Math.random().toString(36).substring(2); // Use a real CSRF token in production
    const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts`;
    res.redirect(facebookAuthUrl);
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}
