/**
 * Compliance Reporting Utility
 *
 * Generates compliance reports from audit logs for security, privacy, and operational review.
 * Can be scheduled or run on-demand by admins.
 */

import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface ComplianceReportOptions {
  workspaceId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ComplianceReport {
  workspaceId: string;
  period: { start: Date; end: Date };
  totalActions: number;
  actionsByType: Record<string, number>;
  lastLogin?: string;
  lastConfigChange?: string;
  lastPermissionChange?: string;
  securityEvents: Array<any>;
  anomalies: Array<string>;
}

export async function generateComplianceReport(options: ComplianceReportOptions): Promise<ComplianceReport> {
  const { workspaceId, startDate, endDate } = options;
  const logsRef = collection(db, "audit_logs");
  let q = query(logsRef, where("workspaceId", "==", workspaceId));
  // Optionally filter by date
  // ... (add date filtering if needed)
  const snapshot = await getDocs(q);
  const actionsByType: Record<string, number> = {};
  let lastLogin = undefined;
  let lastConfigChange = undefined;
  let lastPermissionChange = undefined;
  const securityEvents: Array<any> = [];
  const anomalies: Array<string> = [];
  let totalActions = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    totalActions++;
    actionsByType[data.action] = (actionsByType[data.action] || 0) + 1;
    if (data.action === "auth.login") lastLogin = data.timestamp;
    if (data.action === "workspace.updated") lastConfigChange = data.timestamp;
    if (data.action === "member.role_changed") lastPermissionChange = data.timestamp;
    if (data.action.startsWith("auth.")) securityEvents.push(data);
    // Example anomaly: too many failed logins
    if (data.action === "auth.login_failed") {
      anomalies.push(`Failed login for ${data.actorEmail || data.actorUid} at ${data.timestamp}`);
    }
  });

  return {
    workspaceId,
    period: { start: startDate || new Date(0), end: endDate || new Date() },
    totalActions,
    actionsByType,
    lastLogin,
    lastConfigChange,
    lastPermissionChange,
    securityEvents,
    anomalies,
  };
}
