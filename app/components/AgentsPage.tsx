"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Plan = "accelerate" | "dominion" | "sovereign" | "founder";
type AgentCategory = "sales" | "marketing" | "ops" | "support" | "admin";
type PriceModel = "included" | "addon";
type AgentStatus = "enabled" | "disabled";

type AgentDef = {
  id: string;
  typeKey: string;
  name: string;
  description: string;
  category: AgentCategory;
  priceModel: PriceModel;
  priceCents: number;
  availableInPlans: Plan[];
  status: AgentStatus;
  hidden?: boolean;
  founderOnly?: boolean;
  label?: string;
  duty?: string;
};

const PLAN_LIMITS: Record<Plan, { maxAgents: number }> = {
  accelerate: { maxAgents: 3 },
  dominion: { maxAgents: 5 },
  sovereign: { maxAgents: 7 },
  founder: { maxAgents: 9999 },
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
    availableInPlans: ["accelerate", "dominion", "sovereign", "founder"],
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
    availableInPlans: ["accelerate", "dominion", "sovereign", "founder"],
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
    availableInPlans: ["dominion", "sovereign", "founder"],
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
    availableInPlans: ["sovereign", "founder"],
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
  if (!input) return "accelerate";
  const v = input.toLowerCase();
  if (v === "accelerate" || v === "dominion" || v === "sovereign" || v === "founder") return v as Plan;
  return "accelerate";
}

export default function AgentsPage() {
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
      setStatusMsg("You dont have permission to manage agents.");
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
      availableInPlans: [plan, "sovereign", "founder"],
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm opacity-80">
            Plan: <span className="font-medium">{plan}</span>  Enabled:{" "}
            <span className="font-medium">{enabledCount}</span>  Remaining slots:{" "}
            <span className="font-medium">{remainingSlots}</span>
            {isFounder ? "  Founder access" : ""}
          </p>
        </div>

        <button
          className="rounded border px-3 py-2 text-sm hover:opacity-80"
          onClick={() => router.refresh()}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 rounded border p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-xs opacity-70">Search</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents..."
            />
          </div>

          <div>
            <label className="text-xs opacity-70">Category</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as AgentCategory | "all")}
            >
              <option value="all">All</option>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="ops">Ops</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="text-xs opacity-70">View as Plan</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
            >
              <option value="starter">starter</option>
              <option value="pro">pro</option>
              <option value="elite">elite</option>
              <option value="agency">agency</option>
              <option value="founder">founder</option>
            </select>
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
              Show hidden
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showFounderOnly}
                onChange={(e) => setShowFounderOnly(e.target.checked)}
              />
              Show founder-only
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs opacity-70">New Agent Type Key</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              placeholder="ex: proposal_writer"
            />
          </div>

          <div>
            <label className="text-xs opacity-70">New Agent Name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="ex: Proposal Writer"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              className="w-full rounded bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
              onClick={addAgent}
              disabled={!canManage}
            >
              Add Agent
            </button>
          </div>
        </div>

        {statusMsg ? <div className="text-sm">{statusMsg}</div> : null}
      </div>

      <div className="mt-6 grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded border p-4 text-sm opacity-80">No agents match your filters.</div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{a.name}</h3>
                    <span className="rounded border px-2 py-0.5 text-xs">{a.category}</span>
                    <span className="rounded border px-2 py-0.5 text-xs">{a.priceModel}</span>
                    {a.label ? <span className="rounded border px-2 py-0.5 text-xs">{a.label}</span> : null}
                    {a.hidden ? <span className="rounded border px-2 py-0.5 text-xs">hidden</span> : null}
                    {a.founderOnly ? <span className="rounded border px-2 py-0.5 text-xs">founder-only</span> : null}
                  </div>
                  <div className="mt-1 text-sm opacity-80">{a.description}</div>
                  <div className="mt-2 text-xs opacity-70">
                    <span className="font-medium">typeKey:</span> {a.typeKey} {" "}
                    <span className="font-medium">plans:</span> {a.availableInPlans.join(", ")} {" "}
                    <span className="font-medium">price:</span>{" "}
                    {a.priceCents === 0 ? "included" : `$${(a.priceCents / 100).toFixed(2)}`}
                  </div>
                  {a.duty ? <div className="mt-2 text-sm"><span className="font-medium">Duty:</span> {a.duty}</div> : null}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="rounded border px-2 py-1 text-xs">
                    {a.status === "enabled" ? "enabled" : "disabled"}
                  </span>
                  <button
                    type="button"
                    className="rounded border px-3 py-2 text-sm hover:opacity-80 disabled:opacity-40"
                    disabled={!canManage}
                    onClick={() => toggleStatus(a.id)}
                  >
                    Toggle
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

