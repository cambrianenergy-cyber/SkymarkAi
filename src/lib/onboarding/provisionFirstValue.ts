import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";

export async function provisionFirstValueTx(tx: FirebaseFirestore.Transaction, workspaceId: string, uid: string, primaryOutcome: string) {
  const now = admin.firestore.Timestamp.now();

  // Agent template (minimal)
  const agentRef = adminDb.collection("agents").doc();
  tx.set(agentRef, {
    workspaceId,
    name: primaryOutcome === "sales" ? "Sales Follow-up Agent" :
          primaryOutcome === "support" ? "Support Inbox Agent" :
          "Uqentra Starter Agent",
    type: "starter",
    instructions: `You are a starter agent for ${primaryOutcome}.`,
    createdByUid: uid,
    createdAt: now,
    updatedAt: now,
  });

  // Workflow template (minimal)
  const wfRef = adminDb.collection("workflows").doc();
  tx.set(wfRef, {
    workspaceId,
    name: primaryOutcome === "sales" ? "Lead Follow-up Quickstart" :
          primaryOutcome === "support" ? "Inbox Triage Quickstart" :
          "Quickstart Workflow",
    type: "starter",
    steps: [],
    createdByUid: uid,
    createdAt: now,
    updatedAt: now,
  });

  // Optional notification
  const notifRef = adminDb.collection("notifications").doc();
  tx.set(notifRef, {
    workspaceId,
    type: "onboarding.provisioned",
    title: "Quickstart created",
    body: "We created a starter agent + workflow for you.",
    createdAt: now,
    read: false,
  });
}
