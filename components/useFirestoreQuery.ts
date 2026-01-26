// Utility React hook for real-time Firestore query (with where)
import { useEffect, useState } from "react";
import { db } from "@lib/firebase";
import { collection, onSnapshot, query, where, QueryConstraint, QuerySnapshot, DocumentData } from "firebase/firestore";

export function useFirestoreQuery<T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[]
): [T[] | null, boolean, any] {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, collectionPath);
    const q = query(colRef, ...constraints);
    const unsub = onSnapshot(
      q,
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
  }, [collectionPath, JSON.stringify(constraints)]);

  return [data, loading, error];
}
