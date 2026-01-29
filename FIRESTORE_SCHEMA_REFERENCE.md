# Firestore Collections & Schema Reference

This document summarizes the main Firestore collections, their key fields, and expected types based on your indexes, rules, and codebase.

---

## 1. users
- **userId** (string, doc id)
- **profile fields** (object)
  - name, email, role, etc.

## 2. workspaces
- **workspaceId** (string, doc id)
- **name** (string)
- **ownerUserId** (string)
- **plan** (string)
- **status** (string)
- **createdAt** (timestamp)

## 3. workspace_members
- **memberId** (string, doc id, usually `${userId}_${workspaceId}`)
- **workspaceId** (string)
- **userId** (string)
- **role** (string: owner, admin, member, viewer)
- **status** (string: active, invited, removed)
- **invitedEmail** (string)
- **createdAt** (timestamp)

## 4. onboarding_states
- **userId** (string, doc id)
- **workspaceId** (string)
- **currentStep** (string)
- **steps** (object)
- **inputs** (object)
- **planIntent** (object)
- **createdAt** (timestamp)
- **updatedAt** (timestamp)

## 5. agent_runs
- **runId** (string, doc id)
- **workspaceId** (string)
- **agentId** (string)
- **agentType** (string)
- **status** (string)
- **inputs** (object)
- **outputs** (object)
- **error** (object)
- **correlationId** (string)
- **createdAt** (timestamp)
- **startedAt** (timestamp)
- **endedAt** (timestamp)

## 6. agent_tasks
- **taskId** (string, doc id)
- **workspaceId** (string)
- **agentId** (string)
- **status** (string)
- **priority** (string/number)
- **runId** (string)
- **createdAt** (timestamp)
- **dueAt** (timestamp)
- **timing** (object)

## 7. workflows
- **workflowId** (string, doc id)
- **workspaceId** (string)
- **name** (string)
- **steps** (array/object)
- **createdAt** (timestamp)
- **updatedAt** (timestamp)

## 8. workflow_runs
- **runId** (string, doc id)
- **workspaceId** (string)
- **status** (string)
- **startedAt** (timestamp)
- **createdAt** (timestamp)
- **steps** (subcollection)

## 9. leads
- **leadId** (string, doc id)
- **workspaceId** (string)
- **updatedAt** (timestamp)
- **other lead fields**

## 10. campaigns
- **campaignId** (string, doc id)
- **workspaceId** (string)
- **updatedAt** (timestamp)
- **other campaign fields**

## 11. admin_dashboards
- **docId** (string, doc id)
- **workspaceId** (string)
- **dashboard data** (object)

## 12. cost_usage_logs
- **logId** (string, doc id)
- **workspaceId** (string)
- **type** (string)
- **createdAt** (timestamp)
- **other usage/cost fields**

## 13. orchestrator_events
- **eventId** (string, doc id)
- **workspaceId** (string)
- **type** (string)
- **status** (string)
- **createdAt** (timestamp)

## 14. tool_registry
- **toolId** (string, doc id)
- **workspaceId** (string)
- **type** (string)
- **enabled** (boolean)
- **updatedAt** (timestamp)

## 15. connections
- **connectionId** (string, doc id)
- **workspaceId** (string)
- **provider** (string)
- **status** (string)

## 16. subscriptions
- **subscriptionId** (string, doc id)
- **workspaceId** (string)
- **status** (string)
- **startedAt** (timestamp)

## 17. audit_logs
- **logId** (string, doc id)
- **workspaceId** (string)
- **createdAt** (timestamp)
- **log data** (object)

## 18. integrations
- **integrationId** (string, doc id)
- **workspaceId** (string)
- **type** (string)
- **status** (string)

## 19. usage_meters
- **meterId** (string, doc id)
- **workspaceId** (string)
- **period** (string)

## 20. approvals
- **approvalId** (string, doc id)
- **workspaceId** (string)
- **status** (string)
- **createdAt** (timestamp)
- **runId** (string)

## 21. artifacts
- **artifactId** (string, doc id)
- **workspaceId** (string)
- **type** (string)
- **threadId** (string)
- **createdAt** (timestamp)

## 22. threads
- **threadId** (string, doc id)
- **workspaceId** (string)
- **status** (string)
- **lastMessageAt** (timestamp)
- **createdBy** (string)
- **createdAt** (timestamp)

## 23. llm_sessions
- **sessionId** (string, doc id)
- **workspaceId** (string)
- **agentId** (string)
- **runId** (string)
- **createdAt** (timestamp)

## 24. policy_profiles
- **profileId** (string, doc id)
- **workspaceId** (string)
- **name** (string)

## 25. tool_calls
- **callId** (string, doc id)
- **workspaceId** (string)
- **runId** (string)
- **agentId** (string)
- **toolKey** (string)
- **status** (string)
- **createdAt** (timestamp)

## 26. tool_runs
- **runId** (string, doc id)
- **workspaceId** (string)
- **toolId** (string)
- **status** (string)
- **createdAt** (timestamp)

## 27. execution_failures
- **failureId** (string, doc id)
- **workspaceId** (string)
- **agentId** (string)
- **createdAt** (timestamp)

## 28. policy_violations
- **violationId** (string, doc id)
- **workspaceId** (string)
- **agentId** (string)
- **createdAt** (timestamp)

---

> This schema is inferred from your indexes, rules, and code. For exact field types and required/optional status, review your Firestore rules and application logic.
