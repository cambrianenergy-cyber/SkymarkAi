import fetch from "node-fetch";

export async function fetchMetaToken(code: string) {
  const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.META_REDIRECT_URI)}&client_secret=${process.env.META_CLIENT_SECRET}&code=${code}`);
  return await res.json();
}

export async function fetchXToken(code: string) {
  const res = await fetch(`https://api.twitter.com/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `client_id=${process.env.X_CLIENT_ID}&client_secret=${process.env.X_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(process.env.X_REDIRECT_URI)}`,
  });
  return await res.json();
}
