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
  // pricing
  priceModel: PriceModel;
  priceCents: number; // 0 allowed for included
  // gating / visibility
  availableInPlans: Plan[]; // which plans can add/use it
  hidden?: boolean; // hidden from normal users (toggle shows it)
  founderOnly?: boolean; // only founders can add
  status: AgentStatus;

  // optional UI metadata
  label?: string;
  duty?: string;
};
const PLAN_LIMITS: Record<Plan, { maxAgents: number }> = {
  starter: { maxAgents: 3 },
  pro: { maxAgents: 10 },
  agency: { maxAgents: 50 },
  elite: { maxAgents: 100 },
  founder: { maxAgents: Number.POSITIVE_INFINITY }, // unlimited
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

// Demo library (replace with your Firestore load later)
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
  const workspaceId = getSearchParam("workspaceId") ?? "demo-workspace";

  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<AgentCategory | "all">("all");
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [showFounderOnly, setShowFounderOnly] = useState<boolean>(false);

  const [library] = useState<AgentDef[]>(DEFAULT_LIBRARY);
  const [agents, setAgents] = useState<AgentDef[]>([]);

  const [agentType, setAgentType] = useState<string>("");
  const [agentName, setAgentName] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [fallbackError, setFallbackError] = useState<string>("");

  const planLimit = PLAN_LIMITS[plan].maxAgents;
  const remainingSlots = Number.isFinite(planLimit) ? Math.max(0, planLimit - agents.length) : Number.POSITIVE_INFINITY;

  const availableAgents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return library
      .filter((a) => {
        // plan gating
        if (!a.availableInPlans.includes(plan)) return false;

        // hidden gating
        if (a.hidden && !showHidden && !isFounder) return false;

        // founder-only gating
        if (a.founderOnly && !isFounder &&
          !showFounderOnly) return false;

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
          Plan: <span className="font-medium">{plan}</span>  Max agents: {" "}
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
"use client";

import React, { useMemo, useState } from "react";
type Plan = "starter" | "pro" | "agency";
type AgentCategory = "growth" | "ops" | "support";
type PriceModel = "included" | "addon";
type AgentDef = {
  typeKey: string;
  name: string;
  description: string;
  category: AgentCategory;
  label?: string;
  duty?: string;
  hidden?: boolean;
  founderOnly?: boolean;
  availableInPlans?: Plan[];
  priceModel: PriceModel;
  priceCents: number;
};

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
            <option value="all">all</option>
            <option value="growth">growth</option>
            <option value="ops">ops</option>
            <option value="support">support</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
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
        {library.map((a) => (
          <div key={a.typeKey} className="border rounded p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs opacity-70">{a.typeKey}</div>
              </div>
              <div className="text-xs text-right opacity-80">
                <div className="font-medium">{a.priceModel === "included" ? "Included" : "Add-on"}</div>
                <div>{a.priceModel === "included" ? "" : formatMoney(a.priceCents)}</div>
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

      {library.length === 0 ? (
        <div className="text-sm opacity-70">No agents match your filters.</div>
      ) : null}
    </div>
  );
}
          id: uid(),
          typeKey: "lead-qualifier",
          name: "Lead Qualifier",
          description: "Scores inbound leads and routes them to the right workflow.",
          category: "sales",
          status: "enabled",
          priceCents: 1900,
        },
      ];
      setAgents(demo);
    } catch (e: any) {
      setFallbackError(e?.message ?? "Failed to load agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);
  function toggleAgent(id: string) {
    if (!canManage) return;
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "enabled" ? "disabled" : "enabled" } : a)),
    );
    // TODO: persist toggle in DB
  }

  async function createAgent() {
  setStatusMsg("");

  if (!canManage) {
      setStatusMsg("You dont have permission to manage agents.");
      return;
    }
    if (!isFounder && agents.length >= planLimit) {
      setStatusMsg(`Plan limit reached (${planLimit}). Upgrade to add more agents.`);
      return;
  const template = availableAgents.find((a) => a.typeKey === agentType);
  const name = (agentName || template?.name || "Custom Agent").trim();

  const next: AgentDef = {
  id: uid(),
  typeKey: agentType,
  name,
  description: template?.description ?? "Custom agent configured by your team.",
  category: template?.category ?? "custom",
  status: "enabled",
      priceCents: template?.priceCents,
    };

    setAgents((prev) => [next, ...prev]);
  setAgentName("");
  setStatusMsg("Agent created.");

  // TODO: persist create in DB
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold">Agents</div>
        <div className="mt-2 text-sm text-neutral-500">Loading</div>
      </div>
    );
  }

  if (fallbackError) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold">Agents</div>
        <div className="mt-3 rounded border p-3 text-sm">
          <div className="font-semibold">Couldnt load agents</div>
          <div className="mt-1 text-neutral-600">{fallbackError}</div>
          <button
            className="mt-3 rounded bg-black px-3 py-2 text-sm text-white"
            onClick={() => void loadAgents()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>

          <div className="mt-1 text-sm text-neutral-500">
            Workspace: <span className="font-mono">{workspaceId}</span>  Plan:{" "}
            <span className="font-semibold">{isFounder ? "founder" : userPlan}</span>
          </div>

          <div className="mt-1 text-sm text-neutral-500">
            {planLimit === Number.MAX_SAFE_INTEGER ? (
              <span>Unlimited agents (Founder).</span>
            ) : (
              <span>
                Limit: {planLimit}  Remaining: {remainingSlots}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => router.refresh()}
          className="rounded border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          Refresh
        </button>
      </header>

      {/* Create */}
      <section className="rounded border p-4 space-y-3">
        <div className="font-semibold">Create Agent</div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm text-neutral-600">Agent Type</div>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              disabled={!canManage}
            >
              {availableAgents.map((a) => (
                <option key={a.typeKey} value={a.typeKey}>
                  {a.name}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm text-neutral-600">Agent Name (optional)</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., Dallas Lead Qualifier"
              disabled={!canManage}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => void createAgent()}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={!canManage}
          >
            Create
          </button>

          {statusMsg ? <div className="text-sm text-neutral-700">{statusMsg}</div> : null}

          {!isFounder && agents.length >= planLimit ? (
            <div className="text-sm text-neutral-600">Plan limit reached. Upgrade to add more agents.</div>
          ) : null}
        </div>
      </section>

      {/* List */}
      <section className="rounded border p-4">
        <div className="font-semibold mb-2">Agents in Workspace</div>
        {agents.length === 0 ? (
          <div className="text-sm text-neutral-500">No agents yet.</div>
        ) : (
          <div className="divide-y">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-neutral-500">{a.description}</div>
                  <div className="text-xs text-neutral-500">Category: {a.category}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-600">{a.status}</span>
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => toggleAgent(a.id)}
                    disabled={!canManage}
                  >
                    Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Plan = "starter" | "pro" | "agency" | "founder";

type AgentStatus = "enabled" | "disabled";

type AgentCategory = "sales" | "marketing" | "ops" | "support" | "custom";

export type AgentDef = {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  status: AgentStatus;
  priceCents?: number;
  typeKey: string; // the agent "template" key
};

const PLAN_LIMITS: Record<Plan, { maxAgents: number }> = {
  starter: { maxAgents: 3 },
  pro: { maxAgents: 10 },
  agency: { maxAgents: 50 },
  founder: { maxAgents: Number.MAX_SAFE_INTEGER },
};

const DEFAULT_LIBRARY: Array<Pick<AgentDef, "typeKey" | "name" | "description" | "category" | "priceCents">> = [
  {
    typeKey: "lead-qualifier",
    name: "Lead Qualifier",
    description: "Scores inbound leads, extracts intent, and routes to the right workflow.",
    category: "sales",
    priceCents: 1900,
  },
  {
    typeKey: "follow-up-writer",
    name: "Follow-Up Writer",
    description: "Writes personalized follow-ups based on thread context and next best action.",
    category: "sales",
    priceCents: 1900,
  },
  {
    typeKey: "content-repurposer",
    name: "Content Repurposer",
    description: "Turns one long post into shorts, reels scripts, carousels, and email blurbs.",
    category: "marketing",
    priceCents: 2900,
  },
  {
    typeKey: "scheduler",
    name: "Scheduler",
    description: "Creates tasks, reminders, and runbooks; keeps the pipeline moving.",
    category: "ops",
    priceCents: 1900,
  },
  {
    typeKey: "support-triage",
    name: "Support Triage",
    description: "Categorizes tickets, drafts responses, and escalates with full context.",
    category: "support",
    priceCents: 1900,
  },
];

function uid(prefix = "agt") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safePlan(x: string | null): Plan {
  if (x === "starter" || x === "pro" || x === "agency" || x === "founder") return x;
  return "starter";
}

export default function AgentsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // You can pass these in the URL while testing:
  // /app/agents?workspaceId=abc&plan=pro&founder=1
  const workspaceId = sp.get("workspaceId") ?? "demo-workspace";
  const userPlan = safePlan(sp.get("plan"));
  const isFounder = sp.get("founder") === "1" || userPlan === "founder";

  const [loading, setLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  const [agents, setAgents] = useState<AgentDef[]>([]);

  const [agentType, setAgentType] = useState<string>(DEFAULT_LIBRARY[0]?.typeKey ?? "custom");
  const [agentName, setAgentName] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");

  const canManage = true; // TODO: replace with your real role check (owner/admin)

  const availableAgents = useMemo(() => DEFAULT_LIBRARY, []);

  const planLimit = PLAN_LIMITS[isFounder ? "founder" : userPlan].maxAgents;

  const remainingSlots = useMemo(() => {
    if (planLimit === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, planLimit - agents.length);
  }, [agents.length, planLimit]);

  async function loadAgents() {
    setLoading(true);
    setFallbackError(null);

    try {
      // TODO: Replace with Firestore or API call.
      // Example: const res = await fetch(`/api/agents?workspaceId=${workspaceId}`);
      // const data = await res.json();

      // Demo seed:
      const demo: AgentDef[] = [
        {
          id: uid(),
          typeKey: "lead-qualifier",
          name: "Lead Qualifier",
          description: "Scores inbound leads and routes them to the right workflow.",
          category: "sales",
          status: "enabled",
          priceCents: 1900,
        },
      ];

      setAgents(demo);
    } catch (e: any) {
      setFallbackError(e?.message ?? "Failed to load agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  function toggleAgent(id: string) {
    if (!canManage) return;
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "enabled" ? "disabled" : "enabled" } : a)),
    );
    // TODO: persist toggle in DB
  }

  async function createAgent() {
    setStatusMsg("");

    if (!canManage) {
      setStatusMsg("You dont have permission to manage agents.");
      return;
    }

    if (!isFounder && agents.length >= planLimit) {
      setStatusMsg(`Plan limit reached (${planLimit}). Upgrade to add more agents.`);
      return;
    }

    const template = availableAgents.find((a) => a.typeKey === agentType);
    const name = (agentName || template?.name || "Custom Agent").trim();

    const next: AgentDef = {
      id: uid(),
      typeKey: agentType,
      name,
      description: template?.description ?? "Custom agent configured by your team.",
      category: template?.category ?? "custom",
      status: "enabled",
      priceCents: template?.priceCents,
    };

    setAgents((prev) => [next, ...prev]);
    setAgentName("");
    setStatusMsg("Agent created.");

    // TODO: persist create in DB
  }

  if (loading) {
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>

          <div className="mt-1 text-sm text-neutral-500">
            Workspace: <span className="font-mono">{workspaceId}</span>  Plan:{" "}
            <span className="font-semibold">{isFounder ? "founder" : userPlan}</span>
          </div>

          <div className="mt-1 text-sm text-neutral-500">
            {planLimit === Number.MAX_SAFE_INTEGER ? (
              <span>Unlimited agents (Founder).</span>
            ) : (
              <span>
                Limit: {planLimit}  Remaining: {remainingSlots}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => router.refresh()}
          className="rounded border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          Refresh
        </button>
      </header>

      {/* Create */}
      <section className="rounded border p-4 space-y-3">
        <div className="font-semibold">Create Agent</div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm text-neutral-600">Agent Type</div>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              disabled={!canManage}
            >
              {availableAgents.map((a) => (
                <option key={a.typeKey} value={a.typeKey}>
                  {a.name}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <div className="text-sm text-neutral-600">Agent Name (optional)</div>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., Dallas Lead Qualifier"
              disabled={!canManage}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => void createAgent()}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={!canManage}
          >
            Create
          </button>

          {statusMsg ? <div className="text-sm text-neutral-700">{statusMsg}</div> : null}

          {!isFounder && agents.length >= planLimit ? (
            <div className="text-sm text-neutral-600">Plan limit reached. Upgrade to add more agents.</div>
          ) : null}
        </div>
      </section>

      {/* List */}
      <section className="rounded border p-4">
        <div className="font-semibold mb-2">Agents in Workspace</div>
        {agents.length === 0 ? (
          <div className="text-sm text-neutral-500">No agents yet.</div>
        ) : (
          <div className="divide-y">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-neutral-500">{a.description}</div>
                  <div className="text-xs text-neutral-500">Category: {a.category}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-600">{a.status}</span>
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => toggleAgent(a.id)}
                    disabled={!canManage}
                  >
                    Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
"use client";

import React, { useMemo, useState } from "react";

type Plan = "starter" | "pro" | "elite";
type AgentType =
  | "campaign_generator"
  | "repurpose_engine"
  | "unified_inbox"
  | "lead_scoring"
  | "follow_up"
  | "agency_mode"
  | "workflow_marketplace"
  | "content_writer"
  | "seo_optimizer"
  | "ads_manager"
  | "analytics";

type PriceModel = "included" | "add_on";

type AgentDef = {
  type: AgentType;
  label: string;
  duty: string;
  hidden: boolean; // internal/advanced
  founderOnly: boolean;
  availableInPlans: Plan[]; // which plans can access
  priceModel: PriceModel;
  addOnPriceCents?: number; // only when priceModel === "add_on"
};

const DEFAULT_AGENTS: AgentDef[] = [
  {
    type: "campaign_generator",
    label: "Campaign Generator",
    duty: "Creates full-funnel campaign plans (angles, hooks, CTAs, offers, landing copy).",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["pro", "elite"],
    priceModel: "included",
  },
  {
    type: "repurpose_engine",
    label: "Repurpose Engine",
    duty: "Turns one asset into many (threads, reels scripts, emails, blog outlines) with brand voice.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["pro", "elite"],
    priceModel: "included",
  },
  {
    type: "unified_inbox",
    label: "Unified Inbox Agent",
    duty: "Helps triage messages, drafts replies, and routes conversations to the right workflow.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["elite"],
    priceModel: "included",
  },
  {
    type: "lead_scoring",
    label: "Lead Scoring",
    duty: "Scores leads using behavior + context and recommends next action.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["pro", "elite"],
    priceModel: "included",
  },
  {
    type: "follow_up",
    label: "Follow-Up Autopilot",
    duty: "Generates follow-up sequences, timing, and next-best-message suggestions.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["starter", "pro", "elite"],
    priceModel: "included",
  },
  {
    type: "agency_mode",
    label: "Agency Mode",
    duty: "Multi-client ops: workspaces, approvals, client reporting, and task routing.",
    hidden: true,
    founderOnly: false,
    availableInPlans: ["elite"],
    priceModel: "included",
  },
  {
    type: "workflow_marketplace",
    label: "Workflow Marketplace",
    duty: "Browse/import proven workflows (SOPs) and auto-configure steps + agents.",
    hidden: true,
    founderOnly: false,
    availableInPlans: ["elite"],
    priceModel: "included",
  },
  {
    type: "seo_optimizer",
    label: "SEO Optimizer",
    duty: "Keyword + SERP intent assistance, outlines, and on-page optimization suggestions.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["starter", "pro", "elite"],
    priceModel: "included",
  },
  {
    type: "ads_manager",
    label: "Ads Manager",
    duty: "Drafts ad concepts, targeting ideas, ad copy variants, and creative briefs.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["pro", "elite"],
    priceModel: "add_on",
    addOnPriceCents: 2900,
  },
  {
    type: "analytics",
    label: "Analytics",
    duty: "Summarizes performance and recommends experiments + next actions.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["starter", "pro", "elite"],
    priceModel: "included",
  },
  {
    type: "content_writer",
    label: "Content Writer",
    duty: "Writes posts, emails, landing page sections, and scripts using your voice rules.",
    hidden: false,
    founderOnly: false,
    availableInPlans: ["starter", "pro", "elite"],
    priceModel: "included",
  },
];

function formatMoney(cents?: number) {
  if (!cents || cents <= 0) return "";
  return `$${(cents / 100).toFixed(2)}/mo`;
}

export default function AgentsPage() {
  const [plan, setPlan] = useState<Plan>("starter");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");

  const agents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFAULT_AGENTS.filter((a) => {
      if (!showHidden && a.hidden) return false;
      if (!a.availableInPlans.includes(plan)) return false;
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.duty.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      );
    });
  }, [plan, showHidden, query]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage which AI agents are available by plan, and review what each one does.
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <label className="text-sm text-gray-600">Plan</label>
          <select
            className="border rounded px-2 py-1"
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
          >
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>

          <label className="text-sm text-gray-600 ml-2">Search</label>
          <input
            className="border rounded px-2 py-1"
            placeholder="campaign, inbox, follow-up..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label className="text-sm text-gray-700 ml-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />
            Show hidden
          </label>
        </div>
      </div>

      <div className="mt-6 border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-50 border-b px-4 py-2 text-sm font-medium">
          <div className="col-span-3">Agent</div>
          <div className="col-span-6">Duty</div>
          <div className="col-span-2">Pricing</div>
          <div className="col-span-1 text-right">Flags</div>
        </div>

        {agents.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No agents match your filters.</div>
        ) : (
          agents.map((a) => (
            <div key={a.type} className="grid grid-cols-12 px-4 py-3 border-b last:border-b-0">
              <div className="col-span-3">
                <div className="font-semibold">{a.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{a.type}</div>
              </div>

              <div className="col-span-6 text-sm text-gray-700">{a.duty}</div>

              <div className="col-span-2 text-sm">
                {a.priceModel === "included" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">
                    Included
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">
                    Add-on {formatMoney(a.addOnPriceCents)}
                  </span>
                )}
              </div>

              <div className="col-span-1 text-right text-xs text-gray-600">
                {a.hidden ? "H" : ""}
                {a.founderOnly ? " F" : ""}
              </div>
            </div>
          ))
        )}
      </div>

      border: '2px solid #1976d2',
  {
    type: "Campaign_Manager",
    label: " Campaign Manager",
    duty: "Owns campaign lifecycles: roadmaps, milestones, cross-channel coordination, and delivery against targets.",
  },
  const [agents, setAgents] = useState<AgentDoc[]>([]);
  const [agentType, setAgentType] = useState("");
  const [agentName, setAgentName] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [fallbackError, setFallbackError] = useState<string>("");

  const selected = useMemo(() => {
    const found = AGENT_CATALOG.find((a) => a.type === agentType);
    return found || AGENT_CATALOG.find((a) => !a.hidden) || AGENT_CATALOG[0];
  }, [agentType]);

  // Only founders can edit agents
  const canManage = useMemo(
    () => isFounder,
    [isFounder]
  );

  // Insert core concept explanation at the top of the page
  // ...existing code...

  // Filter available agents based on plan or founder status
  const availableAgents = useMemo(() => {
    const visible = AGENT_CATALOG.filter((agent) => {
      // Hide anything not explicitly allowed for UI purchase/display
      if (!VISIBLE_AGENT_TYPES.has(agent.type) && !agent.hidden) return false;
      if (isFounder) return true;
      if (agent.hidden) return false;
      if (agent.requiresPlan === "sovereign" && userPlan !== "sovereign") return false;
      return true;
    });

    if (isFounder || userPlan === "sovereign") return visible;

    const planLimit = PLAN_LIMITS[userPlan]?.agents || 3;
    const base = visible.filter((a) => !a.addOn).slice(0, planLimit);
    const addOns = visible.filter((a) => a.addOn);
    return [...base, ...addOns];
  }, [isFounder, userPlan]);

  // Set initial agent type when available agents are computed
  useEffect(() => {
    if (availableAgents.length > 0 && !agentType) {
      setAgentType(availableAgents[0].type);
    }
  }, [availableAgents, agentType]);

  async function loadAgents(wsId: string) {
    const q = query(
      collection(db, "agents"),
      where("workspaceId", "==", wsId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    const rows: AgentDoc[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        workspaceId: data.workspaceId,
        name: data.name,
        type: data.type,
        duty: data.duty,
        status: data.status,
      };
    });

    setAgents(rows);
  }

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setFallbackError("You are not logged in. Please log in to continue.");
      setLoading(false);
      return;
    }
    if (!guardWorkspaceId) {
      setFallbackError("No workspace selected. Please select a workspace.");
      setLoading(false);
      return;
    }

    const currentUser = user;

    async function initAgents() {
      setLoading(true);
      setStatusMsg("");

      try {
        // Check if user is a founder
        const tokenResult = await currentUser.getIdTokenResult();
        const founder = tokenResult.claims.founder === true;
        setIsFounder(founder);

        // Find membership
        const memQ = query(
          collection(db, "workspace_members"),
          where("userId", "==", currentUser.uid),
          where("workspaceId", "==", guardWorkspaceId)
        );
        const memSnap = await getDocs(memQ);

        if (memSnap.empty) {
          setFallbackError("No workspace membership found. Please contact your admin or join a workspace.");
          setLoading(false);
          return;
        }

        const mem = memSnap.docs[0].data() as any;
        const role = mem.role as "owner" | "admin" | "member";
        setMyRole(role);

        // Get user's plan
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPlan((userData.plan || "foundation").toLowerCase());
        }

        if (typeof guardWorkspaceId === 'string') {
          await loadAgents(guardWorkspaceId);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading agents:", error);
        setFallbackError("Error loading agents. Please try again or contact support.");
        setLoading(false);
      }
    }

    initAgents();
  }, [isReady, user, guardWorkspaceId]);
  // Fallback error UI
  if (!guardWorkspaceId) {
    return (
      <div style={{
        background: '#fffde7',
        border: '2px solid #fbc02d',
        borderRadius: 12,
        padding: 32,
        margin: '48px auto',
        maxWidth: 480,
        color: '#f57c00',
        fontSize: 18,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(251, 192, 45, 0.07)'
      }}>
        <b>No workspace selected</b>
        <br />
        <br />
        <p style={{ fontSize: 15, marginBottom: 16 }}>
          Please select or create a workspace to continue.
        </p>
        <button style={{
          background: '#fbc02d',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 16,
          cursor: 'pointer'
        }} onClick={() => window.location.href = '/app/workspaces'}>
          Go to Workspaces
        </button>
      </div>
    );
  }
  if (fallbackError) {
    return (
      <div style={{
        background: '#ffebee',
        border: '2px solid #c62828',
        borderRadius: 12,
        padding: 24,
        margin: '48px auto',
        maxWidth: 480,
        color: '#b71c1c',
        fontSize: 18,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(198, 40, 40, 0.07)'
      }}>
        <b>Error:</b> {fallbackError}
        <br />
        <br />
        <button style={{
          background: '#c62828',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 16,
          cursor: 'pointer'
        }} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // Timeout fallback for loading
  if (loading && !timedOut) {
    console.log("[PAGE] still loading", { loading, workspaceId: guardWorkspaceId, user: !!user });
    return <div style={{ padding: 32, textAlign: 'center' }}><b>Loading agents</b></div>;
  }
  if (loading && timedOut) {
    return (
      <div className="p-6" style={{ textAlign: 'center', marginTop: 48 }}>
        <h2 className="font-semibold">Still loading after 8 seconds</h2>
        <p className="text-sm opacity-80">
          This usually means workspace/auth or an API call is stuck. Check console + network.
        </p>
      </div>
    );
  }

  async function createAgent() {
    // If selected agent is a premium add-on, route to billing with agent info
    if (selected && isPremiumAddonAgent(selected.type)) {
      // Example: price lookup (replace with actual logic if needed)
      const agentPrice = selected.price || 129; // fallback/default price
      router.push(`/app/billing?agentType=${encodeURIComponent(selected.type)}&price=${agentPrice}`);
      return;
    }
    setStatusMsg("");

    if (!canManage) {
      setStatusMsg("Only owners/admins can add agents.");
      return;
    }

    if (!guardWorkspaceId) {
      setStatusMsg("No workspace selected.");
      return;
    }

    if (!agentType || !selected) {
      setStatusMsg("Please select an agent type.");
      return;
    }

    const name = agentName.trim() || selected.label;
    const duty = selected.duty;

    await addDoc(collection(db, "agents"), {
      workspaceId: guardWorkspaceId,
      name,
      type: selected.type,
      duty,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setAgentName("");
    setStatusMsg(` Added agent: ${name}`);

    await loadAgents(guardWorkspaceId);
  }

  async function toggleAgent(agent: AgentDoc) {
    if (!canManage) return;

    const nextStatus = agent.status === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "agents", agent.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    if (guardWorkspaceId) await loadAgents(guardWorkspaceId);
  }

  if (!isReady) {
    return <GuardLoadingScreen />;
  }

  if (!isAuthorized || !guardWorkspaceId) {
    return null; // Guard will redirect
  }

  return (
    <main
      style={{
        maxWidth: 1180,
        margin: "32px auto 64px",
        padding: 24,
        background:
          "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.08), transparent 32%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.08), transparent 28%), #ffffff",
        borderRadius: 24,
        boxShadow: "0 18px 60px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            border: "1px solid #d0d0d0",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
           Back
        </button>
      </div>
      <div
        style={{
          padding: "18px 22px",
          borderRadius: 16,
          background: "linear-gradient(120deg, #0ea5e9 0%, #6366f1 55%, #8b5cf6 100%)",
          color: "#fff",
          boxShadow: "0 16px 40px rgba(99,102,241,0.32)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>Agent Registry</div>
          <div style={{ opacity: 0.9, marginTop: 4 }}>
            Add, manage, and activate the right specialists for your workspace.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.12)", fontWeight: 700 }}>
            Workspace: {guardWorkspaceId?.slice(0, 8)}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.12)", fontWeight: 700 }}>
            Role: {myRole || "member"}
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.12)", fontWeight: 700 }}>
              Plan: {userPlan || "accelerate"}
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ marginTop: 16, opacity: 0.75 }}>Loading agents</p>
      ) : (
        <>
          {guardWorkspaceId && <ConstraintAlert workspaceId={guardWorkspaceId} />}
          <InsightDropCard context="agents" />

          <section style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Available Agents</h2>
                <p style={{ marginTop: 6, opacity: 0.7 }}>Select an agent to add it to your workspace.</p>
              </div>
              <div style={{ fontSize: 13, color: "#0f172a", background: "#e0f2fe", padding: "8px 12px", borderRadius: 10, fontWeight: 700 }}>
                {availableAgents.length} visible  {PLAN_LIMITS[userPlan]?.agents || 3} included in your plan
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                marginTop: 14,
              }}
            >
              {availableAgents.map((agent) => {
                // Add-on agent price lookup (sync with billing page)
                const ADDON_AGENT_PRICES: Record<string, number> = {
                  Content_Writer: 129,
                  Video_Script_Generator: 28,
                  Email_Sequence_Strategist: 27,
                  Social_Analytics_Pro: 42,
                  Brand_Architect: 49,
                  Community_Manager: 35,
                  UGC_Creator: 19,
                  Email_Marketer: 25,
                  Product_Copywriter: 22,
                  Closer: 39,
                  Webinar_Scripter: 29,
                  Thought_Leader: 59,
                  Review_Generator: 18,
                  Local_SEO_Specialist: 24,
                  Review_Responder: 79,
                };
                const isLockedAddOn = !isFounder && agent.addOn && userPlan !== "elite";
                const isAddOn = !!agent.addOn;
                const price = isAddOn ? ADDON_AGENT_PRICES[agent.type] : undefined;
                return (
                  <div
                    key={agent.type}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 14,
                      background: "#fff",
                      boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 22 }}>{agent.label.split(" ")[0]}</div>
                        <div>
                          <div style={{ fontWeight: 800 }}>{agent.label.replace(/^[^\s]+\s/, "") || agent.label}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {isAddOn && (
                              <span style={{ fontSize: 11, color: isLockedAddOn ? "#b91c1c" : "#0f172a", fontWeight: 800, background: "#fee2e2", padding: "2px 8px", borderRadius: 10 }}>
                                {isLockedAddOn ? "Locked add-on" : "Add-On"}
                              </span>
                            )}
                            {agent.requiresPlan === "elite" && !isAddOn && (
                              <span style={{ fontSize: 11, color: "#0f766e", fontWeight: 800, background: "#ccfbf1", padding: "2px 8px", borderRadius: 10 }}>Elite</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Add-on price and purchase link */}
                      {isAddOn && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900, color: "#0ea5e9", fontSize: 15 }}>
                            ${price} <span style={{ fontWeight: 500, fontSize: 12, color: '#64748b' }}>/month</span>
                          </div>
                          <a
                            href={`/app/billing?agentType=${encodeURIComponent(agent.type)}&price=${price}`}
                            style={{
                              display: "inline-block",
                              marginTop: 2,
                              fontSize: 12,
                              color: "#2563eb",
                              fontWeight: 800,
                              textDecoration: "underline",
                              cursor: "pointer",
                              opacity: isLockedAddOn ? 0.5 : 1,
                              pointerEvents: isLockedAddOn ? "none" : "auto",
                            }}
                            title={isLockedAddOn ? "Purchase add-on to unlock" : `Purchase for $${price} per month`}
                          >
                            {isLockedAddOn ? "Locked" : "Purchase (Monthly)"}
                          </a>
                        </div>
                      )}
                    </div>
                    <p style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>{agent.duty}</p>
                    <button
                      onClick={() => setAgentType(agent.type)}
                      disabled={!canManage || isLockedAddOn}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        background: isLockedAddOn
                          ? "#f1f5f9"
                          : agentType === agent.type
                          ? "#0ea5e9"
                          : "#f8fafc",
                        color: isLockedAddOn
                          ? "#94a3b8"
                          : agentType === agent.type
                          ? "#fff"
                          : "#0f172a",
                        fontWeight: 800,
                        cursor: canManage && !isLockedAddOn ? "pointer" : "not-allowed",
                        opacity: canManage && !isLockedAddOn ? 1 : 0.6,
                      }}
                      title={
                        isLockedAddOn
                          ? "Purchase add-on to unlock"
                          : canManage
                          ? "Select agent"
                          : "Owners/admins only"
                      }
                    >
                      {isLockedAddOn ? "Locked" : agentType === agent.type ? "Selected" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ marginTop: 28, padding: 16, border: "1px solid #e2e8f0", borderRadius: 14, background: "#f8fafc" }}>
            <h2 style={{ fontSize: 18, fontWeight: 900 }}>Add an agent</h2>
            {!canManage && (
              <p style={{ marginTop: 8, opacity: 0.75 }}>
                Only owners/admins can create agents.
              </p>
            )}
            {userPlan !== "sovereign" && !isFounder && (
              <p style={{ marginTop: 8, padding: 10, background: "#fff3cd", borderRadius: 6, fontSize: 14 }}>
                 Your <b>{userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}</b> plan includes {PLAN_LIMITS[userPlan]?.agents || 3} agents and {PLAN_LIMITS[userPlan]?.templates || 3} templates. Upgrade to <b>Sovereign</b> or purchase add-ons to unlock more.
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <select
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
                style={{ padding: 10, minWidth: 240 }}
                disabled={!canManage}
              >
                {availableAgents.map((a) => (
                  <option key={a.type} value={a.type}>
                    {a.label}
                  </option>
                ))}
              </select>

              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={`Optional custom name (default: ${selected.label})`}
                style={{ padding: 10, flex: 1, minWidth: 260 }}
                disabled={!canManage}
              />

              <button onClick={createAgent} style={{ padding: "10px 14px", fontWeight: 900 }} disabled={!canManage}>
                Add Agent
              </button>
            </div>

            <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#fff" }}>
              <div style={{ fontWeight: 900 }}>{selected.label}  Duty</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>{selected.duty}</div>
            </div>

            {statusMsg && <p style={{ marginTop: 10 }}>{statusMsg}</p>}
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900 }}>Agents in this workspace</h2>

            <div style={{ marginTop: 10, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr", gap: 10, padding: 12, fontWeight: 900, background: "#f8fafc" }}>
                <div>Agent</div>
                <div>Type</div>
                <div>Status</div>
              </div>

              {agents.map((a) => (
                <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr", gap: 10, padding: 12, borderTop: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{a.name}</div>
                    <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>{a.duty}</div>
                  </div>
                  <div style={{ opacity: 0.85 }}>{a.type}</div>
                  <div>
                    <button
                      onClick={() => toggleAgent(a)}
                      disabled={!canManage}
                      style={{
                        padding: "8px 10px",
                        fontWeight: 900,
                        backgroundColor: a.status === "active" ? "#22c55e" : "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: canManage ? "pointer" : "not-allowed",
                        opacity: canManage ? 1 : 0.5,
                      }}
                      title={canManage ? "Toggle active/inactive" : "No permission"}
                    >
                      {a.status}
                    </button>
                  </div>
                </div>
              ))}

              {agents.length === 0 && <div style={{ padding: 12 }}>No agents yet. Add your first agent above.</div>}
            </div>
          </section>

          <div style={{ marginTop: 18, padding: 14, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
            <div style={{ fontWeight: 800 }}>Plan note</div>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>
              Agent and template counts vary by plan:<br/>
              Foundation: 3 agents, 3 templates. Accelerate: 6 agents, 10 templates. Dominion: 10 agents, 15 templates. Sovereign: 15 agents, unlimited templates.<br/>
              <b>Additional agents and templates can be purchased as add-ons; all add-on prices are monthly recurring and will be billed each month.</b> Pricing varies per agent/template.
            </div>
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/app" style={{ fontWeight: 900 }}> Back to Dashboard</a>
            <a href="/app/team" style={{ fontWeight: 900 }}>Team</a>
          </div>
        </>
      )}
    </main>
  );
}

