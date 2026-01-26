// Utility React hook for real-time Firestore collection data
import { useEffect, useState } from "react";
import { db } from "@lib/firebase";
import { collection, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";

export function useFirestoreCollection<T = DocumentData>(
  collectionPath: string
): [T[] | null, boolean, any] {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, collectionPath);
    const unsub = onSnapshot(
      colRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [collectionPath]);

  return [data, loading, error];
}
