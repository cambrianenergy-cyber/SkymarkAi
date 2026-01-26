
// @ts-nocheck
import { NextResponse } from "next/server";
import { AI_COLLECTIONS, validate } from "../../../lib/aiCollections.firestore";
import {
  ToolRegistryDoc,
  ExecutionPolicyDoc,
  WorkflowTemplateDoc,
} from "../../../lib/aiCollections.schemas";
import { adminDb, adminFieldValue } from "../../../lib/firebaseAdmin";

function now() {
  return adminFieldValue.serverTimestamp();
}

export async function POST(req: Request) {
  try {
    const { workspaceId, actorUid } = await req.json();

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });
    }

    // 1) Seed default execution policy
    const policyId = "default";
    const policyData = validate(ExecutionPolicyDoc, {
      workspaceId,
      policyKey: "default",
      name: "Default Policy",
      description: "Baseline governance for orchestrator runs",
      createdAt: now(),
      updatedAt: now(),
      isEnabled: true,
    });

    await adminDb.collection(AI_COLLECTIONS.execution_policies).doc(`${workspaceId}_${policyId}`).set(policyData, { merge: true });

    // 2) Seed a couple core tools in tool_registry
    const tools = [
      {
        toolKey: "core.noop",
        version: "1.0.0",
        displayName: "No-op",
        description: "A safe tool that does nothing (health checks).",
        category: "core",
        allowedRoles: ["owner", "admin", "member", "viewer"],
        risk: "low",
        inputSchema: {},
        outputSchema: { ok: true },
        timeoutMs: 5000,
        isEnabled: true,
      },
      {
        toolKey: "core.notify",
        version: "1.0.0",
        displayName: "Notify",
        description: "Create an in-app notification.",
        category: "core",
        allowedRoles: ["owner", "admin", "member"],
        risk: "low",
        inputSchema: { title: "string", body: "string" },
        outputSchema: { notificationId: "string" },
        timeoutMs: 15000,
        isEnabled: true,
      },
    ];

    for (const t of tools) {
      const toolData = validate(ToolRegistryDoc, {
        workspaceId,
        ...t,
        createdAt: now(),
        updatedAt: now(),
      });

      await adminDb.collection(AI_COLLECTIONS.tool_registry).doc(`${workspaceId}_${t.toolKey}`).set(toolData, { merge: true });
    }

    // 3) Seed a starter workflow template
    const templateData = validate(WorkflowTemplateDoc, {
      workspaceId,
      templateKey: "starter_run",
      version: "1.0.0",
      name: "Starter: Run a Simple Workflow",
      description: "A minimal example workflow template.",
      allowedRoles: ["owner", "admin", "member"],
      isPublished: false,
      definition: {
        steps: [
          { id: "start", type: "system", prompt: "Start run" },
          { id: "end", type: "system", prompt: "Finish run" },
        ],
      },
      tags: ["starter", "example"],
      createdAt: now(),
      updatedAt: now(),
    });

    await adminDb.collection(AI_COLLECTIONS.workflow_templates).doc(`${workspaceId}_starter_run`).set(templateData, { merge: true });

    return NextResponse.json({
      ok: true,
      workspaceId,
      seeded: {
        execution_policies: [`${workspaceId}_${policyId}`],
        tool_registry: tools.map(t => `${workspaceId}_${t.toolKey}`),
        workflow_templates: [`${workspaceId}_starter_run`],
      },
      actorUid: actorUid ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
