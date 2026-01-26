export function safeParseJSON<T = any>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const v = JSON.parse(text);
    return { ok: true, value: v };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}
