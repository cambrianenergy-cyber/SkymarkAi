// Stub for Sentry to unblock build
const Sentry = {
	captureException: (...args: any[]) => {}
};

export function captureApiError(err: unknown, context?: Record<string, any>) {
	const e = err instanceof Error ? err : new Error(String(err));
	Sentry.captureException(e, { extra: context });
}
