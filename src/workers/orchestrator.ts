// Stub for missing orchestrator module to unblock build
export type RunStatus = string;
// Stubs for AgentRunner and AgentResult to unblock build
export type AgentRunner = (...args: any[]) => Promise<any>;
export type AgentResult = any;
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Plan = "starter" | "pro" | "elite" | "agency" | "founder";
type AgentCategory = "sales" | "marketing" | "ops" | "support" | "admin";
type PriceModel = "included" | "addon"; // NOTE: use "addon" not "add_on"
type AgentStatus = "enabled" | "disabled";

type AgentDef = {
  id: string;
  typeKey: string; // unique key like "lead_qualifier"
  name: string;
  description: string;
  category: AgentCategory;
  priceModel: PriceModel;
  priceCents: number; // always a number
  availableInPlans: Plan[];
  status: AgentStatus;

  hidden?: boolean;
  founderOnly?: boolean;
  label?: string;
  duty?: string;
};

const PLAN_LIMITS: Record<Plan, { maxAgents: number }> = {
  starter: { maxAgents: 3 },
  pro: { maxAgents: 8 },
  elite: { maxAgents: 15 },
  agency: { maxAgents: 30 },
  founder: { maxAgents: 9999 }, // effectively unlimited
};

const DEFAULT_LIBRARY: AgentDef[] = [
  {
    id: "a1",
    typeKey: "lead_qualifier",
    name: "Lead Qualifier",
    description: "Scores inbound leads, asks clarifying questions, and routes them to the right workflow.",
    category: "sales",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["starter", "pro", "elite", "agency", "founder"],
    status: "enabled",
    label: "Core",
    duty: "Qualify leads and route.",
  },
  {
    id: "a2",
    typeKey: "followup_scheduler",
    name: "Follow-Up Scheduler",
    description: "Creates follow-ups, reminders, and sequences based on lead status and engagement.",
    category: "ops",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["starter", "pro", "elite", "agency", "founder"],
    status: "enabled",
    label: "Core",
    duty: "Keep pipeline moving.",
  },
  {
    id: "a3",
    typeKey: "content_repurposer",
    name: "Content Repurposer",
    description: "Turns one piece of content into multiple platform-ready formats (posts, emails, scripts).",
    category: "marketing",
    priceModel: "addon",
    priceCents: 1900,
    availableInPlans: ["pro", "elite", "agency", "founder"],
    status: "enabled",
    label: "Add-on",
    duty: "Repurpose content at scale.",
  },
  {
    id: "a4",
    typeKey: "unified_inbox_assistant",
    name: "Unified Inbox Assistant",
    description: "Drafts replies, tags conversations, and recommends next actions in your unified inbox.",
    category: "support",
    priceModel: "addon",
    priceCents: 2900,
    availableInPlans: ["elite", "agency", "founder"],
    status: "enabled",
    label: "Premium",
    duty: "Keep inbox zero and move deals forward.",
    hidden: false,
  },
  {
    id: "a5",
    typeKey: "founder_control",
    name: "Founder Control Agent",
    description: "Founder-only governance agent for permissions, billing gates, and policy enforcement.",
    category: "admin",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["founder"],
    status: "enabled",
    founderOnly: true,
    hidden: true,
    label: "Founder-only",
    duty: "Govern access and rules.",
  },
];

function clampPlan(input: string | null): Plan {
  if (!input) return "starter";
  const v = input.toLowerCase();
  if (v === "starter" || v === "pro" || v === "elite" || v === "agency" || v === "founder") return v;
  return "starter";
}

// If this file is meant to be a React component, it should be in app/components/ or app/.
// If it is not, remove the React component and JSX code below.
// Here is a stub function to avoid top-level statements and errors.

export function orchestratorStub() {
  // This stub is intentionally left empty to avoid build errors.
}


