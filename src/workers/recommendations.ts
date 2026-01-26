// src/workers/recommendations.ts
type Rec = {
  type: "pack" | "specialty_agent";
  key: string; // pack key or agentType
  title: string;
  why: string;
  estimatedImpact: string;
  priceMonthly: number;
  confidence: number; // 0..1
};

type WorkspaceSignals = {
  manualFollowupsCount7d: number;
  unansweredLeadsCount7d: number;
  avgResponseTimeMin7d: number;
  appointmentsRequested7d: number;
  appointmentsBooked7d: number;
  campaignRequests7d: number;
  repurposeRequests7d: number;
  multiClientUsage7d: number;
};

type Entitlements = {
  allowedAgentTypes: Set<string>;
  packsEnabled: Set<string>; // salesAutomation, marketingIntelligence, agency
  specialtyEnabled: Set<string>; // agentTypes
  basePlan: "starter" | "pro" | "enterprise" | "founder";
};

export function recommendUnlocks(signals: WorkspaceSignals, ent: Entitlements): Rec[] {
  const recs: Rec[] = [];

  // ---- Sales Automation Pack recommendation
  const needsFollowups = signals.manualFollowupsCount7d >= 12 || signals.unansweredLeadsCount7d >= 8;
  const needsScheduling = signals.appointmentsRequested7d >= 4 && signals.appointmentsBooked7d < signals.appointmentsRequested7d;

  if (!ent.packsEnabled.has("salesAutomation") && (needsFollowups || needsScheduling)) {
    recs.push({
      type: "pack",
      key: "salesAutomation",
      title: "Sales Automation Pack",
      why:
        `You have ${signals.manualFollowupsCount7d} manual follow-ups and ` +
        `${signals.unansweredLeadsCount7d} unanswered leads in the last 7 days.`,
      estimatedImpact: "Automate follow-ups + booking to reduce lead drop-off and increase appointments.",
      priceMonthly: 99,
      confidence: Math.min(0.95, 0.55 + (signals.manualFollowupsCount7d / 40)),
    });
  }

  // ---- Marketing Intelligence Pack recommendation
  const needsMarketing = signals.campaignRequests7d >= 3 || signals.repurposeRequests7d >= 6;
  if (!ent.packsEnabled.has("marketingIntelligence") && needsMarketing) {
    recs.push({
      type: "pack",
      key: "marketingIntelligence",
      title: "Marketing Intelligence Pack",
      why:
        `You requested ${signals.campaignRequests7d} campaigns and ${signals.repurposeRequests7d} repurpose actions in the last 7 days.`,
      estimatedImpact: "Generate campaigns + repurpose content automatically and improve performance with insights.",
      priceMonthly: 149,
      confidence: Math.min(0.92, 0.50 + (signals.repurposeRequests7d / 30)),
    });
  }

  // ---- Agency Pack recommendation
  if (!ent.packsEnabled.has("agency") && signals.multiClientUsage7d >= 5) {
    recs.push({
      type: "pack",
      key: "agency",
      title: "Agency Pack",
      why: `You operated across multiple clients/brands ${signals.multiClientUsage7d} times in the last 7 days.`,
      estimatedImpact: "Enable client routing + agency orchestration + reusable templates to scale delivery.",
      priceMonthly: 299,
      confidence: Math.min(0.90, 0.55 + (signals.multiClientUsage7d / 20)),
    });
  }

  // ---- Specialty agent recommendations (examples)
  // If base plan doesn't include estimate_builder, recommend it when scheduling + quoting is frequent.
  const needsEstimates = signals.appointmentsRequested7d >= 5; // placeholder signal
  if (!ent.specialtyEnabled.has("estimate_builder") && needsEstimates) {
    recs.push({
      type: "specialty_agent",
      key: "estimate_builder",
      title: "Specialty Agent: Estimate Builder",
      why: "You're booking enough appointments that quote/estimate creation becomes repetitive.",
      estimatedImpact: "Reduce estimating time and standardize pricing/line items.",
      priceMonthly: 49,
      confidence: 0.72,
    });
  }

  // Sort: highest confidence first, return top 3
  return recs.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
