// Industry Playbooks - Pre-built business systems
// Added 8 new template playbooks below

export const EXTRA_TEMPLATES = [
  {
    id: 'template-1',
    title: 'Social Media Blitz',
    description: 'Automate daily posts and engagement across all major platforms.',
    price: 20,
  },
  {
    id: 'template-2',
    title: 'Email Drip Master',
    description: 'Set up high-converting email drip campaigns for any audience.',
    price: 20,
  },
  {
    id: 'template-3',
    title: 'Ad Campaign Launcher',
    description: 'Launch and optimize paid ad campaigns with AI recommendations.',
    price: 20,
  },
  {
    id: 'template-4',
    title: 'Content Repurposer',
    description: 'Repurpose blog posts, videos, and podcasts for new channels.',
    price: 20,
  },
  {
    id: 'template-5',
    title: 'Lead Magnet Builder',
    description: 'Create and deliver lead magnets to grow your email list.',
    price: 20,
  },
  {
    id: 'template-6',
    title: 'Webinar Funnel',
    description: 'Automate webinar registration, reminders, and follow-up.',
    price: 20,
  },
  {
    id: 'template-7',
    title: 'Review Booster',
    description: 'Automate review requests and reputation management.',
    price: 20,
  },
  {
    id: 'template-8',
    title: 'Referral Engine',
    description: 'Launch referral programs and track results automatically.',
    price: 20,
  },
];

// status: 'public' | 'locked'
// price: number | undefined
// founderAccess: boolean (true = always unlocked for founders)

export const INDUSTRY_PLAYBOOKS = [
  {
    id: 'local-service-business',
    industry: 'Local Services',
    title: 'Local Service Business Playbook',
    description: 'Complete growth system for contractors, consultants, and service providers targeting local markets.',
    agentPresets: [
      { agentType: 'Local_SEO_Specialist', configuration: { focus: 'Google Business Profile + local keywords' }, priority: 1 },
      { agentType: 'Review_Generator', configuration: { platforms: ['Google', 'Yelp'] }, priority: 2 },
      { agentType: 'Community_Manager', configuration: { channels: ['Facebook', 'Nextdoor'] }, priority: 3 },
    ],
    messagingFrameworks: [
      {
        scenario: 'Initial Outreach',
        template: 'Hi [Name], I noticed you recently [trigger]. We help [audience] [outcome]. Would a quick 15-min call be helpful?',
        variables: ['name', 'trigger', 'audience', 'outcome'],
        tone: 'friendly, local, helpful',
      },
      {
        scenario: 'Follow-up After No Response',
        template: 'Hey [Name], I know you are busy. Just wanted to check if you would like a quick quote for [service]? No pressure.',
        variables: ['name', 'service'],
        tone: 'casual, respectful',
      },
    ],
    cadence: {
      phase1: { duration: 'Week 1-2', actions: ['Set up Google Business Profile', 'Request 10 reviews', 'Post 3x/week local content'] },
      phase2: { duration: 'Week 3-4', actions: ['Launch Facebook ads to local audience', 'Start outreach via Nextdoor', 'Automate review requests'] },
      phase3: { duration: 'Month 2+', actions: ['Scale ads', 'Add referral program', 'Expand service area'] },
    },
    kpiExpectations: [
      { metric: 'Qualified Leads', target: 15, timeframe: 'per month' },
      { metric: 'Booked Appointments', target: 8, timeframe: 'per month' },
      { metric: 'Average Deal Size', target: 1500, timeframe: 'per deal' },
    ],
    status: 'public' as const,
    price: undefined,
    founderAccess: false,
    installCount: 0,
  },
  {
    id: 'ecommerce-brand',
    industry: 'E-Commerce',
    title: 'E-commerce Brand Growth Stack',
    description: 'Multi-channel growth system for DTC brands: ads, email, content, and retention.',
    agentPresets: [
      { agentType: 'Product_Copywriter', configuration: { style: 'benefit-driven, persuasive' }, priority: 1 },
      { agentType: 'Email_Marketer', configuration: { sequences: ['welcome', 'cart-abandon', 'win-back'] }, priority: 2 },
      { agentType: 'UGC_Creator', configuration: { platforms: ['Instagram', 'TikTok'] }, priority: 3 },
    ],
    messagingFrameworks: [
      {
        scenario: 'Welcome Email',
        template: 'Welcome to [Brand]! Here is [discount] off your first order. Use code [code].',
        variables: ['brand', 'discount', 'code'],
        tone: 'excited, generous',
      },
      {
        scenario: 'Cart Abandonment',
        template: 'You left [item] behind. Complete your order in the next 2 hours and get free shipping.',
        variables: ['item'],
        tone: 'urgent, helpful',
      },
    ],
    cadence: {
      phase1: { duration: 'Week 1-2', actions: ['Set up email sequences', 'Launch Facebook + Instagram ads', 'Create 10 product posts'] },
      phase2: { duration: 'Week 3-4', actions: ['Add TikTok ads', 'Launch influencer outreach', 'Start UGC collection'] },
      phase3: { duration: 'Month 2+', actions: ['Expand ad spend', 'Add SMS marketing', 'Launch referral program'] },
    },
    kpiExpectations: [
      { metric: 'Monthly Revenue', target: 50000, timeframe: 'per month' },
      { metric: 'ROAS (Return on Ad Spend)', target: 3.5, timeframe: 'per campaign' },
      { metric: 'Email Open Rate', target: 25, timeframe: 'per email' },
    ],
    status: 'public' as const,
    price: undefined,
    founderAccess: false,
    installCount: 0,
  },
  {
    id: 'high-ticket-coach',
    industry: 'Coaching & Consulting',
    title: 'High-Ticket Coach Funnel System',
    description: 'Authority-building + conversion funnel for coaches, consultants, and high-ticket service providers.',
    agentPresets: [
      { agentType: 'Thought_Leader', configuration: { platforms: ['LinkedIn', 'Twitter'], voice: 'expert' }, priority: 1 },
      { agentType: 'Webinar_Scripter', configuration: { structure: 'story + teach + pitch' }, priority: 2 },
      { agentType: 'Closer', configuration: { style: 'consultative, low-pressure' }, priority: 3 },
    ],
    messagingFrameworks: [
      {
        scenario: 'LinkedIn Outreach',
        template: 'Hi [Name], I saw your post about [topic]. We help [audience] [outcome]. Would a 20-min strategy call be valuable?',
        variables: ['name', 'topic', 'audience', 'outcome'],
        tone: 'professional, consultative',
      },
      {
        scenario: 'Webinar Invite',
        template: 'You are invited: Free training on [topic]. Learn the 3-step system to [outcome]. Register here: [link]',
        variables: ['topic', 'outcome', 'link'],
        tone: 'authoritative, value-driven',
      },
    ],
    cadence: {
      phase1: { duration: 'Week 1-2', actions: ['Post 5x/week on LinkedIn', 'Engage with 20 prospects/day', 'Launch lead magnet'] },
      phase2: { duration: 'Week 3-4', actions: ['Host first webinar', 'Book 10 strategy calls', 'Launch email nurture sequence'] },
      phase3: { duration: 'Month 2+', actions: ['Scale webinar ads', 'Add referral bonuses', 'Launch group program'] },
    },
    kpiExpectations: [
      { metric: 'Booked Calls', target: 20, timeframe: 'per month' },
      { metric: 'Show Rate', target: 70, timeframe: 'percentage' },
      { metric: 'Close Rate', target: 30, timeframe: 'percentage' },
    ],
    status: 'public' as const,
    price: undefined,
    founderAccess: false,
    installCount: 0,
  },

  // --- Locked Playbooks ($20/mo, founder full access) ---
  {
    id: 'b2b-lead-machine',
    industry: 'B2B',
    title: 'B2B Lead Machine',
    description: 'Automated outbound, LinkedIn, and email for B2B SaaS and services.',
    agentPresets: [
      { agentType: 'Outbound_Prospector', configuration: { channels: ['LinkedIn', 'Email'] }, priority: 1 },
      { agentType: 'Meeting_Booker', configuration: { method: 'calendar automation' }, priority: 2 },
      { agentType: 'Followup_Sequencer', configuration: { steps: 5 }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Import leads', 'Send 1st touch', 'Connect on LinkedIn'] },
      phase2: { duration: 'Week 2', actions: ['Send follow-ups', 'Book meetings', 'Qualify leads'] },
      phase3: { duration: 'Month 2+', actions: ['Scale outreach', 'Automate handoff', 'Refine ICP'] },
    },
    kpiExpectations: [
      { metric: 'Meetings Booked', target: 12, timeframe: 'per month' },
      { metric: 'Response Rate', target: 18, timeframe: 'percent' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'real-estate-growth',
    industry: 'Real Estate',
    title: 'Real Estate Growth Engine',
    description: 'Lead gen, nurture, and open house automation for agents and teams.',
    agentPresets: [
      { agentType: 'Listing_Optimizer', configuration: { platform: 'Zillow' }, priority: 1 },
      { agentType: 'OpenHouse_Bot', configuration: { reminders: true }, priority: 2 },
      { agentType: 'Lead_Nurturer', configuration: { drip: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Optimize listings', 'Send open house invites'] },
      phase2: { duration: 'Week 2', actions: ['Follow up with attendees', 'Nurture leads'] },
      phase3: { duration: 'Month 2+', actions: ['Automate reminders', 'Expand to new zip codes'] },
    },
    kpiExpectations: [
      { metric: 'Leads Generated', target: 30, timeframe: 'per month' },
      { metric: 'Showings Booked', target: 10, timeframe: 'per month' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'healthcare-patient-flow',
    industry: 'Healthcare',
    title: 'Healthcare Patient Flow Suite',
    description: 'Automate patient reminders, intake, and follow-up for clinics.',
    agentPresets: [
      { agentType: 'Appointment_Reminder', configuration: { sms: true }, priority: 1 },
      { agentType: 'Intake_Form_Bot', configuration: { digital: true }, priority: 2 },
      { agentType: 'Followup_Scheduler', configuration: { aftercare: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Send reminders', 'Collect intake forms'] },
      phase2: { duration: 'Week 2', actions: ['Automate follow-ups', 'Reduce no-shows'] },
      phase3: { duration: 'Month 2+', actions: ['Expand to new services', 'Analyze patient flow'] },
    },
    kpiExpectations: [
      { metric: 'No-Show Rate', target: 5, timeframe: 'percent' },
      { metric: 'Patient Retention', target: 90, timeframe: 'percent' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'restaurant-marketing',
    industry: 'Restaurants',
    title: 'Restaurant Marketing Suite',
    description: 'Automate reviews, loyalty, and local ads for restaurants and cafes.',
    agentPresets: [
      { agentType: 'Review_Requester', configuration: { platforms: ['Google', 'Yelp'] }, priority: 1 },
      { agentType: 'Loyalty_Program_Bot', configuration: { sms: true }, priority: 2 },
      { agentType: 'Ad_Manager', configuration: { geo: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Request reviews', 'Launch loyalty program'] },
      phase2: { duration: 'Week 2', actions: ['Run local ads', 'Promote offers'] },
      phase3: { duration: 'Month 2+', actions: ['Expand loyalty', 'Optimize ad spend'] },
    },
    kpiExpectations: [
      { metric: 'Repeat Visits', target: 20, timeframe: 'per month' },
      { metric: 'Review Count', target: 15, timeframe: 'per month' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'agency-automation',
    industry: 'Agencies',
    title: 'Agency Automation Toolkit',
    description: 'Client onboarding, reporting, and fulfillment for digital agencies.',
    agentPresets: [
      { agentType: 'Client_Onboarder', configuration: { checklist: true }, priority: 1 },
      { agentType: 'Report_Generator', configuration: { frequency: 'monthly' }, priority: 2 },
      { agentType: 'Task_Delegator', configuration: { autoAssign: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Onboard clients', 'Set up reporting'] },
      phase2: { duration: 'Week 2', actions: ['Automate task assignment', 'Send first report'] },
      phase3: { duration: 'Month 2+', actions: ['Refine onboarding', 'Scale reporting'] },
    },
    kpiExpectations: [
      { metric: 'Client Retention', target: 95, timeframe: 'percent' },
      { metric: 'Onboarding Time', target: 2, timeframe: 'days' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'influencer-campaigns',
    industry: 'Influencer',
    title: 'Influencer Campaign Launcher',
    description: 'Automate outreach, gifting, and campaign tracking for influencer marketing.',
    agentPresets: [
      { agentType: 'Outreach_Bot', configuration: { platforms: ['Instagram', 'TikTok'] }, priority: 1 },
      { agentType: 'Gift_Sender', configuration: { autoShip: true }, priority: 2 },
      { agentType: 'Campaign_Tracker', configuration: { kpis: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Send outreach', 'Ship gifts'] },
      phase2: { duration: 'Week 2', actions: ['Track campaign', 'Collect content'] },
      phase3: { duration: 'Month 2+', actions: ['Scale outreach', 'Analyze ROI'] },
    },
    kpiExpectations: [
      { metric: 'Influencer Responses', target: 25, timeframe: 'per month' },
      { metric: 'Campaign ROI', target: 4, timeframe: 'x' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'saas-growth',
    industry: 'SaaS',
    title: 'SaaS Growth Accelerator',
    description: 'Trial conversion, onboarding, and churn reduction for SaaS products.',
    agentPresets: [
      { agentType: 'Trial_Converter', configuration: { sequence: 'email' }, priority: 1 },
      { agentType: 'Onboarding_Bot', configuration: { checklist: true }, priority: 2 },
      { agentType: 'Churn_Predictor', configuration: { alerts: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Send onboarding emails', 'Guide new users'] },
      phase2: { duration: 'Week 2', actions: ['Monitor usage', 'Send conversion offers'] },
      phase3: { duration: 'Month 2+', actions: ['Predict churn', 'Automate win-backs'] },
    },
    kpiExpectations: [
      { metric: 'Trial Conversion', target: 30, timeframe: 'percent' },
      { metric: 'Churn Rate', target: 5, timeframe: 'percent' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'event-promotion',
    industry: 'Events',
    title: 'Event Promotion Suite',
    description: 'Automate RSVPs, reminders, and post-event follow-up for events and webinars.',
    agentPresets: [
      { agentType: 'RSVP_Bot', configuration: { sms: true }, priority: 1 },
      { agentType: 'Reminder_Sender', configuration: { email: true }, priority: 2 },
      { agentType: 'Followup_Bot', configuration: { survey: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Send invites', 'Track RSVPs'] },
      phase2: { duration: 'Week 2', actions: ['Send reminders', 'Prepare event'] },
      phase3: { duration: 'Month 2+', actions: ['Send follow-up', 'Collect feedback'] },
    },
    kpiExpectations: [
      { metric: 'RSVP Rate', target: 60, timeframe: 'percent' },
      { metric: 'Feedback Collected', target: 40, timeframe: 'percent' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'membership-marketing',
    industry: 'Membership',
    title: 'Membership Marketing Engine',
    description: 'Acquisition, onboarding, and retention for membership/subscription businesses.',
    agentPresets: [
      { agentType: 'Acquisition_Bot', configuration: { offer: 'trial' }, priority: 1 },
      { agentType: 'Onboarding_Sequence', configuration: { steps: 5 }, priority: 2 },
      { agentType: 'Retention_Manager', configuration: { checkins: true }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Launch offer', 'Start onboarding'] },
      phase2: { duration: 'Week 2', actions: ['Check in with new members', 'Send tips'] },
      phase3: { duration: 'Month 2+', actions: ['Automate retention', 'Expand offers'] },
    },
    kpiExpectations: [
      { metric: 'New Members', target: 50, timeframe: 'per month' },
      { metric: 'Retention Rate', target: 85, timeframe: 'percent' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  },
  {
    id: 'franchise-ops',
    industry: 'Franchise',
    title: 'Franchise Operations Suite',
    description: 'Standardize onboarding, training, and reporting for franchise businesses.',
    agentPresets: [
      { agentType: 'Onboarding_Manager', configuration: { checklist: true }, priority: 1 },
      { agentType: 'Training_Bot', configuration: { modules: 5 }, priority: 2 },
      { agentType: 'Reporting_Agent', configuration: { frequency: 'weekly' }, priority: 3 },
    ],
    messagingFrameworks: [],
    cadence: {
      phase1: { duration: 'Week 1', actions: ['Onboard new franchisees', 'Assign training'] },
      phase2: { duration: 'Week 2', actions: ['Monitor training', 'Collect reports'] },
      phase3: { duration: 'Month 2+', actions: ['Automate reporting', 'Refine onboarding'] },
    },
    kpiExpectations: [
      { metric: 'Onboarding Time', target: 3, timeframe: 'days' },
      { metric: 'Training Completion', target: 95, timeframe: 'percent' },
    ],
    status: 'locked',
    price: 20,
    founderAccess: true,
    installCount: 0,
  }
];

// Utility to render Buy Now button for templates
export function renderBuyNowButton(templateId: string, price: number) {
  // Return HTML string instead of JSX to avoid syntax errors in non-React context
  const style = [
    'padding:10px 24px',
    'font-size:16px',
    'font-weight:700',
    'border:none',
    'border-radius:8px',
    'background-color:#0070f3',
    'color:#fff',
    'cursor:pointer',
    'margin-top:12px'
  ].join(';');
  const href = `/app/billing/card-entry?templateId=${encodeURIComponent(templateId)}&price=${encodeURIComponent(price)}`;
  return `<button style="${style}" onclick="window.location.href='${href}'">Buy Now</button>`;
}
