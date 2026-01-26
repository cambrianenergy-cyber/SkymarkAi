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

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = Timestamp.now();
    const schedulesRef = db.collection("workflow_schedules");

    // Find schedules that need to run
    const snapshot = await schedulesRef
      .where("enabled", "==", true)
      .where("nextRun", "<=", now)
      .get();

    const results: any[] = [];

    for (const doc of snapshot.docs) {
      const scheduleData = doc.data();

      try {
        // Get workflow
        const workflowSnap = await db.collection("workflows").doc(scheduleData.workflowId).get();

        if (!workflowSnap.exists) {
          results.push({ scheduleId: doc.id, success: false, message: "Workflow not found" });
          continue;
        }

        const workflowData = workflowSnap.data()!;

        // Create run
        const runSteps = (workflowData.steps || []).map((step: any) => ({
          stepId: step.stepId,
          order: step.order,
          agentType: step.agentType,
          instruction: step.instruction,
          status: "pending",
        }));

        const runRef = await db.collection("workflow_runs").add({
          workspaceId: scheduleData.workspaceId,
          workflowId: scheduleData.workflowId,
          workflowName: scheduleData.workflowName,
          runType: "scheduled",
          status: "queued",
          createdByUid: "system",
          createdByName: "Scheduled Run",
          inputs: {},
          outputs: {},
          steps: runSteps,
          progress: {
            totalSteps: runSteps.length,
            completedSteps: 0,
            currentStepOrder: 0,
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Update schedule
        const nextRun = calculateNextRun(scheduleData.schedule);
        await schedulesRef.doc(doc.id).update({
          lastRun: now,
          nextRun: nextRun,
          updatedAt: Timestamp.now(),
        });

        // Trigger execution via orchestrator API
        const executeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/orchestrator/execute`;
        const executeResponse = await fetch(executeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: runRef.id, action: "executeAll" }),
        });

        const executeResult = await executeResponse.json();

        results.push({
          scheduleId: doc.id,
          runId: runRef.id,
          success: executeResult.success,
          message: executeResult.message,
        });
      } catch (error: any) {
        console.error(`Error executing schedule ${doc.id}:`, error);
        results.push({
          scheduleId: doc.id,
          success: false,
          message: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} schedules`,
      results,
    });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

function calculateNextRun(cronSchedule: string): Timestamp {
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
