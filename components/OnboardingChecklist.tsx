import React, { useEffect, useState } from "react";
import { SocialConnectionStatus } from "./SocialConnectionStatus";
import { reconnectSocialPlatform } from "../lib/reconnectSocialPlatform";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { OnboardingState } from "../lib/types/onboarding";

interface OnboardingChecklistProps {
  userId: string;
  workspaceId: string;
}

const DEFAULT_STEPS = [
  { key: "verify_email", label: "Verify Email", description: "Confirm your email address to secure your account." },
  { key: "set_profile_picture", label: "Set Profile Picture", description: "Upload a profile picture for your account." },
  { key: "invite_team", label: "Invite a team member", description: "Invite at least one team member to collaborate." },
  { key: "run_first_workflow", label: "Run your first workflow", description: "Complete your first workflow to get started." },
  { key: "connect_twitter", label: "Connect Twitter/X", description: "Connect your Twitter/X account for agent automation." },
  { key: "connect_facebook", label: "Connect Facebook", description: "Connect your Facebook account for agent automation." },
  { key: "connect_linkedin", label: "Connect LinkedIn", description: "Connect your LinkedIn account for agent automation." },
  { key: "connect_instagram", label: "Connect Instagram", description: "Connect your Instagram account for agent automation." },
  { key: "connect_slack", label: "Connect Slack", description: "Connect your Slack workspace for agent automation." },
  { key: "connect_discord", label: "Connect Discord", description: "Connect your Discord server for agent automation." },
  { key: "connect_googleworkspace", label: "Connect Google Workspace", description: "Connect your Google Workspace for agent automation." },
  { key: "connect_msteams", label: "Connect Microsoft Teams", description: "Connect your Microsoft Teams for agent automation." },
  { key: "connect_reddit", label: "Connect Reddit", description: "Connect your Reddit account for agent automation." },
  { key: "connect_youtube", label: "Connect YouTube", description: "Connect your YouTube channel for agent automation." },
  { key: "connect_tiktok", label: "Connect TikTok", description: "Connect your TikTok account for agent automation." },
  { key: "connect_whatsapp", label: "Connect WhatsApp Business API", description: "Connect your WhatsApp Business API for agent automation." },
  { key: "connect_angieslist", label: "Connect Angie's List", description: "Connect your Angie's List account for agent automation." },
  { key: "connect_nextdoor", label: "Connect NextDoor", description: "Connect your NextDoor account for agent automation." },
  { key: "connect_snapchat", label: "Connect Snapchat", description: "Connect your Snapchat account for agent automation." },
];

export default function OnboardingChecklist({ userId, workspaceId }: OnboardingChecklistProps) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !workspaceId) return;
    async function fetchState() {
      setLoading(true);
      const ref = doc(db, "onboarding_states", `${userId}_${workspaceId}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setState(snap.data() as OnboardingState);
      } else {
        // Initialize onboarding state
        const newState: OnboardingState = {
          userId,
          workspaceId,
          startedAt: new Date().toISOString(),
          completed: false,
          steps: DEFAULT_STEPS.map(s => ({ ...s, completed: false })),
        };
        await setDoc(ref, newState);
        setState(newState);
      }
      setLoading(false);
    }
    fetchState();
  }, [userId, workspaceId]);

  if (loading || !state) return <div>Loading onboarding...</div>;

  const completeStep = async (key: string) => {
    const ref = doc(db, "onboarding_states", `${userId}_${workspaceId}`);
    const updatedSteps = state.steps.map(s =>
      s.key === key ? { ...s, completed: true, completedAt: new Date().toISOString() } : s
    );
    const completed = updatedSteps.every(s => s.completed);
    const updatedState = { ...state, steps: updatedSteps, completed, completedAt: completed ? new Date().toISOString() : undefined };
    await setDoc(ref, updatedState);
    setState(updatedState);
  };

  // Social connection auto-complete logic
  useEffect(() => {
    if (!state) return;
    const socialStep = state.steps.find(s => s.key === "connect_social");
    if (socialStep && !socialStep.completed) {
      // Check if social connection exists and is healthy
      // For demo, assume platform 'twitter'. In production, make this dynamic.
      import("../lib/useSocialConnection").then(({ useSocialConnection }) => {
        // useSocialConnection is a hook, so we can't call it here directly.
        // Instead, recommend to use SocialConnectionStatus in the UI below.
      });
    }
  }, [state]);

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 32, maxWidth: 420, margin: '40px auto', boxShadow: '0 2px 12px #0001' }}>
      <h2 style={{ marginBottom: 24 }}>Get Started</h2>
      <ol style={{ paddingLeft: 24 }}>
        {state.steps.map(step => (
          <li key={step.key} style={{ marginBottom: 18, fontSize: 17, display: 'flex', alignItems: 'center', gap: 10 }} title={step.description}>
            <span style={{ fontWeight: 500 }}>{step.label}</span>
            {step.description && (
              <span style={{ color: '#888', fontSize: 14, marginLeft: 6 }} title={step.description}></span>
            )}
            {step.key === "verify_email" ? (
              <>
                {!step.completed && (
                  <button style={{ marginLeft: 10 }} onClick={() => completeStep(step.key)}>Verify</button>
                )}
                {step.completed && <span style={{ color: '#28a745', fontWeight: 600 }}> Done</span>}
              </>
            ) : step.key === "set_profile_picture" ? (
              <>
                {!step.completed && (
                  <button style={{ marginLeft: 10 }} onClick={() => completeStep(step.key)}>Upload</button>
                )}
                {step.completed && <span style={{ color: '#28a745', fontWeight: 600 }}> Done</span>}
              </>
            ) : step.key === "connect_twitter" ? (
              <>
                <SocialConnectionStatus
                  userId={userId}
                  platform="twitter"
                  onReconnect={async () => {
                    await reconnectSocialPlatform(userId, "twitter");
                    completeStep("connect_twitter");
                  }}
                />
                {!step.completed && (
                  <button
                    style={{ marginLeft: 10 }}
                    onClick={async () => {
                      await reconnectSocialPlatform(userId, "twitter");
                      completeStep("connect_twitter");
                    }}
                  >
                    Connect
                  </button>
                )}
                {step.completed && <span style={{ color: '#28a745', fontWeight: 600 }}> Done</span>}
              </>
            ) : step.key === "connect_facebook" ? (
              <>
                <SocialConnectionStatus
                  userId={userId}
                  platform="facebook"
                  onReconnect={async () => {
                    await reconnectSocialPlatform(userId, "facebook");
                    completeStep("connect_facebook");
                  }}
                />
                {!step.completed && (
                  <button
                    style={{ marginLeft: 10 }}
                    onClick={async () => {
                      await reconnectSocialPlatform(userId, "facebook");
                      completeStep("connect_facebook");
                    }}
                  >
                    Connect
                  </button>
                )}
                {step.completed && <span style={{ color: '#28a745', fontWeight: 600 }}> Done</span>}
              </>
            ) : step.key === "connect_snapchat" ? (
              <>
                <SocialConnectionStatus
                  userId={userId}
                  platform="snapchat"
                  onReconnect={async () => {
                    await reconnectSocialPlatform(userId, "snapchat");
                    completeStep("connect_snapchat");
                  }}
                />
                {!step.completed && (
                  <button
                    style={{ marginLeft: 10 }}
                    onClick={async () => {
                      await reconnectSocialPlatform(userId, "snapchat");
                      completeStep("connect_snapchat");
                    }}
                  >
                    Connect
                  </button>
                )}
                {step.completed && <span style={{ color: '#28a745', fontWeight: 600 }}> Done</span>}
              </>
            ) : step.completed ? (
              <span style={{ color: '#28a745', fontWeight: 600 }}> Done</span>
            ) : (
              <button onClick={() => completeStep(step.key)} style={{ marginLeft: 10 }}>Mark Complete</button>
            )}
          </li>
        ))}
      </ol>
      {state.completed && <div style={{ marginTop: 24, color: '#007bff', fontWeight: 600 }}> Onboarding complete! Youre ready to use the app.</div>}
    </div>
  );
}

