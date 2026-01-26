export function isFounderUid(uid: string) {
  return !!process.env.FOUNDER_UID && uid === process.env.FOUNDER_UID;
}
