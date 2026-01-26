/**
 * Audit Logging Utility
 * 
 * Logs important user actions to audit_logs collection for traceability.
 * Use this for compliance, debugging, and security monitoring.
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface AuditLogData {
  workspaceId: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
}

/**
 * Log an action to the audit trail
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await addDoc(collection(db, "audit_logs"), {
      ...data,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Don't throw - audit logging should not break user actions
  }
}

/**
 * Pre-defined audit actions for consistency
 */
export const AuditActions = {
  // Workflows
  WORKFLOW_CREATED: "workflow.created",
  WORKFLOW_UPDATED: "workflow.updated",
  WORKFLOW_DELETED: "workflow.deleted",
  WORKFLOW_RUN_STARTED: "workflow.run.started",
  WORKFLOW_RUN_COMPLETED: "workflow.run.completed",
  WORKFLOW_RUN_FAILED: "workflow.run.failed",
  
  // Templates
  TEMPLATE_INSTALLED: "template.installed",
  TEMPLATE_UNINSTALLED: "template.uninstalled",
  
  // Agents
  AGENT_CREATED: "agent.created",
  AGENT_UPDATED: "agent.updated",
  AGENT_ACTIVATED: "agent.activated",
  AGENT_DEACTIVATED: "agent.deactivated",
  AGENT_DELETED: "agent.deleted",
  
  // Campaigns
  CAMPAIGN_CREATED: "campaign.created",
  CAMPAIGN_UPDATED: "campaign.updated",
  CAMPAIGN_LAUNCHED: "campaign.launched",
  CAMPAIGN_PAUSED: "campaign.paused",
  CAMPAIGN_DELETED: "campaign.deleted",
  
  // Content & Schedule
  ASSET_CREATED: "asset.created",
  ASSET_DELETED: "asset.deleted",
  POST_SCHEDULED: "post.scheduled",
  POST_PUBLISHED: "post.published",
  POST_CANCELED: "post.canceled",
  
  // Leads & Inbox
  THREAD_CREATED: "thread.created",
  THREAD_CONVERTED_TO_LEAD: "thread.converted_to_lead",
  LEAD_CREATED: "lead.created",
  LEAD_UPDATED: "lead.updated",
  LEAD_STATUS_CHANGED: "lead.status_changed",
  FOLLOWUP_CREATED: "followup.created",
  FOLLOWUP_SENT: "followup.sent",
  FOLLOWUP_CANCELED: "followup.canceled",
  
  // Workspace & Team
  WORKSPACE_CREATED: "workspace.created",
  WORKSPACE_UPDATED: "workspace.updated",
  MEMBER_INVITED: "member.invited",
  MEMBER_JOINED: "member.joined",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  
  // Billing
  SUBSCRIPTION_CREATED: "billing.subscription_created",
  SUBSCRIPTION_UPDATED: "billing.subscription_updated",
  SUBSCRIPTION_CANCELED: "billing.subscription_canceled",
  PLAN_UPGRADED: "billing.plan_upgraded",
  PLAN_DOWNGRADED: "billing.plan_downgraded",
  
  // Security
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  PASSWORD_CHANGED: "auth.password_changed",
} as const;

/**
 * Entity types for audit logs
 */
export const AuditEntityTypes = {
  WORKFLOW: "workflow",
  WORKFLOW_RUN: "workflow_run",
  TEMPLATE: "template",
  AGENT: "agent",
  CAMPAIGN: "campaign",
  ASSET: "asset",
  POST: "post",
  THREAD: "thread",
  LEAD: "lead",
  FOLLOWUP: "followup",
  WORKSPACE: "workspace",
  MEMBER: "member",
  SUBSCRIPTION: "subscription",
} as const;

/**
 * Helper: Log workflow action
 */
export async function logWorkflowAction(
  workspaceId: string,
  actorUid: string,
  action: string,
  workflowId: string,
  details?: Record<string, any>
) {
  await logAudit({
    workspaceId,
    actorUid,
    action,
    entityType: AuditEntityTypes.WORKFLOW,
    entityId: workflowId,
    details,
  });
}

/**
 * Helper: Log lead action
 */
export async function logLeadAction(
  workspaceId: string,
  actorUid: string,
  action: string,
  leadId: string,
  details?: Record<string, any>
) {
  await logAudit({
    workspaceId,
    actorUid,
    action,
    entityType: AuditEntityTypes.LEAD,
    entityId: leadId,
    details,
  });
}

/**
 * Helper: Log billing action
 */
export async function logBillingAction(
  workspaceId: string,
  actorUid: string,
  action: string,
  details?: Record<string, any>
) {
  await logAudit({
    workspaceId,
    actorUid,
    action,
    entityType: AuditEntityTypes.SUBSCRIPTION,
    entityId: workspaceId,
    details,
  });
}
