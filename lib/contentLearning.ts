import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface ContentPerformance {
  contentId: string;
  generatedAt: Date;
  template: string;
  tone: string;
  engagement: number;
  impressions: number;
  clicks: number;
  savedCount: number;
  sharesCount: number;
}

interface BrandProfile {
  workspaceId: string;
  companyName: string;
  industry: string;
  targetAudience: string;
  voiceCharacteristics: string[];
  topPerformingTemplates: Record<string, number>;
  topPerformingTones: Record<string, number>;
  preferredHashtags: string[];
  averageEngagementRate: number;
  contentHistory: any[];
  lastUpdated: Date;
}

interface ContentSuggestion {
  suggestionId: string;
  workspaceId: string;
  suggestedTemplate: string;
  suggestedTone: string;
  suggestedTopic: string;
  confidenceScore: number;
  reasoning: string;
  predictedEngagement: number;
  createdAt: Date;
  approved: boolean;
  published: boolean;
}

/**
 * Content Learning System
 * 
 * Tracks content performance and learns user preferences to make smart suggestions
 */

/**
 * Get or create brand profile for workspace
 */
export async function getBrandProfile(workspaceId: string): Promise<BrandProfile> {
  try {
    const docRef = doc(db, "brand_profiles", workspaceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as BrandProfile;
    }

    // Create default profile
    const newProfile: BrandProfile = {
      workspaceId,
      companyName: "Your Company",
      industry: "Unknown",
      targetAudience: "General audience",
      voiceCharacteristics: ["professional"],
      topPerformingTemplates: {},
      topPerformingTones: {},
      preferredHashtags: [],
      averageEngagementRate: 0,
      contentHistory: [],
      lastUpdated: new Date(),
    };

    await addDoc(collection(db, "brand_profiles"), newProfile);
    return newProfile;
  } catch (error) {
    console.error("Error getting brand profile:", error);
    throw error;
  }
}

/**
 * Update brand profile with new content generation
 */
export async function updateBrandProfile(
  workspaceId: string,
  contentData: {
    template: string;
    tone: string;
    hashtags?: string[];
  }
): Promise<void> {
  try {
    const profile = await getBrandProfile(workspaceId);

    // Update template frequency
    const templates = profile.topPerformingTemplates || {};
    templates[contentData.template] = (templates[contentData.template] || 0) + 1;

    // Update tone frequency
    const tones = profile.topPerformingTones || {};
    tones[contentData.tone] = (tones[contentData.tone] || 0) + 1;

    // Update hashtags
    if (contentData.hashtags) {
      const existingHashtags = new Set(profile.preferredHashtags || []);
      contentData.hashtags.forEach((tag) => existingHashtags.add(tag));
      profile.preferredHashtags = Array.from(existingHashtags);
    }

    const docRef = doc(db, "brand_profiles", workspaceId);
    await updateDoc(docRef, {
      topPerformingTemplates: templates,
      topPerformingTones: tones,
      preferredHashtags: profile.preferredHashtags,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating brand profile:", error);
    throw error;
  }
}

/**
 * Generate smart content suggestions based on brand profile
 */
export async function generateSmartSuggestions(
  workspaceId: string,
  userId: string
): Promise<ContentSuggestion[]> {
  try {
    const profile = await getBrandProfile(workspaceId);

    // Get recent content to avoid repetition
    const recentQuery = query(
      collection(db, "content_generations"),
      where("workspaceId", "==", workspaceId),
      where("userId", "==", userId)
    );
    const recentDocs = await getDocs(recentQuery);
    const recentTopics = recentDocs.docs.map((doc) => doc.data().userDescription);

    // Determine best performing template and tone
    const bestTemplate =
      Object.entries(profile.topPerformingTemplates || {}).length > 0
        ? Object.entries(profile.topPerformingTemplates).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0]
        : "linkedin";

    const bestTone =
      Object.entries(profile.topPerformingTones || {}).length > 0
        ? Object.entries(profile.topPerformingTones).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0]
        : "professional";

    // Create suggestions (in real implementation, would use trending topics API)
    const suggestions: ContentSuggestion[] = [
      {
        suggestionId: `suggestion_${Date.now()}_1`,
        workspaceId,
        suggestedTemplate: bestTemplate as any,
        suggestedTone: bestTone as any,
        suggestedTopic: "Share a recent win or achievement with your audience",
        confidenceScore: 0.92,
        reasoning: `Based on your content history, ${bestTemplate} posts with a ${bestTone} tone get the best engagement`,
        predictedEngagement: 0.85,
        createdAt: new Date(),
        approved: false,
        published: false,
      },
      {
        suggestionId: `suggestion_${Date.now()}_2`,
        workspaceId,
        suggestedTemplate:
          bestTemplate === "linkedin" ? "twitter" : "linkedin",
        suggestedTone: bestTone,
        suggestedTopic: "Provide industry insight or prediction",
        confidenceScore: 0.78,
        reasoning: `Diversifying platforms can expand your reach. Try this on a different channel`,
        predictedEngagement: 0.72,
        createdAt: new Date(),
        approved: false,
        published: false,
      },
      {
        suggestionId: `suggestion_${Date.now()}_3`,
        workspaceId,
        suggestedTemplate: "newsletter",
        suggestedTone: "inspirational",
        suggestedTopic: "Share your vision or company culture",
        confidenceScore: 0.65,
        reasoning: `Newsletter content that builds deeper connections performs well in your niche`,
        predictedEngagement: 0.68,
        createdAt: new Date(),
        approved: false,
        published: false,
      },
    ];

    // Save suggestions
    for (const suggestion of suggestions) {
      await addDoc(collection(db, "content_suggestions"), suggestion);
    }

    return suggestions;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    throw error;
  }
}

/**
 * Track content performance for learning
 */
export async function trackContentPerformance(
  contentId: string,
  workspaceId: string,
  performance: Partial<ContentPerformance>
): Promise<void> {
  try {
    const contentRef = doc(db, "content_generations", contentId);
    await updateDoc(contentRef, {
      performance,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking content performance:", error);
    throw error;
  }
}

/**
 * Get pending suggestions for approval
 */
export async function getPendingSuggestions(
  workspaceId: string
): Promise<ContentSuggestion[]> {
  try {
    const q = query(
      collection(db, "content_suggestions"),
      where("workspaceId", "==", workspaceId),
      where("approved", "==", false),
      where("published", "==", false)
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const data = doc.data() as Partial<ContentSuggestion> & Record<string, any>;
      return {
        suggestionId: data.suggestionId || doc.id,
        workspaceId: data.workspaceId || "",
        suggestedTemplate: data.suggestedTemplate || "",
        suggestedTone: data.suggestedTone || "",
        suggestedTopic: data.suggestedTopic || "",
        confidenceScore: data.confidenceScore ?? 0,
        reasoning: data.reasoning || "",
        predictedEngagement: data.predictedEngagement ?? 0,
        createdAt: (data.createdAt as any) || new Date(),
        approved: data.approved ?? false,
        published: data.published ?? false,
        id: doc.id,
      } as ContentSuggestion;
    });
  } catch (error) {
    console.error("Error getting pending suggestions:", error);
    throw error;
  }
}

/**
 * Approve and schedule a suggestion
 */
export async function approveSuggestion(
  suggestionId: string,
  workspaceId: string
): Promise<void> {
  try {
    const suggestionRef = doc(db, "content_suggestions", suggestionId);
    await updateDoc(suggestionRef, {
      approved: true,
      approvedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error approving suggestion:", error);
    throw error;
  }
}

/**
 * Enable auto-posting mode - agent will post suggestions automatically
 */
export async function enableAutoPosting(
  workspaceId: string,
  enabled: boolean = true
): Promise<void> {
  try {
    const workspaceRef = doc(db, "workspaces", workspaceId);
    await updateDoc(workspaceRef, {
      autoPostingEnabled: enabled,
      autoPostingStartedAt: enabled ? serverTimestamp() : null,
    });
  } catch (error) {
    console.error("Error enabling auto-posting:", error);
    throw error;
  }
}

/**
 * Get auto-posting status
 */
export async function getAutoPostingStatus(
  workspaceId: string
): Promise<{ enabled: boolean; startedAt?: Date }> {
  try {
    const workspaceRef = doc(db, "workspaces", workspaceId);
    const snap = await getDoc(workspaceRef);

    if (snap.exists()) {
      return {
        enabled: snap.data().autoPostingEnabled || false,
        startedAt: snap.data().autoPostingStartedAt?.toDate(),
      };
    }

    return { enabled: false };
  } catch (error) {
    console.error("Error getting auto-posting status:", error);
    return { enabled: false };
  }
}
