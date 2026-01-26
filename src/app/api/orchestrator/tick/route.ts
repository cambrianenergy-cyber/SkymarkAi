import { NextResponse } from "next/server";
import { claimNextTask, runOneTask } from "@/lib/orchestrator/runner";

export const runtime = "nodejs"; // IMPORTANT for firebase-admin

export async function POST(req: Request) {
  // Optional: protect with a secret header
  const secret = process.env.ORCHESTRATOR_SECRET;
  const got = req.headers.get("x-orchestrator-secret");
  if (secret && got !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const task = await claimNextTask();
  if (!task) {
    return NextResponse.json({ ok: true, ran: false, message: "No queued tasks" });
  }

  await runOneTask(task);

  return NextResponse.json({
    ok: true,
    ran: true,
    taskId: task.taskId,
    workspaceId: task.workspaceId,
    agentId: task.agentId,
  });
}
