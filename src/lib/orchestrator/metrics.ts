import { performance } from "perf_hooks";

// Simple in-memory metrics store (replace with Prometheus or similar in production)
const metrics: Record<string, number> = {};

export function recordMetric(name: string, value: number = 1) {
  metrics[name] = (metrics[name] || 0) + value;
}

export function getMetric(name: string) {
  return metrics[name] || 0;
}

export function getAllMetrics() {
  return { ...metrics };
}

export function timeSync<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    recordMetric(`${name}_ms`, performance.now() - start);
    recordMetric(`${name}_count`, 1);
  }
}

export async function timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    recordMetric(`${name}_ms`, performance.now() - start);
    recordMetric(`${name}_count`, 1);
  }
}
