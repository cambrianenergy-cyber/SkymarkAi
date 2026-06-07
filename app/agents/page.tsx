"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Example URLs:
 * /app/agents?plan=starter
 * /app/agents?plan=pro
 * /app/agents?plan=agency
 * /app/agents?plan=elite
 * /app/agents?plan=founder&founder=1
 * /app/agents?plan=pro&workspaceId=abc123
 */

type Plan = "starter" | "pro" | "agency" | "elite" | "founder";
type AgentCategory = "sales" | "marketing" | "support" | "ops" | "custom";
type PriceModel = "included" | "addon" | "one_time";
type AgentStatus = "active" | "disabled";
type AgentDef = {
  id: string;
  typeKey: string;
  name: string;
  description: string;
  category: AgentCategory;
  priceModel: PriceModel;
  priceCents: number;
  availableInPlans: Plan[];
  hidden?: boolean;
  founderOnly?: boolean;
  status: AgentStatus;
  label?: string;
  duty?: string;
};

const PLAN_LIMITS: Record<Plan, { maxAgents: number }> = {
  starter: { maxAgents: 3 },
  pro: { maxAgents: 10 },
  agency: { maxAgents: 50 },
  elite: { maxAgents: 100 },
  founder: { maxAgents: Number.POSITIVE_INFINITY },
};

interface CategoryOption {
  value: AgentCategory | "all";
  label: string;
}
const CATEGORIES: CategoryOption[] = [
  { value: "all", label: "All categories" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "support", label: "Support" },
  { value: "ops", label: "Ops" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_LIBRARY: AgentDef[] = [
  {
    id: "a1",
    typeKey: "lead_qualifier",
    name: "Lead Qualifier",
    description: "Scores inbound leads, tags intent, routes to the best pipeline.",
    category: "sales",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["starter", "pro", "agency", "elite", "founder"],
    status: "active",
    label: "Core",
    duty: "Qualify leads fast",
  },
  {
    id: "a2",
    typeKey: "followup_closer",
    name: "Follow-up Closer",
    description: "Runs follow-up sequences, handles objections, books calls.",
    category: "sales",
    priceModel: "addon",
    priceCents: 1900,
    availableInPlans: ["pro", "agency", "elite", "founder"],
    status: "active",
    label: "Revenue",
    duty: "Close more deals",
  },
  {
    id: "a3",
    typeKey: "repurpose_engine",
    name: "Repurpose Engine",
    description: "Turns one asset into 10+ posts across platforms with hooks.",
    category: "marketing",
    priceModel: "addon",
    priceCents: 2900,
    availableInPlans: ["pro", "agency", "elite", "founder"],
    status: "active",
    label: "Growth",
    duty: "Content multiplication",
  },
  {
    id: "a4",
    typeKey: "unified_inbox_triage",
    name: "Unified Inbox Triage",
    description: "Categorizes messages, drafts replies, escalates hot leads.",
    category: "support",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["agency", "elite", "founder"],
    status: "active",
    label: "Scale",
    duty: "Inbox control",
  },
  {
    id: "a5",
    typeKey: "agency_mode_admin",
    name: "Agency Mode Admin",
    description: "Manages multi-client workspaces, access, and deliverables.",
    category: "ops",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["agency", "elite", "founder"],
    status: "active",
    label: "Enterprise",
    duty: "Client operations",
  },
  {
    id: "a6",
    typeKey: "founder_godmode",
    name: "Founder Godmode",
    description: "Hidden founder-only operator controls. (Example hidden agent)",
    category: "ops",
    priceModel: "included",
    priceCents: 0,
    availableInPlans: ["founder"],
    hidden: true,
    founderOnly: true,
    status: "active",
    label: "Founder Only",
    duty: "System-level control",
  },
];

function safePlan(input: string | null): Plan {
  const p = (input ?? "").toLowerCase();
  if (p === "starter" || p === "pro" || p === "agency" || p === "elite" || p === "founder") return p;
  return "starter";
}

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function money(cents: number): string {
  if (!Number.isFinite(cents)) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AgentsPage() {
  const router = useRouter();

  // Read plan/founder/workspaceId from URL so the page compiles without your auth hooks.
  const initialPlan = safePlan(getSearchParam("plan"));
  const isFounder = (getSearchParam("founder") ?? "") === "1" || initialPlan === "founder";
  const workspaceId = "V7kzoES7soCvRCWa74Kg";

  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<AgentCategory | "all">("all");
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [showFounderOnly, setShowFounderOnly] = useState<boolean>(false);

  const [library] = useState<AgentDef[]>(DEFAULT_LIBRARY);

  const planLimit = PLAN_LIMITS[plan].maxAgents;

  const availableAgents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return library
      .filter((a) => {
        // plan gating
        if (!a.availableInPlans.includes(plan)) return false;

        // hidden gating
        if (a.hidden && !showHidden && !isFounder) return false;

        // founder-only gating
        if (a.founderOnly && !isFounder && !showFounderOnly) return false;

        if (category !== "all" && a.category !== category) return false;

        if (!q) return true;
        const hay = `${a.name} ${a.typeKey} ${a.description} ${a.label ?? ""} ${a.duty ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [plan, query, category, showHidden, showFounderOnly, library, isFounder]);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm opacity-80">
          Plan: <span className="font-medium">{plan}</span>  Max agents:{" "}
          <span className="font-medium">{planLimit === Number.POSITIVE_INFINITY ? "" : planLimit}</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm opacity-80">Plan</label>
          <select
            className="border rounded px-3 py-2"
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
          >
            <option value="starter">starter</option>
            <option value="pro">pro</option>
            <option value="agency">agency</option>
            <option value="elite">elite</option>
            <option value="founder">founder</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm opacity-80">Search</label>
          <input
            className="border rounded px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm opacity-80">Category</label>
          <select
            className="border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm select-none">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          Show hidden
        </label>

        <label className="flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={showFounderOnly}
            onChange={(e) => setShowFounderOnly(e.target.checked)}
          />
          Show founder-only
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableAgents.map((a) => (
          <div key={a.typeKey} className="border rounded p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs opacity-70">{a.typeKey}</div>
              </div>

              <div className="text-xs text-right opacity-80">
                <div className="font-medium">{a.priceModel === "included" ? "Included" : a.priceModel === "addon" ? "Add-on" : "One-time"}</div>
                <div>{a.priceModel === "included" ? "" : money(a.priceCents)}</div>
              </div>
            </div>

            <div className="text-sm opacity-90">{a.description}</div>

            <div className="flex flex-wrap gap-2 text-xs opacity-80">
              <span className="border rounded px-2 py-1">category: {a.category}</span>
              {a.label ? <span className="border rounded px-2 py-1">{a.label}</span> : null}
              {a.duty ? <span className="border rounded px-2 py-1">{a.duty}</span> : null}
              {a.hidden ? <span className="border rounded px-2 py-1">hidden</span> : null}
              {a.founderOnly ? <span className="border rounded px-2 py-1">founder-only</span> : null}
            </div>
          </div>
        ))}
      </div>

      {availableAgents.length === 0 ? <div className="text-sm opacity-70">No agents match your filters.</div> : null}
    </div>
  );
}
