import { getFirestore, serverTimestamp } from "firebase/firestore";
import { CampaignRun } from "../lib/types/campaignRun";
import { collection, addDoc } from "firebase/firestore";

export async function createCampaignRun(
  workspaceId: string,
  workflowRunId: string,
  name: string,
  channel: CampaignRun["channel"],
  createdByUid: string,
  createdByName?: string,
  audienceTotal: number = 0,
  messageTemplateId?: string,
  messagePreview?: string,
  campaignId?: string,
  channelsEnabled?: string[],
  startAt?: any,
  endAt?: any
): Promise<string> {
  const db = getFirestore();
  const docRef = await addDoc(collection(db, "campaign_runs"), {
    workspaceId,
    workflowRunId,
    campaignId,
    name,
    channel,
    channelsEnabled: channelsEnabled || [channel],
    status: "scheduled",
    scheduledAt: serverTimestamp(),
    startAt: startAt || null,
    endAt: endAt || null,
    createdByUid,
    createdByName,
    audience: {
      total: audienceTotal,
      sent: 0,
      delivered: 0,
      failed: 0,
      replied: 0,
      queued: 0,
      opened: 0,
      clicked: 0,
    },
    messageTemplateId,
    messagePreview,
    logs: [],
    lastError: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}
