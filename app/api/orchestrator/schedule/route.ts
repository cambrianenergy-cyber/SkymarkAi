import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import path from "path";

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), "Web", "Secrets", "serviceAccountKey.json");
  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, schedule, enabled } = body;

    if (!workflowId) {
      return NextResponse.json({ success: false, message: "workflowId is required" }, { status: 400 });
    }

    // Get workflow
    const workflowRef = db.collection("workflows").doc(workflowId);
    const workflowSnap = await workflowRef.get();

    if (!workflowSnap.exists) {
      return NextResponse.json({ success: false, message: "Workflow not found" }, { status: 404 });
    }

    const workflowData = workflowSnap.data()!;

    // Create or update schedule
    const scheduleData = {
      workflowId,
      workspaceId: workflowData.workspaceId,
      workflowName: workflowData.name,
      schedule: schedule || "0 9 * * *", // Default: 9 AM daily
      enabled: enabled !== undefined ? enabled : true,
      lastRun: null,
      nextRun: calculateNextRun(schedule || "0 9 * * *"),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const schedulesRef = db.collection("workflow_schedules");
    const existingQuery = await schedulesRef.where("workflowId", "==", workflowId).get();

    if (!existingQuery.empty) {
      // Update existing
      const docId = existingQuery.docs[0].id;
      await schedulesRef.doc(docId).update({
        schedule: scheduleData.schedule,
        enabled: scheduleData.enabled,
        nextRun: scheduleData.nextRun,
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json({ success: true, message: "Schedule updated", scheduleId: docId });
    } else {
      // Create new
      const docRef = await schedulesRef.add(scheduleData);
      return NextResponse.json({ success: true, message: "Schedule created", scheduleId: docRef.id });
    }
  } catch (error: any) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const workspaceId = searchParams.get("workspaceId");

    let query = db.collection("workflow_schedules");

    if (workflowId) {
      const snapshot = await query.where("workflowId", "==", workflowId).get();
      const schedules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, schedules });
    } else if (workspaceId) {
      const snapshot = await query.where("workspaceId", "==", workspaceId).get();
      const schedules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, schedules });
    } else {
      return NextResponse.json(
        { success: false, message: "workflowId or workspaceId is required" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Schedule GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json({ success: false, message: "scheduleId is required" }, { status: 400 });
    }

    await db.collection("workflow_schedules").doc(scheduleId).delete();
    return NextResponse.json({ success: true, message: "Schedule deleted" });
  } catch (error: any) {
    console.error("Schedule DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

function calculateNextRun(cronSchedule: string): Timestamp {
  // Simple cron parser for common patterns
  // Format: minute hour day month dayOfWeek
  const parts = cronSchedule.split(" ");
  const minute = parseInt(parts[0]) || 0;
  const hour = parseInt(parts[1]) || 9;

  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return Timestamp.fromDate(next);
}
