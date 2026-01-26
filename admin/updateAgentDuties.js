const admin = require('firebase-admin');
const serviceAccount = require('../Web/Secrets/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAgentDuties() {
  console.log(' Updating agent duties and types...\n');

  try {
    const agentTypeMap = {
      'Brand_Voice_Guardian': {
        type: 'brand_voice_guardian',
        duty: "Enforces tone, banned phrases, reading level, and 'no cringe' rules across all content."
      },
      'Hashtag_SEO_Optimizer': {
        type: 'hashtag_seo_optimizer',
        duty: 'Generates keywords, hashtags, titles, and descriptions optimized for each platform.'
      },
      'Repurpose_Engine': {
        type: 'repurpose_engine',
        duty: 'Transforms one long-form asset into 10+ platform-specific variations.'
      },
      'Lead_Scoring_Followup': {
        type: 'lead_scoring_followup',
        duty: 'Scores leads from interactions and creates automated follow-up sequences.'
      },
      'Unified_Inbox_Triage': {
        type: 'unified_inbox_triage',
        duty: 'Categorizes and prioritizes inbound messages across all channels.'
      },
      'Paid_Ads_Strategist': {
        type: 'paid_ads_strategist',
        duty: 'Creates comprehensive paid advertising strategies and creative plans.'
      },
      'Offer_Funnel_Architect': {
        type: 'offer_funnel_architect',
        duty: 'Designs offers, landing pages, and complete sales funnels.'
      },
      'Email_SMS_Nurture': {
        type: 'email_sms_nurture',
        duty: 'Creates email and SMS nurture sequences with segmentation.'
      },
      'Conversion_Optimizer': {
        type: 'conversion_optimizer',
        duty: 'Analyzes performance and suggests improvements to increase conversions.'
      },
      'QA_Compliance_Checker': {
        type: 'qa_compliance_checker',
        duty: 'Validates content for policy compliance and brand guidelines.'
      },
      'Fact_Checker_Light': {
        type: 'fact_checker_light',
        duty: 'Validates claims and suggests safer phrasing to avoid misinformation.'
      },
      'Workflow_Builder': {
        type: 'workflow_builder',
        duty: 'Generates complete workflows from high-level goals.'
      },
      'Analytics_To_Action': {
        type: 'analytics_to_action',
        duty: 'Translates analytics data into actionable next steps.'
      },
      'Client_Reporting': {
        type: 'client_reporting',
        duty: 'Generates professional client reports with wins and next steps.'
      },
      'Hook_Generator': {
        type: 'hook_generator',
        duty: 'Creates 50+ hooks per campaign, optimized by platform.'
      },
      'Shotlist_BRoll_Planner': {
        type: 'shotlist_broll_planner',
        duty: 'Converts scripts into detailed shot lists and b-roll plans.'
      },
      'Thumbnail_Title_Optimizer': {
        type: 'thumbnail_title_optimizer',
        duty: 'Optimizes YouTube thumbnails and titles for maximum CTR.'
      }
    };

    const agentsSnap = await db.collection('agents').get();
    let updateCount = 0;

    for (const doc of agentsSnap.docs) {
      const agent = doc.data();
      const agentType = agent.agentType;

      if (agentTypeMap[agentType]) {
        const { type, duty } = agentTypeMap[agentType];
        
        await doc.ref.update({
          type: type,
          duty: duty,
          status: agent.status || (agent.isActive ? 'active' : 'inactive'),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(` Updated: ${agent.name} (${agentType}  ${type})`);
        updateCount++;
      }
    }

    console.log(`\n Successfully updated ${updateCount} agents!`);

  } catch (error) {
    console.error(' Error updating agents:', error);
  }

  process.exit(0);
}

updateAgentDuties();

