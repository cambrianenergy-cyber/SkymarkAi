import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

function dayKey(d = new Date()) {
  // YYYY-MM-DD in UTC for consistency
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  try {
    const db = getFirestore();
    const body = await req.json();
    const { workspaceId, day } = body;

    if (!workspaceId || typeof workspaceId !== "string") throw new Error("workspaceId required");
    const targetDay = (typeof day === "string" && day.match(/^\d{4}-\d{2}-\d{2}$/)) ? day : dayKey();

    // NOTE: This simple approach scans events for the day.
    // Later: write events with a day partition field, or use scheduled jobs + incremental counters.
    const start = new Date(`${targetDay}T00:00:00.000Z`);
    const end = new Date(`${targetDay}T23:59:59.999Z`);

    const snap = await db.collection(`workspaces/${workspaceId}/events`)
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .get();

    const counts = {
      runs: { started: 0, succeeded: 0, failed: 0 },
      oauth: { connected: 0, refreshed: 0, revoked: 0 },
      leads: { created: 0, updated: 0 },
      approvals: { requested: 0, resolved: 0 },
    };

    snap.forEach(doc => {
      const t = doc.get("type") as string;
      if (t === "RUN_STARTED") counts.runs.started++;
      if (t === "RUN_SUCCEEDED") counts.runs.succeeded++;
      if (t === "RUN_FAILED") counts.runs.failed++;
      if (t === "OAUTH_CONNECTED") counts.oauth.connected++;
      if (t === "OAUTH_REFRESHED") counts.oauth.refreshed++;
      if (t === "OAUTH_REVOKED") counts.oauth.revoked++;
      if (t === "LEAD_CREATED") counts.leads.created++;
      if (t === "LEAD_UPDATED") counts.leads.updated++;
      if (t === "APPROVAL_REQUESTED") counts.approvals.requested++;
      if (t === "APPROVAL_RESOLVED") counts.approvals.resolved++;
    });

    // Pull agent health counts (fast query)
    const agentsSnap = await db.collection(`workspaces/${workspaceId}/agents`).get();
    let ok = 0, degraded = 0, down = 0;
    agentsSnap.forEach(a => {
      const h = a.get("health");
      if (h === "ok") ok++;
      else if (h === "degraded") degraded++;
      else if (h === "down") down++;
    });

    const statsRef = db.collection(`workspaces/${workspaceId}/stats/daily`).doc(targetDay);
    await statsRef.set({
      workspaceId,
      day: targetDay,
      runs: counts.runs,
      oauth: counts.oauth,
      leads: counts.leads,
      approvals: counts.approvals,
      agents: { activeCount: ok, degradedCount: degraded, downCount: down },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ ok: true, day: targetDay });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "unknown" }, { status: 400 });
  }
}
