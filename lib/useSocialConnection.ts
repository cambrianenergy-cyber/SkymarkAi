import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@lib/firebase";
import type SocialConnection from "../lib/types/socialConnection";

export function useSocialConnection(userId: string, platform: string) {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !platform) return;
    const id = `${userId}_${platform}`;
    const ref = doc(db, "connections", id);
    const unsub = onSnapshot(ref, (snap) => {
      setConnection(snap.exists() ? (snap.data() as SocialConnection) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [userId, platform]);

  return { connection, loading };
}
