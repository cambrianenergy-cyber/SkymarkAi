"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
// For now, comment out the export and function to prevent TypeScript errors.
// export default function AgentsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // Optional: allow testing via URL like ?plan=pro&founder=1
  const userPlan = clampPlan(sp.get("plan"));
  const isFounder = sp.get("founder") === "1" || userPlan === "founder";
  const planLimit = PLAN_LIMITS[userPlan].maxAgents;

  const [plan, setPlan] = useState<Plan>(userPlan);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AgentCategory | "all">("all");
  const [showHidden, setShowHidden] = useState(false);
  const [showFounderOnly, setShowFounderOnly] = useState(false);

  const [agents, setAgents] = useState<AgentDef[]>(DEFAULT_LIBRARY);
  const [agentType, setAgentType] = useState("");
  const [agentName, setAgentName] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const canManage = true; // wire this to your auth/roles later

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return agents.filter((a) => {
      if (!showHidden && a.hidden) return false;
      if (!showFounderOnly && a.founderOnly) return false;
      if (!isFounder && a.founderOnly) return false;

      // plan gating for display
      if (!a.availableInPlans.includes(plan)) return false;

      if (category !== "all" && a.category !== category) return false;

      if (!q) return true;
      const hay = `${a.name} ${a.typeKey} ${a.description} ${a.label ?? ""} ${a.duty ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agents, query, category, showHidden, showFounderOnly, isFounder, plan]);

  const enabledCount = useMemo(() => agents.filter((a) => a.status === "enabled").length, [agents]);
  const remainingSlots = Math.max(0, planLimit - enabledCount);

  function addAgent() {
    setStatusMsg(null);

    if (!canManage) {
      setStatusMsg("You don’t have permission to manage agents.");
      return;
    }

    const typeKey = agentType.trim();
    const name = agentName.trim();

    if (!typeKey || !name) {
      setStatusMsg("Type Key and Name are required.");
      return;
    }

    if (agents.some((a) => a.typeKey === typeKey)) {
      setStatusMsg("That Type Key already exists. Choose a unique one.");
      return;
    }

    // Enforce plan limit for enabled agents (unless founder)
    if (!isFounder && enabledCount >= PLAN_LIMITS[plan].maxAgents) {
      setStatusMsg(`Plan limit reached (${PLAN_LIMITS[plan].maxAgents}). Upgrade to add more agents.`);
      return;
    }

    const next: AgentDef = {
      id: `a_${Date.now()}`,
      typeKey,
      name,
      description: "Custom agent (edit description in DB later).",
      category: "ops",
      priceModel: "included",
      priceCents: 0,
      availableInPlans: [plan, "elite", "agency", "founder"], // reasonable default
      status: "enabled",
      label: "Custom",
      duty: "Custom defined duty.",
    };

    setAgents((prev) => [next, ...prev]);
    setAgentType("");
    setAgentName("");
    setStatusMsg("Agent added.");
  }

  function toggleStatus(id: string) {
    setStatusMsg(null);

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;

        const nextStatus: AgentStatus = a.status === "enabled" ? "disabled" : "enabled";

        // Enforce plan limit if toggling ON
        if (nextStatus === "enabled" && !isFounder) {
          const currentlyEnabled = prev.filter((x) => x.status === "enabled").length;
          if (currentlyEnabled >= PLAN_LIMITS[plan].maxAgents) {
            setStatusMsg(`Plan limit reached (${PLAN_LIMITS[plan].maxAgents}). Upgrade to enable more agents.`);
            return a;
          }
        }

        return { ...a, status: nextStatus };
      })
    );
  }


