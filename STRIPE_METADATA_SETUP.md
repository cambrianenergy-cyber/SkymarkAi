# Stripe Metadata Setup Guide

Add these metadata fields to each Stripe Price in your Stripe Dashboard.

**Why?** The webhook reads these to automatically enable/disable packs and specialty agents in Firestore.

---

## Base Plan Prices

### Accelerate ($499/month)
**Price ID:** `price_accelerate_monthly_499`

Add metadata:
```json
{
  "type": "base_plan",
  "key": "accelerate"
}
```

### Dominion ($999/month)
**Price ID:** `price_dominion_monthly_999`

Add metadata:
```json
{
  "type": "base_plan",
  "key": "dominion"
}
```

### Sovereign ($1,999/month)
**Price ID:** `price_sovereign_monthly_1999`

Add metadata:
```json
{
  "type": "base_plan",
  "key": "sovereign"
}
```

### Founder (Internal)
**Price ID:** `price_founder_internal`

Add metadata:
```json
{
  "type": "base_plan",
  "key": "founder"
}
```

---

## Pack Prices (Add-on Subscriptions)

### Sales Automation Pack ($99/month)
**Price ID:** `price_pack_sales_99`

Add metadata:
```json
{
  "type": "pack",
  "key": "salesAutomation"
}
```

**Unlocks:** `lead_scoring` agent

### Marketing Intelligence Pack ($149/month)
**Price ID:** `price_pack_marketing_149`

Add metadata:
```json
{
  "type": "pack",
  "key": "marketingIntelligence"
}
```

**Unlocks:** `repurpose_engine` agent

### Agency Pack ($299/month)
**Price ID:** `price_pack_agency_299`

Add metadata:
```json
{
  "type": "pack",
  "key": "agency"
}
```

**Unlocks:** `agency_mode_orchestrator`, `client_routing`, `template_marketplace_manager` agents

---

## Specialty Agent Prices (À la carte)

### Content Writer Agent ($129/month)
**Price ID:** `price_agent_content_writer_129`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "content_writer",
  "agentType": "content_writer"
}
```

### Video Script Generator Agent ($49/month)
**Price ID:** `price_agent_video_script_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "video_script_generator",
  "agentType": "video_script_generator"
}
```

### Email Sequence Strategist Agent ($49/month)
**Price ID:** `price_agent_email_seq_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "email_sequence_strategist",
  "agentType": "email_sequence_strategist"
}
```

### Social Analytics Pro Agent ($49/month)
**Price ID:** `price_agent_social_analytics_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "social_analytics_pro",
  "agentType": "social_analytics_pro"
}
```

### Brand Architect Agent ($49/month)
**Price ID:** `price_agent_brand_architect_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "brand_architect",
  "agentType": "brand_architect"
}
```

### Community Manager Agent ($49/month)
**Price ID:** `price_agent_community_mgr_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "community_manager",
  "agentType": "community_manager"
}
```

### UGC Creator Agent ($49/month)
**Price ID:** `price_agent_ugc_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "ugc_creator",
  "agentType": "ugc_creator"
}
```

### Email Marketer Agent ($49/month)
**Price ID:** `price_agent_email_marketer_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "email_marketer",
  "agentType": "email_marketer"
}
```

### Product Copywriter Agent ($49/month)
**Price ID:** `price_agent_product_copy_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "product_copywriter",
  "agentType": "product_copywriter"
}
```

### Closer Agent ($49/month)
**Price ID:** `price_agent_closer_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "closer",
  "agentType": "closer"
}
```

### Webinar Scripter Agent ($49/month)
**Price ID:** `price_agent_webinar_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "webinar_scripter",
  "agentType": "webinar_scripter"
}
```

### Thought Leader Agent ($49/month)
**Price ID:** `price_agent_thought_leader_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "thought_leader",
  "agentType": "thought_leader"
}
```

### Review Generator Agent ($49/month)
**Price ID:** `price_agent_review_gen_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "review_generator",
  "agentType": "review_generator"
}
```

### Local SEO Specialist ($49/month)
**Price ID:** `price_agent_local_seo_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "local_seo_specialist",
  "agentType": "local_seo_specialist"
}
```

### Review Responder Agent ($79/month)
**Price ID:** `price_agent_review_respond_79`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Review_Responder",
  "agentType": "Review_Responder"
}
```

### Campaign Director Agent ($49/month)
**Price ID:** `price_agent_campaign_director_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Campaign_Director",
  "agentType": "Campaign_Director"
}
```

### Content Creator Agent ($49/month)
**Price ID:** `price_agent_content_creator_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Content_Creator",
  "agentType": "Content_Creator"
}
```

### Copywriter Agent ($49/month)
**Price ID:** `price_agent_copywriter_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Copywriter",
  "agentType": "Copywriter"
}
```

### Brand Voice Guardian Agent ($49/month)
**Price ID:** `price_agent_brand_voice_guardian_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Brand_Voice_Guardian",
  "agentType": "Brand_Voice_Guardian"
}
```

### Scheduler Agent ($49/month)
**Price ID:** `price_agent_scheduler_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Scheduler",
  "agentType": "Scheduler"
}
```

### Engagement Analyst Agent ($49/month)
**Price ID:** `price_agent_engagement_analyst_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Engagement_Analyst",
  "agentType": "Engagement_Analyst"
}
```

### Competitor Watchdog Agent ($49/month)
**Price ID:** `price_agent_competitor_watchdog_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Competitor_Watchdog",
  "agentType": "Competitor_Watchdog"
}
```

### Trend Hunter Agent ($49/month)
**Price ID:** `price_agent_trend_hunter_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Trend_Hunter",
  "agentType": "Trend_Hunter"
}
```

### Hashtag SEO Agent ($49/month)
**Price ID:** `price_agent_hashtag_seo_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Hashtag_SEO",
  "agentType": "Hashtag_SEO"
}
```

### Content Writer Agent ($129/month)
**Price ID:** `price_agent_content_writer_129`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Content_Writer",
  "agentType": "Content_Writer"
}
```

### Video Script Generator Agent ($49/month)
**Price ID:** `price_agent_video_script_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Video_Script_Generator",
  "agentType": "Video_Script_Generator"
}
```

### Email Sequence Strategist Agent ($49/month)
**Price ID:** `price_agent_email_seq_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Email_Sequence_Strategist",
  "agentType": "Email_Sequence_Strategist"
}
```

### Social Analytics Pro Agent ($49/month)
**Price ID:** `price_agent_social_analytics_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Social_Analytics_Pro",
  "agentType": "Social_Analytics_Pro"
}
```

### Brand Architect Agent ($49/month)
**Price ID:** `price_agent_brand_architect_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Brand_Architect",
  "agentType": "Brand_Architect"
}
```

### Community Manager Agent ($49/month)
**Price ID:** `price_agent_community_manager_title_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Community_Manager",
  "agentType": "Community_Manager"
}
```

### UGC Creator Agent ($49/month)
**Price ID:** `price_agent_ugc_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "UGC_Creator",
  "agentType": "UGC_Creator"
}
```

### Email Marketer Agent ($49/month)
**Price ID:** `price_agent_email_marketer_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Email_Marketer",
  "agentType": "Email_Marketer"
}
```

### Product Copywriter Agent ($49/month)
**Price ID:** `price_agent_product_copy_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Product_Copywriter",
  "agentType": "Product_Copywriter"
}
```

### Closer Agent ($49/month)
**Price ID:** `price_agent_closer_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Closer",
  "agentType": "Closer"
}
```

### Webinar Scripter Agent ($49/month)
**Price ID:** `price_agent_webinar_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Webinar_Scripter",
  "agentType": "Webinar_Scripter"
}
```

### Thought Leader Agent ($49/month)
**Price ID:** `price_agent_thought_leader_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Thought_Leader",
  "agentType": "Thought_Leader"
}
```

### Review Generator Agent ($49/month)
**Price ID:** `price_agent_review_gen_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Review_Generator",
  "agentType": "Review_Generator"
}
```

### Local SEO Specialist ($49/month)
**Price ID:** `price_agent_local_seo_49`

Add metadata:
```json
{
  "type": "specialty_agent",
  "key": "Local_SEO_Specialist",
  "agentType": "Local_SEO_Specialist"
}
```

---

## How to Add Metadata in Stripe Dashboard

1. Go to **Products** → Select your product
2. Click on the **Price** you want to edit
3. Scroll down to **Metadata**
4. Click **Add Metadata** 
5. Enter key-value pairs:
   - Key: `type`, Value: `base_plan` (or `pack` or `specialty_agent`)
   - Key: `key`, Value: `accelerate` (or appropriate key)
   - Key: `agentType`, Value: `content_writer` (for specialty agents only)
6. Click **Save**

---

## Verification

After adding metadata, test by:

1. Run webhook test in Stripe Dashboard:
   - Event: `customer.subscription.updated`
   - Select a subscription with these prices

2. Check Firestore:
   - `subscriptions/{workspaceId}/packs/{packKey}.enabled` should update to `true`
   - `subscriptions/{workspaceId}/specialtyAgents/{agentType}.enabled` should update to `true`
   - `subscriptions/{workspaceId}/entitlements.allowedAgentTypes` should auto-recompute

3. The webhook handler logs will show:
   ```
   Pack enabled: salesAutomation for workspace xyz
   Specialty agent enabled: content_writer for workspace xyz
   Refreshed entitlements for workspace xyz
   ```

---

## Webhook Logic

The handler at `app/api/stripe/webhook/route.ts` reads this metadata:

```typescript
for (const item of subscription.items.data) {
  const price = item.price;
  const metadata = price.metadata; // ← Your metadata goes here

  if (metadata.type === "pack") {
    updateData[`packs.${metadata.key}.enabled`] = true;
  } else if (metadata.type === "specialty_agent") {
    updateData[`specialtyAgents.${metadata.agentType}.enabled`] = true;
  }
}
```

This is why the metadata **must be set correctly** — the webhook depends on it!
