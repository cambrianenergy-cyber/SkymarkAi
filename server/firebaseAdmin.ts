// Stub for adminDb to unblock build
// Minimal stub to mimic Firestore admin API for build unblock
export function adminDb() {
  return {
    collection: (_name: string) => ({
      doc: (id: string) => ({
        async get() {
          return { exists: false, id, data: () => ({}) };
        },
      }),
    }),
  };
}
