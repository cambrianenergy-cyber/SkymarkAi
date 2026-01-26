/**
 * SEED MARKETPLACE TEMPLATES
 * 
 * Run this script in the browser console while logged into your app
 * to automatically create all 8 marketplace templates in Firestore.
 * 
 * HOW TO USE:
 * 1. Open your app in the browser (localhost:3000)
 * 2. Press F12 to open developer console
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 * 5. Wait for "All templates seeded successfully!" message
 */

(async function seedTemplates() {
  console.log("Starting template seed...");
  
  // Import Firestore functions (assumes Firebase is already loaded)
  const { collection, addDoc, serverTimestamp } = window.firebaseImports || {};
  
  if (!collection || !addDoc) {
    console.error("❌ Firebase not loaded. Make sure you're on the app page.");
    return;
  }
  
  const templates = [
    {
      templateKey: "campaign-generator-full-launch",
      name: "Campaign Generator — Full Launch Plan",
      description: "Generate a complete multi-channel campaign plan with messaging, content ideas, and timeline for your product or service launch.",
      category: "campaigns",
      tags: ["launch", "marketing", "strategy", "multi-channel"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "research", instruction: "Research the target market, competitors, and audience demographics for the campaign" },
        { order: 2, agentType: "strategist", instruction: "Develop campaign messaging pillars, positioning, and key differentiators" },
        { order: 3, agentType: "content", instruction: "Generate content ideas for each channel: email, social, ads, blog posts" },
        { order: 4, agentType: "scheduler", instruction: "Create a 4-week launch timeline with daily tasks and content publish dates" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "weekly-content-engine",
      name: "Weekly Content Engine",
      description: "Automated weekly content creation system that generates blog posts, social updates, and newsletters based on your brand voice and topics.",
      category: "creation",
      tags: ["content", "automation", "social media", "blog"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "researcher", instruction: "Scan trending topics in your industry for the week" },
        { order: 2, agentType: "writer", instruction: "Write 1 long-form blog post (1200+ words) on the most relevant trend" },
        { order: 3, agentType: "repurposer", instruction: "Break down blog post into 5 social media posts and 1 newsletter section" },
        { order: 4, agentType: "scheduler", instruction: "Schedule all content across platforms for optimal engagement times" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "repurpose-engine-multi-platform",
      name: "Repurpose Engine — Multi-Platform Expansion",
      description: "Take one piece of content and repurpose it into 10+ formats: Twitter threads, LinkedIn posts, Instagram carousels, YouTube scripts, and more.",
      category: "repurpose",
      tags: ["repurposing", "content", "multi-platform", "efficiency"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "analyzer", instruction: "Analyze the original content piece and extract key insights, quotes, and data" },
        { order: 2, agentType: "repurposer", instruction: "Create Twitter thread (8-12 tweets) from main points" },
        { order: 3, agentType: "repurposer", instruction: "Create LinkedIn post (1500 chars) with professional tone" },
        { order: 4, agentType: "repurposer", instruction: "Create Instagram carousel (10 slides) with visual-friendly text" },
        { order: 5, agentType: "repurposer", instruction: "Create YouTube video script with intro, main points, and CTA" },
        { order: 6, agentType: "repurposer", instruction: "Create email newsletter version with summary and links" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "inbox-triage-suggested-replies",
      name: "Inbox Triage + Suggested Replies",
      description: "Automatically categorize incoming messages by urgency and intent, then generate suggested replies to save time on customer communication.",
      category: "inbox",
      tags: ["customer service", "automation", "email", "support"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "classifier", instruction: "Categorize message by type: inquiry, complaint, praise, sales, spam" },
        { order: 2, agentType: "prioritizer", instruction: "Assign urgency level: high, medium, low based on sentiment and keywords" },
        { order: 3, agentType: "responder", instruction: "Generate 3 suggested reply options matching your brand voice" },
        { order: 4, agentType: "tagger", instruction: "Add relevant tags and assign to team member if needed" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "lead-warmup-sequence-7day",
      name: "Lead Warm-Up Sequence (7-day)",
      description: "Nurture new leads with a 7-day email sequence that builds trust, educates, and drives conversions through strategic touchpoints.",
      category: "leads",
      tags: ["email", "nurture", "conversion", "automation"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "writer", instruction: "Day 1: Welcome email with value proposition and what to expect" },
        { order: 2, agentType: "writer", instruction: "Day 2: Educational content addressing common pain point #1" },
        { order: 3, agentType: "writer", instruction: "Day 3: Case study or success story from similar customer" },
        { order: 4, agentType: "writer", instruction: "Day 4: Educational content addressing pain point #2" },
        { order: 5, agentType: "writer", instruction: "Day 5: Product/service demo or tutorial video" },
        { order: 6, agentType: "writer", instruction: "Day 6: Testimonials and social proof compilation" },
        { order: 7, agentType: "writer", instruction: "Day 7: Strong CTA with limited-time offer or next steps" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "reactivation-campaign-cold-leads",
      name: "Reactivation Campaign (Cold Leads)",
      description: "Re-engage dormant leads with a targeted reactivation sequence featuring new offers, updates, and win-back strategies.",
      category: "leads",
      tags: ["reactivation", "cold leads", "win-back", "engagement"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "analyzer", instruction: "Segment cold leads by last interaction date and original interest" },
        { order: 2, agentType: "writer", instruction: "Email 1: 'We miss you' with summary of what's new since they left" },
        { order: 3, agentType: "writer", instruction: "Email 2: Exclusive comeback offer or discount for returning leads" },
        { order: 4, agentType: "writer", instruction: "Email 3: Address objections - 'Why leads like you come back' testimonials" },
        { order: 5, agentType: "writer", instruction: "Email 4: Last chance - final reminder with urgency and clear CTA" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "analytics-next-week-action-plan",
      name: "Analytics → Next Week Action Plan",
      description: "Analyze last week's performance data across all channels and generate actionable priorities and tasks for the upcoming week.",
      category: "analytics",
      tags: ["analytics", "reporting", "optimization", "strategy"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "analyzer", instruction: "Pull and consolidate metrics from all channels: traffic, conversions, engagement, revenue" },
        { order: 2, agentType: "insight", instruction: "Identify top 3 wins and top 3 issues from data patterns" },
        { order: 3, agentType: "strategist", instruction: "Generate 5 specific action items to double down on wins and fix issues" },
        { order: 4, agentType: "planner", instruction: "Create daily task breakdown for next week with priorities and owners" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
    {
      templateKey: "offer-builder-funnel-draft",
      name: "Offer Builder + Funnel Draft",
      description: "Design a compelling offer structure and complete funnel blueprint including landing page copy, upsells, and email sequences.",
      category: "growth",
      tags: ["sales", "funnel", "offers", "conversion"],
      version: 1,
      status: "public",
      steps: [
        { order: 1, agentType: "strategist", instruction: "Define core offer: what's included, pricing strategy, and unique value proposition" },
        { order: 2, agentType: "copywriter", instruction: "Write landing page headline, benefits list, and CTA copy" },
        { order: 3, agentType: "strategist", instruction: "Design upsell/downsell offers that complement main offer" },
        { order: 4, agentType: "copywriter", instruction: "Create order confirmation email sequence (confirmation, onboarding, upsell)" },
        { order: 5, agentType: "designer", instruction: "Outline funnel flow diagram with all pages and decision points" }
      ],
      authorName: "Uqentra AI",
      installCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
    },
  ];

  console.log(`Creating ${templates.length} templates...`);
  
  for (const template of templates) {
    try {
      const docRef = await addDoc(collection(window.db, "workflow_templates"), {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Created: ${template.name} (${docRef.id})`);
    } catch (error) {
      console.error(`❌ Failed to create ${template.name}:`, error);
    }
  }
  
  console.log("🎉 All templates seeded successfully!");
})();
