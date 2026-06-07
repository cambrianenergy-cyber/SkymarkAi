import { getFirestore, serverTimestamp } from "firebase/firestore";
import { CampaignMessage } from "../lib/types/campaignMessage";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";

// Create a new campaign message in campaign_runs/{id}/messages
export async function createCampaignMessage(
  campaignRunId: string,
  message: Omit<CampaignMessage, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getFirestore();
  const messagesRef = collection(db, "campaign_runs", campaignRunId, "messages");
  const docRef = await addDoc(messagesRef, {
    ...message,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Optionally, update a campaign message status or error
export async function updateCampaignMessageStatus(
  campaignRunId: string,
  messageId: string,
  status: CampaignMessage["status"],
  error?: CampaignMessage["error"]
) {
  const db = getFirestore();
  const msgRef = doc(db, "campaign_runs", campaignRunId, "messages", messageId);
  await setDoc(
    msgRef,
    {
      status,
      error: error || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
