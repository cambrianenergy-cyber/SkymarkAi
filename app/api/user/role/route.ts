import { NextResponse } from "next/server";
import { db } from "@lib/firebaseAdmin";
import { requireAuth } from "@lib/requireAuth";

/**
 * GET /api/user/role?userId=<uid>&workspaceId=<ws>
 * Returns:
 * - global role info (founder claim if you use it)
 * - workspace role (owner/admin/member/viewer) if workspaceId provided
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const workspaceId = url.searchParams.get("workspaceId");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
    }

    // Require auth so random people can't query roles
    let authed;
    try {
      authed = await requireAuth(req);
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message || "Unauthorized" }, { status: 401 });
    }
    const isSelf = authed.uid === userId;
    if (!isSelf) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Use Firestore admin
    const userSnap = await db.collection("users").doc(userId).get();
    const user = userSnap.exists ? userSnap.data() : null;

    let workspaceRole: string | null = null;
    if (workspaceId) {
      const memberId = `${workspaceId}_${userId}`;
      const memberSnap = await db.collection("workspace_members").doc(memberId).get();
      workspaceRole = memberSnap.exists ? memberSnap.data()?.role || null : null;
    }

    return NextResponse.json({ ok: true, user, workspaceRole });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Unknown error" }, { status: 500 });
  }
}
