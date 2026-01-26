"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useWorkspace } from "../../../lib/useWorkspace";
import { getPendingSuggestions, approveSuggestion, enableAutoPosting, getAutoPostingStatus } from "../../../lib/contentLearning";

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
  id?: string;
}

export default function SmartContentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const workspace = useWorkspace(user);
  const workspaceId = workspace.workspaceId;

  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

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

  // Load suggestions and auto-posting status
  useEffect(() => {
    if (!user || !workspaceId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get suggestions
        const pending = await getPendingSuggestions(workspaceId);
        setSuggestions(pending);

        // Get auto-posting status
        const status = await getAutoPostingStatus(workspaceId);
        setAutoPostingEnabled(status.enabled);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, workspaceId]);

  const handleApproveSuggestion = async (suggestionId: string) => {
    if (!workspaceId) return;

    setApproving(suggestionId);
    try {
      await approveSuggestion(suggestionId, workspaceId);
      setSuggestions(suggestions.filter((s) => s.id !== suggestionId));
      alert("Suggestion approved! It will be posted according to your schedule.");
    } catch (error) {
      console.error("Error approving suggestion:", error);
      alert("Error approving suggestion");
    } finally {
      setApproving(null);
    }
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== suggestionId));
  };

  const handleToggleAutoPosting = async () => {
    if (!workspaceId) return;

    try {
      const newState = !autoPostingEnabled;
      await enableAutoPosting(workspaceId, newState);
      setAutoPostingEnabled(newState);

      alert(
        newState
          ? "Auto-posting enabled! The agent will automatically post approved suggestions."
          : "Auto-posting disabled. You'll need to manually approve suggestions."
      );
    } catch (error) {
      console.error("Error toggling auto-posting:", error);
      alert("Error updating auto-posting settings");
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Content Engine</h1>
          <p className="text-gray-600">
            Review AI-powered content suggestions and approve them for automatic posting
          </p>
        </div>

        {/* Auto-Posting Toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Auto-Posting Mode</h3>
              <p className="text-sm text-gray-600 mt-1">
                {autoPostingEnabled
                  ? "The agent is actively suggesting and posting content for you"
                  : "Enable to let the agent automatically post approved suggestions"}
              </p>
            </div>
            <button
              onClick={handleToggleAutoPosting}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                autoPostingEnabled ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  autoPostingEnabled ? "translate-x-9" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Pending Suggestions ({suggestions.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {suggestion.suggestedTemplate.charAt(0).toUpperCase() +
                          suggestion.suggestedTemplate.slice(1)}{" "}
                        Post
                      </h3>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          suggestion.confidenceScore > 0.85
                            ? "bg-green-100 text-green-800"
                            : suggestion.confidenceScore > 0.7
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {Math.round(suggestion.confidenceScore * 100)}% Confidence
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Topic:</strong> {suggestion.suggestedTopic}
                    </p>

                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Why:</strong> {suggestion.reasoning}
                    </p>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Tone: {suggestion.suggestedTone}</span>
                      <span>
                        Expected Engagement:{" "}
                        {Math.round(suggestion.predictedEngagement * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-4">
                      {Math.round(suggestion.confidenceScore * 100)}%
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApproveSuggestion(suggestion.id || "")}
                    disabled={approving === suggestion.id}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {approving === suggestion.id ? "Approving..." : " Approve"}
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.id || "")}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                     Dismiss
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/app/content-writer?suggestion=${encodeURIComponent(
                          suggestion.suggestedTopic
                        )}`
                      )
                    }
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4"></div>
              <p className="text-gray-600 mb-4">No pending suggestions right now</p>
              <p className="text-sm text-gray-500 mb-6">
                The agent will create new suggestions based on your content history and industry trends
              </p>
              <button
                onClick={() => router.push("/app/content-writer")}
                className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Create Content Now
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How Smart Content Works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
               The agent learns from your approved content and sees what gets the best engagement
            </li>
            <li>
               Every time you generate content, it trains the system on your brand voice and style
            </li>
            <li>
               Based on what works for you, the agent suggests tailored post ideas and topics
            </li>
            <li>
               Approve suggestions manually, or enable auto-posting to let the agent post automatically
            </li>
            <li>
               The more content you create, the smarter and more accurate the suggestions become
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

