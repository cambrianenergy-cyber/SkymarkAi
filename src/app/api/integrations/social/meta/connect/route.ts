import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";

const META_CLIENT_ID = process.env.META_CLIENT_ID || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";
const META_SCOPES = "email,public_profile";

export async function POST(req: Request) {
  const session = await requireSession(req);
  const { workspaceId } = await req.json();
  if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });

  // Construct Meta OAuth URL
  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_CLIENT_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&state=${workspaceId}&scope=${META_SCOPES}`;
  return NextResponse.json({ ok: true, url });
}
