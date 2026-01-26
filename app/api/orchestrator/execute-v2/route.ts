import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import path from "path";
import { executeWorkflowRun } from "@/src/workers/orchestrator";
import { makeFirestoreDB } from "@/src/workers/firestoreDbAdapter";
import { agentRunner } from "@/src/workers/agentRunner";

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), "Web", "Secrets", "serviceAccountKey.json");
  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

/**
 * POST /api/orchestrator/execute-v2
 * 
 * Body: { workspaceId: string, runId: string, environment?: "dev" | "staging" | "prod" }
 * 
 * Executes a workflow run using the new orchestrator engine.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, runId, environment = "prod" } = body;

    if (!workspaceId || !runId) {
      return NextResponse.json(
        { success: false, message: "workspaceId and runId are required" },
        { status: 400 }
      );
    }

    // Initialize database adapter
    const db = makeFirestoreDB();

    // Execute the workflow run
    const result = await executeWorkflowRun({
      db,
      agentRunner,
      workspaceId,
      runId,
      options: {
        environment: environment as any,
        source: "server",
        defaultTimeoutMs: 60_000,
        defaultRetryMax: 2,
        hardMaxWallMs: 10 * 60_000, // 10 minutes
      },
    });

    return NextResponse.json({
      success: result.ok,
      status: result.status,
      message: result.ok
        ? `Workflow run ${result.status}`
        : `Workflow run ${result.status}`,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server error",
        error: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orchestrator/execute-v2?runId=xxx
 * 
 * Get the status of a workflow run
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");
    const workspaceId = searchParams.get("workspaceId");

    if (!runId || !workspaceId) {
      return NextResponse.json(
        { success: false, message: "runId and workspaceId are required" },
        { status: 400 }
      );
    }

    const db = makeFirestoreDB();
    const run = await db.getWorkflowRun(runId, workspaceId);

    if (!run) {
      return NextResponse.json(
        { success: false, message: "Run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      run: {
        id: run.id,
        workflowId: run.workflowId,
        status: run.status,
        currentStepIndex: run.currentStepIndex,
        usage: run.usage,
        error: run.error,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
