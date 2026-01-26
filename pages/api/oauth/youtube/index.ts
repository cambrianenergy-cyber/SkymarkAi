import type { NextApiRequest, NextApiResponse } from 'next';

// This is a placeholder for the YouTube OAuth handler
// In production, use a secure OAuth library and store secrets in environment variables

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Step 1: Redirect user to Google's OAuth URL for YouTube
  if (req.method === 'GET') {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/youtube/callback`;
    const state = Math.random().toString(36).substring(2); // Use a real CSRF token in production
    const scope = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ].join(' ');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&state=${state}&prompt=consent`;
    res.redirect(googleAuthUrl);
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}
