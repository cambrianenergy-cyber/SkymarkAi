// Insight Drops - Strategic perspective built into the app

export interface InsightDrop {
  id: string;
  context: 'workflow-builder' | 'campaign-creator' | 'asset-repurpose' | 'dashboard' | 'agents' | 'inbox';
  title: string;
  message: string;
  category: 'strategy' | 'best-practice' | 'warning' | 'tip';
}

export const INSIGHT_DROPS: InsightDrop[] = [
  // Workflow Builder Insights
  {
    id: 'wf-1',
    context: 'workflow-builder',
    title: 'Why this works',
    message: 'The best workflows follow a rhythm: create  distribute  engage  convert. Each step should make the next one easier.',
    category: 'strategy',
  },
  {
    id: 'wf-2',
    context: 'workflow-builder',
    title: 'Avoid this mistake',
    message: 'Most businesses automate too early. Build the workflow manually first, then automate the parts that work.',
    category: 'warning',
  },
  {
    id: 'wf-3',
    context: 'workflow-builder',
    title: 'Pro tip',
    message: 'Add a "human check" step before any outbound messaging. AI is great, but a 5-second review prevents embarrassing mistakes.',
    category: 'tip',
  },
  {
    id: 'wf-4',
    context: 'workflow-builder',
    title: 'Strategic insight',
    message: 'The best workflows compound. Each run should leave you in a better positionmore content, better relationships, deeper insights.',
    category: 'strategy',
  },

  // Campaign Creator Insights
  {
    id: 'camp-1',
    context: 'campaign-creator',
    title: 'What most get wrong',
    message: 'Campaigns fail when they optimize for outputs (posts, emails) instead of outcomes (replies, calls, revenue).',
    category: 'warning',
  },
  {
    id: 'camp-2',
    context: 'campaign-creator',
    title: 'Strategic insight',
    message: 'The best campaigns teach your audience something valuable before asking for anything. Build trust first, sell second.',
    category: 'strategy',
  },
  {
    id: 'camp-3',
    context: 'campaign-creator',
    title: 'Pro tip',
    message: 'Test hooks before scaling. Run 3 variations to 10 people each, then 10x the winner.',
    category: 'tip',
  },
  {
    id: 'camp-4',
    context: 'campaign-creator',
    title: 'Best practice',
    message: 'Set a clear "stop condition" for every campaign. Know when to pause, pivot, or kill it.',
    category: 'best-practice',
  },

  // Asset Repurpose Insights
  {
    id: 'asset-1',
    context: 'asset-repurpose',
    title: 'Why repurposing works',
    message: 'Your best content deserves to be seen 10+ times. Each platform and format reaches a different audience segment.',
    category: 'strategy',
  },
  {
    id: 'asset-2',
    context: 'asset-repurpose',
    title: 'Common mistake',
    message: 'Don\'t just copy-paste. Adapt the message to each platform\'s cultureLinkedIn wants insights, Twitter wants hot takes, Instagram wants visuals.',
    category: 'warning',
  },
  {
    id: 'asset-3',
    context: 'asset-repurpose',
    title: 'Pro tip',
    message: 'Start with your best-performing content. If it worked once, it\'ll work again in different formats.',
    category: 'tip',
  },

  // Dashboard Insights
  {
    id: 'dash-1',
    context: 'dashboard',
    title: 'Strategic insight',
    message: 'Track outcomes, not outputs. 100 posts mean nothing if they don\'t lead to calls, deals, or revenue.',
    category: 'strategy',
  },
  {
    id: 'dash-2',
    context: 'dashboard',
    title: 'Best practice',
    message: 'Review your attribution report weekly. The patterns you see will reshape your entire strategy.',
    category: 'best-practice',
  },
  {
    id: 'dash-3',
    context: 'dashboard',
    title: 'Pro tip',
    message: 'If a workflow hasn\'t produced outcomes in 5 runs, pause it. Double down on what works, kill what doesn\'t.',
    category: 'tip',
  },

  // Agents Insights
  {
    id: 'agent-1',
    context: 'agents',
    title: 'Agent strategy',
    message: 'Specialized agents outperform generalists. Don\'t create one "marketing agent"create separate agents for copywriting, outreach, and engagement.',
    category: 'strategy',
  },
  {
    id: 'agent-2',
    context: 'agents',
    title: 'Common mistake',
    message: 'Over-customizing agents leads to inconsistency. Set clear rules, then trust them to execute.',
    category: 'warning',
  },
  {
    id: 'agent-3',
    context: 'agents',
    title: 'Pro tip',
    message: 'Give agents examples of your best work. "Write like this" is more powerful than "write about this".',
    category: 'tip',
  },

  // Inbox Insights
  {
    id: 'inbox-1',
    context: 'inbox',
    title: 'Strategic insight',
    message: 'Your inbox is your revenue center. Every conversation is an opportunity to learn, sell, or build a relationship.',
    category: 'strategy',
  },
  {
    id: 'inbox-2',
    context: 'inbox',
    title: 'Best practice',
    message: 'Respond within 5 minutes when possible. Speed-to-lead is the #1 predictor of conversion.',
    category: 'best-practice',
  },
  {
    id: 'inbox-3',
    context: 'inbox',
    title: 'Pro tip',
    message: 'Tag and segment conversations. Your highest-value leads deserve different treatment than tire-kickers.',
    category: 'tip',
  },
];

export function getInsightsForContext(context: InsightDrop['context']): InsightDrop[] {
  return INSIGHT_DROPS.filter(i => i.context === context);
}

export function getRandomInsight(context: InsightDrop['context']): InsightDrop | null {
  const insights = getInsightsForContext(context);
  if (insights.length === 0) return null;
  return insights[Math.floor(Math.random() * insights.length)];
}

