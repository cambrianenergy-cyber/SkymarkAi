import fetch from "node-fetch";


const META_CLIENT_ID = process.env.META_CLIENT_ID || "";
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";

export async function fetchMetaToken(code: string) {
  const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_CLIENT_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${META_CLIENT_SECRET}&code=${code}`);
  return await res.json();
}


const X_CLIENT_ID = process.env.X_CLIENT_ID || "";
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET || "";
const X_REDIRECT_URI = process.env.X_REDIRECT_URI || "";

export async function fetchXToken(code: string) {
  const res = await fetch(`https://api.twitter.com/2/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `client_id=${X_CLIENT_ID}&client_secret=${X_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(X_REDIRECT_URI)}`,
  });
  return await res.json();
}
