export function trackEvent(event: string, properties?: Record<string, any>) {
  try {
    // @ts-ignore
    const ph = (typeof window !== 'undefined') ? (window as any).posthog : null;
    if (ph && typeof ph.capture === 'function') {
      ph.capture(event, properties || {});
    } else {
      // No-op if PostHog not initialized
    }
  } catch (_) {
    // swallow
  }
}
