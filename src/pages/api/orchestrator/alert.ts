// API endpoint to trigger orchestrator alert emails
import type { NextApiRequest, NextApiResponse } from "next";
import { sendOrchestratorAlert } from "@/lib/orchestrator/alertEmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ error: "subject and message required" });
  try {
    await sendOrchestratorAlert(subject, message);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to send email" });
  }
}
