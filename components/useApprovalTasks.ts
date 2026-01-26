import { useEffect, useState } from "react";
import { db } from "@lib/firebase";
import { collection, query, where, onSnapshot, DocumentData } from "firebase/firestore";

export function useApprovalTasks(filter: { status?: string } = {}) {
  const [tasks, setTasks] = useState<DocumentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    let q = collection(db, "approval_tasks");
    if (filter.status) {
      q = query(q, where("status", "==", filter.status));
    }
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });
    return () => unsub();
  }, [filter.status]);

  return [tasks, loading, error] as const;
}
