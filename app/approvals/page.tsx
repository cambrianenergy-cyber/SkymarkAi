"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ApprovalsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApprovals() {
      setLoading(true);
      try {
        const q = query(collection(db, "approval_tasks"), where("status", "==", "pending"));
        const snap = await getDocs(q);
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e: any) {
        setError(e.message || "Failed to load approval tasks");
      }
      setLoading(false);
    }
    fetchApprovals();
  }, []);

  async function handleApprove(id: string) {
    await updateDoc(doc(db, "approval_tasks", id), { status: "approved", updatedAt: new Date() });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }
  async function handleReject(id: string) {
    const reason = prompt("Reason for rejection?") || "Rejected by human approver";
    await updateDoc(doc(db, "approval_tasks", id), { status: "rejected", reason, updatedAt: new Date() });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) return <main style={{ padding: 32 }}><h1>Loading approvals</h1></main>;
  if (error) return <main style={{ padding: 32, color: 'red' }}>{error}</main>;

  return (
    <main style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Pending Approvals</h1>
      {tasks.length === 0 ? (
        <div style={{ color: '#888' }}>No pending approval tasks.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task) => (
            <li key={task.id} style={{ marginBottom: 24, padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#fafbfc' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Workflow Run: {task.runId}</div>
              <div style={{ marginBottom: 8 }}>Step: {task.stepId}</div>
              <div style={{ marginBottom: 12 }}>Instruction: <span style={{ color: '#1976d2' }}>{task.instruction}</span></div>
              <button onClick={() => handleApprove(task.id)} style={{ marginRight: 12, background: '#22c55e', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
              <button onClick={() => handleReject(task.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
