import { NextResponse } from "next/server";
import admin from "firebase-admin";
import crypto from "crypto";
import { db } from "@/lib/firebaseAdmin";
import { requireSession } from "@/lib/auth/requireSession";
import { assertWorkspaceAdminOrOwner } from "@/lib/auth/workspaceAccess";

const PROVIDER_CONFIG = {
    snapchat: {
      clientId: process.env.SNAPCHAT_CLIENT_ID,
      redirectUri: process.env.SNAPCHAT_REDIRECT_URI,
      scopes: "snapchat-marketing-api,openid,profile,email",
      authUrl: "https://accounts.snapchat.com/login/oauth2/authorize",
    },
    nextdoor: {
      clientId: process.env.NEXTDOOR_CLIENT_ID,
      redirectUri: process.env.NEXTDOOR_REDIRECT_URI,
      scopes: "public_profile,email,openid",
      authUrl: "https://api.nextdoor.com/oauth/v2/authorize",
    },
    angi: {
      clientId: process.env.ANGI_CLIENT_ID,
      redirectUri: process.env.ANGI_REDIRECT_URI,
      scopes: "profile,email,openid",
      authUrl: "https://api.angi.com/oauth2/authorize",
    },
    threads: {
      clientId: process.env.THREADS_CLIENT_ID,
      redirectUri: process.env.THREADS_REDIRECT_URI,
      scopes: "basic_profile,email,openid",
      authUrl: "https://www.threads.net/oauth/authorize",
    },
  meta: {
    clientId: process.env.META_CLIENT_ID,
    redirectUri: process.env.META_REDIRECT_URI,
    scopes: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI,
    scopes: "r_liteprofile r_emailaddress w_member_social",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
  },
  x: {
    clientId: process.env.X_CLIENT_ID,
    redirectUri: process.env.X_REDIRECT_URI,
    scopes: "tweet.read tweet.write users.read offline.access",
    authUrl: "https://twitter.com/i/oauth2/authorize",
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    redirectUri: process.env.TIKTOK_REDIRECT_URI,
    scopes: "user.info.basic,video.list,video.upload",
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI,
    scopes: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  },
};

  const session = await requireSession(req);
  const { workspaceId, platform, codeChallenge } = await req.json();
  const validPlatforms = [
    "meta", "linkedin", "x", "tiktok", "youtube",
    "snapchat", "nextdoor", "angi", "threads"
  ];
  if (!workspaceId || !platform || !validPlatforms.includes(platform)) {
    return NextResponse.json({ ok: false, error: "Invalid platform or workspaceId" }, { status: 400 });
  }
  const cfg = PROVIDER_CONFIG[platform];
  const state = crypto.randomBytes(16).toString("hex");

  // Create connect attempt doc in Firestore
  const attempt: any = {
    workspaceId,
    platform,
    createdByUid: session.uid,
    state,
    createdAt: Date.now(),
  };
  // Store codeChallenge for PKCE platforms (e.g., X)
  if (platform === "x" && codeChallenge) {
    attempt.codeVerifier = codeChallenge;
  }
  await db.collection("integration_connect_attempts").doc(state).set(attempt);

  let url;
  if (platform === "meta") {
    url = `${cfg.authUrl}?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(cfg.redirectUri)}&state=${state}&scope=${cfg.scopes}`;
  } else if (platform === "linkedin" || platform === "x" || platform === "angi" || platform === "threads") {
    url = `${cfg.authUrl}?response_type=code&client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(cfg.redirectUri)}&scope=${encodeURIComponent(cfg.scopes)}&state=${state}`;
  } else if (platform === "tiktok") {
    url = `${cfg.authUrl}?client_key=${cfg.clientId}&redirect_uri=${encodeURIComponent(cfg.redirectUri)}&scope=${encodeURIComponent(cfg.scopes)}&state=${state}&response_type=code`;
  } else if (platform === "youtube") {
    url = `${cfg.authUrl}?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(cfg.redirectUri)}&response_type=code&scope=${encodeURIComponent(cfg.scopes)}&state=${state}&access_type=offline&prompt=consent`;
  } else if (platform === "snapchat") {
    url = `${cfg.authUrl}?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(cfg.redirectUri)}&response_type=code&scope=${encodeURIComponent(cfg.scopes)}&state=${state}`;
  } else if (platform === "nextdoor") {
    url = `${cfg.authUrl}?client_id=${cfg.clientId}&redirect_uri=${encodeURIComponent(cfg.redirectUri)}&response_type=code&scope=${encodeURIComponent(cfg.scopes)}&state=${state}`;
  }
  return NextResponse.json({ ok: true, url });
}
