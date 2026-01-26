/**
 * Create Uqentra AI Company Workspace
 * 
 * This script creates a dedicated workspace for Uqentra AI as a company,
 * so you can use it for marketing, demos, and showcasing the platform.
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = require("../Web/Secrets/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createSkymarkWorkspace() {
  try {
    console.log(" Creating Uqentra AI Company Workspace...\n");

    // Get your user ID (you'll need to replace this with your actual UID)
    const usersSnapshot = await db.collection("users").limit(1).get();
    
    if (usersSnapshot.empty) {
      console.error(" No users found. Please log in to the app first.");
      process.exit(1);
    }

    const firstUser = usersSnapshot.docs[0];
    const userId = firstUser.id;
    const userEmail = firstUser.data().email;

    console.log(` Found user: ${userEmail} (${userId})`);

    // Create Uqentra AI workspace
    const workspaceData = {
      name: "Uqentra AI",
      ownerUserId: userId,
      plan: "agency", // Give it the best plan for marketing
      status: "active",
      description: "Official Uqentra AI Company Workspace - AI-Powered Marketing Automation Platform",
      industry: "Technology",
      website: "https://uqentra.ai",
      company: {
        name: "Uqentra AI",
        tagline: "AI-Powered Marketing Automation for Modern Businesses",
        description: "Transform your marketing with intelligent automation. Uqentra AI combines AI agents, workflow automation, and campaign management into one powerful platform.",
        logo: "https://uqentra.ai/logo.png",
        socialMedia: {
          twitter: "@uqentraai",
          linkedin: "uqentraai",
          facebook: "uqentraai",
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const workspaceRef = await db.collection("workspaces").add(workspaceData);
    console.log(` Created workspace: ${workspaceRef.id}\n`);

    // Create membership for the owner
    const membershipData = {
      workspaceId: workspaceRef.id,
      userId: userId,
      role: "owner",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const membershipRef = await db.collection("workspace_members").add(membershipData);
    console.log(` Created membership: ${membershipRef.id}\n`);

    // Create workspace billing with Agency plan
    const billingData = {
      plan: "agency",
      status: "active",
      limits: {
        agents: -1, // Unlimited
        workflowRuns: -1, // Unlimited
        templateInstalls: -1, // Unlimited
        teamMembers: -1, // Unlimited
      },
      currentUsage: {
        agents: 0,
        workflowRuns: 0,
        templateInstalls: 0,
        teamMembers: 1,
      },
      features: [
        "Unlimited Agents",
        "Unlimited Workflow Runs",
        "Unlimited Templates",
        "Unlimited Team Members",
        "White Label Options",
        "Dedicated Support",
        "Custom Development",
        "Priority API Access",
        "Advanced Analytics",
        "Custom Integrations"
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("workspace_billing").doc(workspaceRef.id).set(billingData);
    console.log(` Created billing profile with Agency plan\n`);

    // Create sample marketing campaign
    const campaignData = {
      workspaceId: workspaceRef.id,
      name: "Uqentra AI Launch Campaign",
      description: "Official product launch and awareness campaign",
      status: "draft",
      type: "product_launch",
      platforms: ["linkedin", "twitter", "facebook"],
      targetAudience: {
        industries: ["Technology", "Marketing", "SaaS"],
        roles: ["Marketing Manager", "CMO", "Business Owner"],
        companySize: ["startup", "small_business", "enterprise"]
      },
      goals: {
        primary: "Brand Awareness",
        secondary: ["Lead Generation", "Product Education"]
      },
      budget: {
        total: 10000,
        spent: 0,
        currency: "USD"
      },
      timeline: {
        startDate: admin.firestore.Timestamp.now(),
        endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)), // 90 days
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const campaignRef = await db.collection("campaigns").add(campaignData);
    console.log(` Created sample campaign: ${campaignRef.id}\n`);

    // Output summary
    console.log("");
    console.log(" Uqentra AI Workspace Created Successfully!");
    console.log("\n");
    console.log(` Workspace Details:`);
    console.log(`   ID: ${workspaceRef.id}`);
    console.log(`   Name: Uqentra AI`);
    console.log(`   Plan: Agency (Unlimited)`);
    console.log(`   Owner: ${userEmail}`);
    console.log(`\n What's included:`);
    console.log(`    Company profile with branding`);
    console.log(`    Agency plan (all features unlocked)`);
    console.log(`    Sample launch campaign`);
    console.log(`    Ready for marketing and demos`);
    console.log(`\n Next Steps:`);
    console.log(`   1. Go to Workspaces page in your app`);
    console.log(`   2. Switch to "Uqentra AI" workspace`);
    console.log(`   3. Start creating marketing content!`);
    console.log(`   4. Add team members if needed`);
    console.log(`\n Use this workspace to:`);
    console.log(`    Showcase Uqentra AI features`);
    console.log(`    Create demo campaigns`);
    console.log(`    Test all functionality`);
    console.log(`    Generate marketing content`);
    console.log(`    Share with potential customers\n`);

    process.exit(0);
  } catch (error) {
    console.error(" Error creating workspace:", error);
    process.exit(1);
  }
}

// Run the script
createSkymarkWorkspace();

