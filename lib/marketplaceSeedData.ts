/**
 * MARKETPLACE SEED DATA
 * 
 * Run this script to populate your Firestore with initial workflow templates.
 * This creates 8 pre-built templates for the marketplace.
 * 
 * HOW TO USE:
 * 1. Open Firebase Console  Firestore Database
 * 2. Manually create these documents in the 'workflow_templates' collection
 * 3. OR use this as reference to create them via the Firebase Admin SDK
 */

export const SEED_TEMPLATES = [
  {
    // Template 1: Campaign Generator
    templateKey: "campaign-generator-full-launch",
    name: "Campaign Generator  Full Launch Plan",
    description: "Generate a complete multi-channel campaign plan with messaging, content ideas, and timeline for your product or service launch.",
    category: "campaigns",
    tags: ["launch", "marketing", "strategy", "multi-channel"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "research",
        instruction: "Research the target market, competitors, and audience demographics for the campaign"
      },
      {
        order: 2,
        agentType: "strategist",
        instruction: "Develop campaign messaging pillars, positioning, and key differentiators"
      },
      {
        order: 3,
        agentType: "content",
        instruction: "Generate content ideas for each channel: email, social, ads, blog posts"
      },
      {
        order: 4,
        agentType: "scheduler",
        instruction: "Create a 4-week launch timeline with daily tasks and content publish dates"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 2: Weekly Content Engine
    templateKey: "weekly-content-engine",
    name: "Weekly Content Engine",
    description: "Automated weekly content creation system that generates blog posts, social updates, and newsletters based on your brand voice and topics.",
    category: "creation",
    tags: ["content", "automation", "social media", "blog"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "researcher",
        instruction: "Scan trending topics in your industry for the week"
      },
      {
        order: 2,
        agentType: "writer",
        instruction: "Write 1 long-form blog post (1200+ words) on the most relevant trend"
      },
      {
        order: 3,
        agentType: "repurposer",
        instruction: "Break down blog post into 5 social media posts and 1 newsletter section"
      },
      {
        order: 4,
        agentType: "scheduler",
        instruction: "Schedule all content across platforms for optimal engagement times"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 3: Repurpose Engine
    templateKey: "repurpose-engine-multi-platform",
    name: "Repurpose Engine  Multi-Platform Expansion",
    description: "Take one piece of content and repurpose it into 10+ formats: Twitter threads, LinkedIn posts, Instagram carousels, YouTube scripts, and more.",
    category: "repurpose",
    tags: ["repurposing", "content", "multi-platform", "efficiency"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "analyzer",
        instruction: "Analyze the original content piece and extract key insights, quotes, and data"
      },
      {
        order: 2,
        agentType: "repurposer",
        instruction: "Create Twitter thread (8-12 tweets) from main points"
      },
      {
        order: 3,
        agentType: "repurposer",
        instruction: "Create LinkedIn post (1500 chars) with professional tone"
      },
      {
        order: 4,
        agentType: "repurposer",
        instruction: "Create Instagram carousel (10 slides) with visual-friendly text"
      },
      {
        order: 5,
        agentType: "repurposer",
        instruction: "Create YouTube video script with intro, main points, and CTA"
      },
      {
        order: 6,
        agentType: "repurposer",
        instruction: "Create email newsletter version with summary and links"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 4: Inbox Triage
    templateKey: "inbox-triage-suggested-replies",
    name: "Inbox Triage + Suggested Replies",
    description: "Automatically categorize incoming messages by urgency and intent, then generate suggested replies to save time on customer communication.",
    category: "inbox",
    tags: ["customer service", "automation", "email", "support"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "classifier",
        instruction: "Categorize message by type: inquiry, complaint, praise, sales, spam"
      },
      {
        order: 2,
        agentType: "prioritizer",
        instruction: "Assign urgency level: high, medium, low based on sentiment and keywords"
      },
      {
        order: 3,
        agentType: "responder",
        instruction: "Generate 3 suggested reply options matching your brand voice"
      },
      {
        order: 4,
        agentType: "tagger",
        instruction: "Add relevant tags and assign to team member if needed"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 5: Lead Warm-Up Sequence
    templateKey: "lead-warmup-sequence-7day",
    name: "Lead Warm-Up Sequence (7-day)",
    description: "Nurture new leads with a 7-day email sequence that builds trust, educates, and drives conversions through strategic touchpoints.",
    category: "leads",
    tags: ["email", "nurture", "conversion", "automation"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "writer",
        instruction: "Day 1: Welcome email with value proposition and what to expect"
      },
      {
        order: 2,
        agentType: "writer",
        instruction: "Day 2: Educational content addressing common pain point #1"
      },
      {
        order: 3,
        agentType: "writer",
        instruction: "Day 3: Case study or success story from similar customer"
      },
      {
        order: 4,
        agentType: "writer",
        instruction: "Day 4: Educational content addressing pain point #2"
      },
      {
        order: 5,
        agentType: "writer",
        instruction: "Day 5: Product/service demo or tutorial video"
      },
      {
        order: 6,
        agentType: "writer",
        instruction: "Day 6: Testimonials and social proof compilation"
      },
      {
        order: 7,
        agentType: "writer",
        instruction: "Day 7: Strong CTA with limited-time offer or next steps"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 6: Reactivation Campaign
    templateKey: "reactivation-campaign-cold-leads",
    name: "Reactivation Campaign (Cold Leads)",
    description: "Re-engage dormant leads with a targeted reactivation sequence featuring new offers, updates, and win-back strategies.",
    category: "leads",
    tags: ["reactivation", "cold leads", "win-back", "engagement"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "analyzer",
        instruction: "Segment cold leads by last interaction date and original interest"
      },
      {
        order: 2,
        agentType: "writer",
        instruction: "Email 1: 'We miss you' with summary of what's new since they left"
      },
      {
        order: 3,
        agentType: "writer",
        instruction: "Email 2: Exclusive comeback offer or discount for returning leads"
      },
      {
        order: 4,
        agentType: "writer",
        instruction: "Email 3: Address objections - 'Why leads like you come back' testimonials"
      },
      {
        order: 5,
        agentType: "writer",
        instruction: "Email 4: Last chance - final reminder with urgency and clear CTA"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 7: Analytics Action Plan
    templateKey: "analytics-next-week-action-plan",
    name: "Analytics  Next Week Action Plan",
    description: "Analyze last week's performance data across all channels and generate actionable priorities and tasks for the upcoming week.",
    category: "analytics",
    tags: ["analytics", "reporting", "optimization", "strategy"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "analyzer",
        instruction: "Pull and consolidate metrics from all channels: traffic, conversions, engagement, revenue"
      },
      {
        order: 2,
        agentType: "insight",
        instruction: "Identify top 3 wins and top 3 issues from data patterns"
      },
      {
        order: 3,
        agentType: "strategist",
        instruction: "Generate 5 specific action items to double down on wins and fix issues"
      },
      {
        order: 4,
        agentType: "planner",
        instruction: "Create daily task breakdown for next week with priorities and owners"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 8: Offer Builder
    templateKey: "offer-builder-funnel-draft",
    name: "Offer Builder + Funnel Draft",
    description: "Design a compelling offer structure and complete funnel blueprint including landing page copy, upsells, and email sequences.",
    category: "growth",
    tags: ["sales", "funnel", "offers", "conversion"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "strategist",
        instruction: "Define core offer: what's included, pricing strategy, and unique value proposition"
      },
      {
        order: 2,
        agentType: "copywriter",
        instruction: "Write landing page headline, benefits list, and CTA copy"
      },
      {
        order: 3,
        agentType: "strategist",
        instruction: "Design upsell/downsell offers that complement main offer"
      },
      {
        order: 4,
        agentType: "copywriter",
        instruction: "Create order confirmation email sequence (confirmation, onboarding, upsell)"
      },
      {
        order: 5,
        agentType: "designer",
        instruction: "Outline funnel flow diagram with all pages and decision points"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 9: Algorithm Optimization
    templateKey: "algorithm-optimization-timing-analysis",
    name: "Algorithm Optimization  Timing & Engagement Analysis",
    description: "Analyze social media algorithms across platforms to identify the best posting times, content formats, and engagement strategies for maximum reach and visibility.",
    category: "analytics",
    tags: ["algorithm", "timing", "social media", "analytics", "optimization"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "Algorithm_Hunter",
        instruction: "Analyze current algorithm preferences across LinkedIn, Instagram, TikTok, and Twitter. Identify best posting times, content formats, and ranking signals for each platform."
      },
      {
        order: 2,
        agentType: "Engagement_Analyst",
        instruction: "Review historical engagement data and correlate with algorithm insights. Identify patterns in high-performing content."
      },
      {
        order: 3,
        agentType: "Scheduling_Master",
        instruction: "Create an optimized posting calendar based on algorithm analysis. Schedule content for peak engagement windows on each platform."
      },
      {
        order: 4,
        agentType: "Content_Creator",
        instruction: "Generate content recommendations that align with current algorithm preferences (video format, length, style)."
      },
      {
        order: 5,
        agentType: "Trend_Hunter",
        instruction: "Identify trending topics that align with algorithm-friendly content formats for immediate implementation."
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 10: LinkedIn Authority Builder
    templateKey: "linkedin-authority-builder",
    name: "LinkedIn Authority Builder",
    description: "Build authority on LinkedIn with a 30-day content strategy featuring thought leadership posts, engagement tactics, and connection outreach.",
    category: "growth",
    tags: ["linkedin", "authority", "networking", "b2b"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define your LinkedIn positioning and key topics" },
      { order: 2, agentType: "content", instruction: "Create 4 weekly thought leadership posts with unique insights" },
      { order: 3, agentType: "engagement", instruction: "Identify high-value accounts to engage with" },
      { order: 4, agentType: "outreach", instruction: "Generate personalized connection messages" },
      { order: 5, agentType: "analytics", instruction: "Track engagement and optimize content strategy" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 11: Customer Success Onboarding
    templateKey: "customer-success-onboarding",
    name: "Customer Success Onboarding",
    description: "Create a comprehensive onboarding sequence that ensures new customers get quick wins and understand your product's full value.",
    category: "leads",
    tags: ["onboarding", "customer success", "retention", "email"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Map critical onboarding milestones" },
      { order: 2, agentType: "copywriter", instruction: "Write welcome sequence (3 emails)" },
      { order: 3, agentType: "content", instruction: "Create onboarding resource hub and video guides" },
      { order: 4, agentType: "support", instruction: "Generate FAQ and troubleshooting guides" },
      { order: 5, agentType: "engagement", instruction: "Build upsell prompts for advanced features" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 12: Video Script Master
    templateKey: "video-script-master",
    name: "Video Script Master (TikTok, YouTube, Reels)",
    description: "Generate short-form and long-form video scripts with hooks, transitions, and CTAs optimized for TikTok, Instagram Reels, and YouTube Shorts.",
    category: "creation",
    tags: ["video", "scripts", "short-form", "tiktok", "reels"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "researcher", instruction: "Research trending sounds and formats on platform" },
      { order: 2, agentType: "script_writer", instruction: "Write 5 short-form scripts (30-60 seconds)" },
      { order: 3, agentType: "hook_writer", instruction: "Generate attention-grabbing first 3 seconds" },
      { order: 4, agentType: "editor", instruction: "Add transition recommendations and timing notes" },
      { order: 5, agentType: "cta_writer", instruction: "Create platform-specific CTAs and hashtags" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 13: Paid Ads Launch
    templateKey: "paid-ads-launch-strategy",
    name: "Paid Ads Launch Strategy",
    description: "Plan and execute a paid advertising campaign with audience targeting, creative variations, budget allocation, and performance tracking.",
    category: "ads",
    tags: ["advertising", "facebook ads", "google ads", "performance marketing"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define campaign objective and KPIs" },
      { order: 2, agentType: "audience", instruction: "Build detailed audience personas and segmentation" },
      { order: 3, agentType: "creative", instruction: "Generate 3 ad creative variations with copy" },
      { order: 4, agentType: "budgeting", instruction: "Allocate budget across platforms and audiences" },
      { order: 5, agentType: "tracking", instruction: "Set up conversion tracking and UTM parameters" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 14: Review Generation + Response
    templateKey: "review-generation-response",
    name: "Review Generation & Response System",
    description: "Automate review requests, monitor reviews across platforms, and generate professional responses that build trust and address concerns.",
    category: "customer service",
    tags: ["reviews", "reputation", "customer satisfaction", "automation"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "outreach", instruction: "Generate personalized review request emails" },
      { order: 2, agentType: "monitor", instruction: "Track new reviews across Google, Trustpilot, industry sites" },
      { order: 3, agentType: "analyzer", instruction: "Sentiment analysis on incoming reviews" },
      { order: 4, agentType: "responder", instruction: "Generate professional responses to positive and negative reviews" },
      { order: 5, agentType: "reporter", instruction: "Weekly reputation summary and action items" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 15: Competitor Analysis Weekly
    templateKey: "competitor-analysis-weekly",
    name: "Competitor Analysis (Weekly)",
    description: "Monitor competitor activity, marketing strategies, and positioning updates every week with actionable insights for your strategy.",
    category: "analytics",
    tags: ["competitive analysis", "market intelligence", "strategy"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "researcher", instruction: "Monitor competitor website changes and new offerings" },
      { order: 2, agentType: "social_analyst", instruction: "Track competitor social media posts and engagement" },
      { order: 3, agentType: "pricing", instruction: "Monitor pricing changes and new promotions" },
      { order: 4, agentType: "insight", instruction: "Identify competitive threats and opportunities" },
      { order: 5, agentType: "strategist", instruction: "Generate recommendations for your differentiation" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 16: Webinar Launch Sequence
    templateKey: "webinar-launch-sequence",
    name: "Webinar Launch Sequence",
    description: "Plan and execute a complete webinar from promotion through follow-up including registration emails, reminders, and post-event nurture.",
    category: "campaigns",
    tags: ["webinar", "lead generation", "promotion", "nurture"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define webinar topic, format, and learning objectives" },
      { order: 2, agentType: "copywriter", instruction: "Write registration email and landing page copy" },
      { order: 3, agentType: "scheduler", instruction: "Schedule pre-event reminder emails" },
      { order: 4, agentType: "content", instruction: "Create presentation outline and slide recommendations" },
      { order: 5, agentType: "nurture", instruction: "Build post-webinar follow-up sequence for registrants" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 17: Community Building
    templateKey: "community-building-strategy",
    name: "Community Building Strategy",
    description: "Create and nurture an engaged community around your brand with discussion prompts, moderation guidelines, and member engagement tactics.",
    category: "growth",
    tags: ["community", "engagement", "loyalty", "brand building"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define community purpose and member personas" },
      { order: 2, agentType: "content", instruction: "Create discussion topics and conversation starters" },
      { order: 3, agentType: "moderator", instruction: "Build moderation guidelines and house rules" },
      { order: 4, agentType: "engagement", instruction: "Plan recognition and reward systems for members" },
      { order: 5, agentType: "analytics", instruction: "Build community health dashboard and metrics" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 18: Crisis Communication Plan
    templateKey: "crisis-communication-plan",
    name: "Crisis Communication Plan",
    description: "Prepare for brand crises with pre-written response templates, escalation procedures, and communication strategies across all channels.",
    category: "customer service",
    tags: ["crisis management", "pr", "communication", "reputation"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Identify potential crisis scenarios" },
      { order: 2, agentType: "copywriter", instruction: "Write holding statements for common scenarios" },
      { order: 3, agentType: "communication", instruction: "Define escalation procedures and decision trees" },
      { order: 4, agentType: "responder", instruction: "Build response templates for social media" },
      { order: 5, agentType: "planner", instruction: "Create communication timeline and stakeholder list" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 19: Podcast Launch Blueprint
    templateKey: "podcast-launch-blueprint",
    name: "Podcast Launch Blueprint",
    description: "Plan and launch a podcast from concept to distribution with format definition, guest research, content calendar, and promotion strategy.",
    category: "creation",
    tags: ["podcast", "content", "audio", "promotion"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define podcast format, episodes cadence, and target audience" },
      { order: 2, agentType: "researcher", instruction: "Research and identify ideal guest list" },
      { order: 3, agentType: "content", instruction: "Create episode outlines and question templates" },
      { order: 4, agentType: "producer", instruction: "Plan audio production workflow and technical setup" },
      { order: 5, agentType: "promotion", instruction: "Build podcast distribution and promotion strategy" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 20: Partnership Outreach Program
    templateKey: "partnership-outreach-program",
    name: "Partnership Outreach Program",
    description: "Identify, outreach to, and structure strategic partnerships that expand reach and create mutual value for your business.",
    category: "growth",
    tags: ["partnerships", "business development", "collaboration"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define partnership goals and ideal partner profile" },
      { order: 2, agentType: "researcher", instruction: "Research and identify partnership candidates" },
      { order: 3, agentType: "outreach", instruction: "Write personalized partnership outreach emails" },
      { order: 4, agentType: "strategist", instruction: "Define partnership structures and value exchange" },
      { order: 5, agentType: "content", instruction: "Create partnership promotion assets and timeline" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 21: Product Launch Campaign
    templateKey: "product-launch-campaign",
    name: "Product Launch Campaign",
    description: "Execute a complete product launch with teaser campaign, launch day coordination, and post-launch momentum maintenance.",
    category: "campaigns",
    tags: ["product launch", "promotion", "excitement", "growth"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Plan 4-week launch timeline and messaging strategy" },
      { order: 2, agentType: "content", instruction: "Create teaser content series building anticipation" },
      { order: 3, agentType: "copywriter", instruction: "Write launch day email blasts and social content" },
      { order: 4, agentType: "engagement", instruction: "Plan launch day engagement tactics and monitoring" },
      { order: 5, agentType: "nurture", instruction: "Build post-launch momentum and customer success" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 22: Referral Program
    templateKey: "referral-program-launch",
    name: "Referral Program Launch",
    description: "Design and launch a referral program that incentivizes customers to recommend your product with tracking and reward fulfillment.",
    category: "growth",
    tags: ["referral", "word-of-mouth", "customer acquisition", "incentives"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define referral rewards structure and incentives" },
      { order: 2, agentType: "product", instruction: "Set up referral tracking mechanism and attribution" },
      { order: 3, agentType: "copywriter", instruction: "Write referral program promotion copy and emails" },
      { order: 4, agentType: "content", instruction: "Create referral assets (graphics, social posts, landing page)" },
      { order: 5, agentType: "support", instruction: "Build referral support documentation and FAQ" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 23: Seasonal Campaign
    templateKey: "seasonal-campaign-planning",
    name: "Seasonal Campaign Planning",
    description: "Plan and execute seasonal marketing campaigns for holidays, events, or seasons with timely messaging and promotional offers.",
    category: "campaigns",
    tags: ["seasonal", "holidays", "promotions", "timely marketing"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define seasonal campaign angle and positioning" },
      { order: 2, agentType: "content", instruction: "Create seasonal content calendar and themes" },
      { order: 3, agentType: "copywriter", instruction: "Write holiday-specific copy and offers" },
      { order: 4, agentType: "creative", instruction: "Design seasonal visual assets and graphics" },
      { order: 5, agentType: "scheduler", instruction: "Schedule seasonal campaigns across all channels" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 24: Customer Retention Program
    templateKey: "customer-retention-program",
    name: "Customer Retention Program",
    description: "Reduce churn and increase customer lifetime value with targeted retention campaigns, win-back offers, and loyalty programs.",
    category: "leads",
    tags: ["retention", "churn reduction", "loyalty", "customer success"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "analyzer", instruction: "Identify at-risk customers using churn prediction signals" },
      { order: 2, agentType: "strategist", instruction: "Design tiered retention offers based on customer value" },
      { order: 3, agentType: "copywriter", instruction: "Write retention campaign emails and CTAs" },
      { order: 4, agentType: "success", instruction: "Create proactive check-in and value-add sequences" },
      { order: 5, agentType: "analytics", instruction: "Track retention metrics and program effectiveness" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 25: Event Marketing
    templateKey: "event-marketing-promotion",
    name: "Event Marketing & Promotion",
    description: "Plan and promote a company event (virtual or in-person) with registration strategy, attendee nurture, and post-event follow-up.",
    category: "campaigns",
    tags: ["event", "promotion", "registration", "attendee experience"],
    version: 1,
    status: "public",
    steps: [
      { order: 1, agentType: "strategist", instruction: "Define event goals, format, and target audience" },
      { order: 2, agentType: "content", instruction: "Create event promotion content and landing page copy" },
      { order: 3, agentType: "scheduler", instruction: "Plan promotion timeline and email sequence" },
      { order: 4, agentType: "engagement", instruction: "Create attendee experience plan and day-of communication" },
      { order: 5, agentType: "followup", instruction: "Build post-event recap and follow-up sequences" }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 26: AI Content Writer - Quick Post Generator
    templateKey: "ai-content-writer-quick-posts",
    name: "AI Content Writer  Quick Post Generator",
    description: "Instantly transform your idea into platform-optimized social media content. Describe what you want to say, pick your platform, and get ready-to-publish content in seconds.",
    category: "creation",
    tags: ["content writing", "social media", "AI", "automation", "time-saving"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "Content_Writer",
        instruction: "Convert user description into platform-optimized social media content with hooks, CTAs, and hashtags"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 27: AI Content Writer - Full Week Content Plan
    templateKey: "ai-content-writer-weekly-plan",
    name: "AI Content Writer  Weekly Content Plan",
    description: "Generate a full week of social media content ideas. Describe your goals and get 7 days of optimized posts across multiple platforms with scheduling recommendations.",
    category: "creation",
    tags: ["content writing", "social media", "weekly planning", "AI", "strategy"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "Trend_Hunter",
        instruction: "Identify trending topics relevant to user's industry for the week"
      },
      {
        order: 2,
        agentType: "Content_Writer",
        instruction: "Generate 7 days of social media content based on user description and trends"
      },
      {
        order: 3,
        agentType: "Brand_Voice_Guardian",
        instruction: "Ensure all content matches brand voice and tone throughout the week"
      },
      {
        order: 4,
        agentType: "Scheduling_Master",
        instruction: "Create optimal posting schedule for each platform and time of day"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

  {
    // Template 28: AI Content Writer - Smart Suggestion Engine
    templateKey: "ai-content-writer-smart-suggestions",
    name: "AI Content Writer  Smart Suggestion Engine",
    description: "The AI learns your company voice and automatically suggests what to post next. Review suggestions, approve them, and the agent creates and schedules your content automatically.",
    category: "creation",
    tags: ["content writing", "AI suggestions", "automation", "learning", "hands-off"],
    version: 1,
    status: "public",
    steps: [
      {
        order: 1,
        agentType: "Algorithm_Hunter",
        instruction: "Analyze what's performing well on each platform for your niche"
      },
      {
        order: 2,
        agentType: "Content_Writer",
        instruction: "Generate 3 smart content suggestions based on company voice and trending topics"
      },
      {
        order: 3,
        agentType: "Engagement_Analyst",
        instruction: "Predict engagement potential for each suggestion"
      },
      {
        order: 4,
        agentType: "Scheduling_Master",
        instruction: "Once approved, schedule content across all platforms automatically"
      }
    ],
    authorName: "Uqentra AI",
    installCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
  },

];

/**
 * FIRESTORE MANUAL CREATION INSTRUCTIONS
 * 
 * For each template above:
 * 
 * 1. Go to Firebase Console  Firestore Database  Start collection
 * 2. Collection ID: workflow_templates
 * 3. Document ID: Click "Auto-ID"
 * 4. Add fields from the template object above
 * 5. For the "steps" field:
 *    - Type: array
 *    - Click "Add item" for each step
 *    - Each item is a map with fields: order (number), agentType (string), instruction (string)
 * 6. For "tags" field:
 *    - Type: array
 *    - Add each tag as a string item
 * 7. Add timestamp fields:
 *    - createdAt: timestamp (click clock icon and select current time)
 *    - updatedAt: timestamp (same as createdAt)
 * 8. Click Save
 * 
 * Repeat for all 8 templates.
 * 
 * ALTERNATIVE: Use Firebase Admin SDK to bulk import
 * (requires Node.js script with admin credentials)
 */

