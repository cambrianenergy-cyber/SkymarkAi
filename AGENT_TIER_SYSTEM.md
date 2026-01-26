# 🧠 Agent Tier System Implementation

## Overview
Uqentra AI now has a tiered AI agent system where different subscription plans unlock different levels of intelligence and automation.

---

## 🎯 The Three Tiers

### 🟢 Starter Plan — "Get It Done" AI
**Price:** $49/month  
**Focus:** Execution  
**Intelligence Level:** 🧠

#### Included Agents (5 total)
- ✅ **Copywriter** — Writes posts, captions, ads, CTAs
- ✅ **Content Creator** (Visual Designer) — Creative direction, prompts, visual specs
- ✅ **Scheduling Master** — Posting cadence + scheduling logic

#### What Starter Can Do
- ✅ Create content
- ✅ Post content
- ✅ Basic message responses

#### What Starter Cannot Do
- ❌ Strategic campaign planning
- ❌ Competitive analysis
- ❌ Deep analytics
- ❌ Automated follow-up systems

**Value Prop:** "Execute marketing consistently without overwhelm"

---

### 🔵 Pro Plan — "Grow Smarter" AI
**Price:** $149/month  
**Focus:** Strategy + Optimization  
**Intelligence Level:** 🧠🧠

#### Included Agents (11 total)
Everything in Starter, plus:
- ✅ **Campaign Director** — Builds campaign plans, aligns content to goals
- ✅ **Trend Hunter** — Finds trends, hooks, viral angles
- ✅ **Competitor Watchdog** — Analyzes competitors, extracts insights
- ✅ **Engagement Analyst** — Tracks performance, recommends optimizations
- ✅ **Brand Voice Guardian** — Enforces tone, clarity, consistency
- ✅ **Hashtag/SEO Optimizer** — Improves discoverability
- ✅ **Algorithm Hunter** — Studies algorithms, identifies best posting times

#### What Pro Unlocks
- ✅ Campaign-level thinking
- ✅ Better reach and conversions
- ✅ Smarter content decisions
- ✅ Iteration based on performance
- ✅ Trend analysis
- ✅ Brand consistency

#### What Pro Cannot Do
- ❌ Multi-client scale operations
- ❌ Advanced automation workflows

**Value Prop:** "Add strategy, optimization, and insights on top of execution"

---

### 🔴 Agency Plan — "Scale & Automate" AI
**Price:** $399/month  
**Focus:** Automation + Scale  
**Intelligence Level:** 🧠🧠🧠

#### Included Agents (19+ total)
Everything in Pro, plus:
- ✅ **Repurpose Engine** ⭐ — Turns 1 asset into 10–20 pieces
- ✅ **Inbox Triage Agent** — Categorizes messages, flags leads
- ✅ **Lead Scoring + Follow-Up Agent** — Auto sequences, push to close
- ✅ **Offer & Funnel Architect** — Shapes offers, designs funnels
- ✅ **Paid Ads Strategist** — Ad angles, creatives, testing logic
- ✅ **Analytics → Action Agent** — Autopilot optimization
- ✅ **Client Reporting Agent** — Agency-grade deliverables
- ✅ **Workflow Builder Agent** — Rapid client onboarding

#### What Agency Becomes
- ✅ A marketing operating system
- ✅ A client delivery engine
- ✅ A revenue automation stack
- ✅ Multi-client management
- ✅ Full intelligence and automation

**Value Prop:** "Run multiple brands with minimal effort"

---

## 📊 Clean Tier Comparison

| Tier | Focus | Intelligence | Agent Count | Price |
|------|-------|-------------|-------------|-------|
| **Starter** | Execution | 🧠 | 5 | $49/mo |
| **Pro** | Strategy + Optimization | 🧠🧠 | 11 | $149/mo |
| **Agency** | Automation + Scale | 🧠🧠🧠 | 19+ | $399/mo |

---

## 🔐 Technical Implementation

### Files Updated

1. **`lib/billing.ts`**
   - Added `allowedAgentTypes` to `PlanLimits` interface
   - Created tier constants: `STARTER_AGENTS`, `PRO_AGENTS`, `AGENCY_AGENTS`
   - Added `getPlanLimits(plan)` function
   - Added `canUseAgent(agentType, plan, userId)` function for enforcement

2. **`app/app/billing/page.tsx`**
   - Enhanced plan cards with agent lists
   - Added plan subtitles and descriptions
   - Shows included agents for each tier
   - Displays "Can Do" / "Cannot Do" sections
   - Better visual hierarchy and information

### Enforcement Logic

```typescript
// Check if user can use an agent
const result = canUseAgent(agentType, userPlan, userId);

if (!result.allowed) {
  // Show upgrade modal
  // Display: result.message
  // Upgrade to: result.requiredPlan
}
```

### Founder Override
- Founder UID bypasses all agent restrictions
- Unlimited access to all agents regardless of plan

---

## 🎨 Billing Page Features

### Enhanced Plan Cards
- **Subtitle** showing tier positioning ("Get It Done" AI, etc.)
- **Agent count** displayed prominently (5 Agents, 11 Agents, etc.)
- **Agent list** in highlighted box showing what's included
- **Can/Cannot do** sections for clear value prop
- **Visual hierarchy** with colors and badges
- **Hover effects** on upgrade buttons

### Progressive Disclosure
Each card clearly shows:
1. What agents you get
2. What you can accomplish
3. What requires an upgrade
4. The intelligence level you're buying

---

## 🚀 Future Enhancements (Optional)

### Agent Add-On Packs
Later you can add à la carte upgrades:
- "Repurpose Engine add-on: $29/mo"
- "Paid Ads Agent add-on: $49/mo"
- Increases ARPU without plan changes

### Agent Marketplace
- Community-created agents
- Premium agent packs
- Industry-specific agent bundles

---

## ✅ What's Live Now

1. ✅ Tiered agent system defined in `billing.ts`
2. ✅ Enhanced billing page with agent listings
3. ✅ Clear value propositions for each tier
4. ✅ Visual hierarchy and design improvements
5. ✅ Technical foundation for agent enforcement

## 🎯 Next Steps

To fully implement agent gating, you'll need to:

1. **Add enforcement in agent activation UI**
   - Check `canUseAgent()` before allowing agent use
   - Show upgrade modal when locked

2. **Add visual indicators**
   - Lock icons on unavailable agents
   - "Upgrade to unlock" badges
   - Tier badges on agent cards

3. **Update agent pages**
   - Show which plan is required for each agent
   - Add upgrade CTAs on locked agents

4. **Test the flow**
   - Verify starter users can't access pro agents
   - Test upgrade flow and immediate access

---

## 💡 Key Insights

This progression:
- ✅ Feels fair and logical
- ✅ Makes upgrades obvious
- ✅ Aligns price with intelligence level
- ✅ Creates clear upgrade motivations
- ✅ Supports future upsells

**The system is now ready to enforce "intelligence as a service" pricing! 🚀**
