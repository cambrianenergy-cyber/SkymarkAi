import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface DeadLetterItem {
  id: string;
  type: string; // e.g. 'agent_task', 'event', etc.
  payload: any;
  error: string;
  createdAt: string;
  workspaceId?: string;
  retryCount?: number;
}

export async function writeToDeadLetterQueue(item: Omit<DeadLetterItem, "id" | "createdAt"> & { id?: string }) {
  const id = item.id || `${item.type}_${Date.now()}`;
  const ref = doc(db, "dead_letter", id);
  const record: DeadLetterItem = {
    ...item,
    id,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, record);
  return record;
}
