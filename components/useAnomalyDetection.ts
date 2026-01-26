import { useEffect, useState } from "react";

// Simple anomaly detection: flag spikes in retry counts or failures
export function useAnomalyDetection(stepRetries: any[] | null) {
  const [anomalies, setAnomalies] = useState<string[]>([]);

  useEffect(() => {
    if (!stepRetries) return;
    const alerts: string[] = [];
    // Example: flag any tool with >3 retries in last 10 minutes
    const now = Date.now();
    for (const r of stepRetries) {
      if (r.retryCount > 3 && r.lastRetryAt && (now - r.lastRetryAt.seconds * 1000) < 10 * 60 * 1000) {
        alerts.push(`High retry rate for tool ${r.tool} (step: ${r.stepType})`);
      }
      if (r.status === 'failed' && r.lastRetryAt && (now - r.lastRetryAt.seconds * 1000) < 10 * 60 * 1000) {
        alerts.push(`Recent failure for tool ${r.tool} (step: ${r.stepType})`);
      }
    }
    setAnomalies(alerts);
  }, [stepRetries]);

  return anomalies;
}
