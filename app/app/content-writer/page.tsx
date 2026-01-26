"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useWorkspace } from "../../../lib/useWorkspace";

type Template = "linkedin" | "twitter" | "instagram" | "tiktok" | "blog" | "newsletter" | "email";
type Tone = "professional" | "casual" | "humorous" | "inspirational";

interface GeneratedContent {
  platform: string;
  content: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
  characterCount?: number;
  estimatedEngagement?: string;
}

export default function ContentWriterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const workspace = useWorkspace(user);

  // Form state
  const [userDescription, setUserDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template>("linkedin");
  const [tone, setTone] = useState<Tone>("professional");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentHistory, setContentHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GeneratedContent[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
    });
    return () => unsub();
  }, [router]);

  // Load content history
  const loadHistory = async () => {
    if (!user || !workspace.workspaceId) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, "content_generations"),
        where("workspaceId", "==", workspace.workspaceId),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const history = snap.docs.map((doc) => {
        const data = doc.data() as any;
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || 0;
        return {
          id: doc.id,
          ...data,
          createdAt,
        };
      });
      setContentHistory(history.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) as any);
    } catch (error) {
      console.error("Error loading history:", error);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (user && workspace.workspaceId && showHistory) {
      loadHistory();
    }
  }, [user, workspace.workspaceId, showHistory]);

  // Generate content using the orchestrator
  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userDescription.trim()) {
      alert("Please describe your idea or goal");
      return;
    }

    if (!user || !workspace.workspaceId) {
      alert("Please log in");
      return;
    }

    setIsGenerating(true);
    try {
      // Create a workflow run with Content_Writer agent
      const runRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId: workspace.workspaceId,
        workflowId: "content-writer-single",
        workflowName: "Content Writer - Single Post",
        runType: "manual",
        status: "queued",
        createdByUid: user.uid,
        createdByName: user.displayName || "User",
        inputs: {
          userDescription,
          template: selectedTemplate,
          tone,
          includeHashtags,
          includeCTA,
        },
        outputs: null,
        steps: [
          {
            stepId: "content_writer_1",
            order: 1,
            agentType: "Content_Writer",
            instruction: `Generate ${selectedTemplate} content from user description with ${tone} tone. Include hashtags: ${includeHashtags}, Include CTA: ${includeCTA}`,
            status: "pending",
            input: {
              userDescription,
              template: selectedTemplate,
              tone,
              includeHashtags,
              includeCTA,
            },
          },
        ],
        progress: {
          totalSteps: 1,
          completedSteps: 0,
          currentStepOrder: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Execute the workflow
      const response = await fetch("/api/orchestrator/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: runRef.id }),
      });

      const result = await response.json();

      if (result.success && result.output) {
        const content = result.output.content;
        setGeneratedContent(content);

        // Save to history
        await addDoc(collection(db, "content_generations"), {
          workspaceId: workspace.workspaceId,
          userId: user.uid,
          userDescription,
          template: selectedTemplate,
          tone,
          generatedContent: content,
          runId: runRef.id,
          createdAt: new Date(),
          savedAt: null,
          published: false,
        });
      } else {
        alert("Error generating content: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Error generating content. Check console for details.");
    }
    setIsGenerating(false);
  };

  // Generate smart suggestions (mock implementation)
  const handleGenerateSuggestions = async () => {
    if (!user || !workspace.workspaceId) {
      alert("Please log in");
      return;
    }

    setIsGenerating(true);
    try {
      // For demo, generate 3 different content suggestions
      const platforms: Template[] = ["linkedin", "twitter", "instagram"];
      const mockDescription = "Announce our new AI-powered automation feature that saves teams 10 hours per week";

      const suggestionsList: GeneratedContent[] = [];
      for (const platform of platforms) {
        // Reuse generation logic
        const formData = new FormData();
        formData.append("userDescription", mockDescription);
        formData.append("template", platform);
        formData.append("tone", "professional");

        // For demo purposes, just create mock suggestions
        suggestionsList.push({
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          content: `Generated suggestion for ${platform}: ${mockDescription.substring(0, 100)}...`,
          hook: `Check this out on ${platform}!`,
          characterCount: 150,
          estimatedEngagement: "High",
        });
      }

      setSuggestions(suggestionsList);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Error generating suggestions");
    }
    setIsGenerating(false);
  };

  // Save content for later
  const handleSaveContent = async () => {
    if (!generatedContent || !user || !workspace.workspaceId) return;

    try {
      await addDoc(collection(db, "saved_content"), {
        workspaceId: workspace.workspaceId,
        userId: user.uid,
        content: generatedContent,
        template: selectedTemplate,
        description: userDescription,
        createdAt: serverTimestamp(),
        archived: false,
      });

      alert("Content saved! You can access it later in your content library.");
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Error saving content");
    }
  };

  // Copy to clipboard
  const handleCopyContent = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent.content);
    alert("Content copied to clipboard!");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Content Writer</h1>
          <p className="text-gray-600">
            Describe your idea, pick a platform, and get ready-to-publish content in seconds
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleGenerateContent} className="space-y-6">
                {/* User Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What do you want to post about? *
                  </label>
                  <textarea
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    placeholder="Describe your idea, achievement, insight, or announcement..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific. Include context about what you're sharing and why it matters.
                  </p>
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Platform/Format *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["linkedin", "twitter", "instagram", "tiktok", "blog", "newsletter", "email"] as const).map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => setSelectedTemplate(platform)}
                        className={`p-3 rounded-lg text-sm font-medium transition ${
                          selectedTemplate === platform
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        disabled={isGenerating}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tone
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["professional", "casual", "humorous", "inspirational"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`p-2 rounded-lg text-sm transition ${
                          tone === t
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        disabled={isGenerating}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeHashtags}
                      onChange={(e) => setIncludeHashtags(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                      disabled={isGenerating}
                    />
                    <span className="ml-2 text-sm text-gray-700">Include hashtags</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeCTA}
                      onChange={(e) => setIncludeCTA(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                      disabled={isGenerating}
                    />
                    <span className="ml-2 text-sm text-gray-700">Include call-to-action</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isGenerating || !userDescription.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isGenerating ? "Generating..." : "Generate Content"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateSuggestions}
                    disabled={isGenerating}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Get Smart Suggestions
                  </button>
                </div>
              </form>

              {/* Quick Actions */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showHistory ? "Hide" : "View"} Content History
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            {generatedContent ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedContent.content}
                    </p>
                  </div>

                  {generatedContent.characterCount && (
                    <div className="text-xs text-gray-500">
                      <p> {generatedContent.characterCount} characters</p>
                      <p> {generatedContent.estimatedEngagement}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      onClick={handleCopyContent}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={handleSaveContent}
                      className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                    >
                      Save for Later
                    </button>
                    <a
                      href="/app/schedule"
                      className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition text-center"
                    >
                      Schedule Post
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-gray-600 text-sm">
                  Your generated content will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Content</h3>
            {loadingHistory ? (
              <p className="text-gray-500">Loading...</p>
            ) : contentHistory.length > 0 ? (
              <div className="space-y-4">
                {contentHistory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {item.template}  {new Date(item.createdAt.toDate()).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.userDescription}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No content history yet</p>
            )}
          </div>
        )}

        {/* Suggestions Modal */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Content Suggestions</h3>
                <div className="space-y-4">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <p className="font-medium text-gray-900">{suggestion.platform}</p>
                      <p className="text-sm text-gray-600 mt-2">{suggestion.content.substring(0, 100)}...</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

