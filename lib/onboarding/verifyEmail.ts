
import { adminAuth } from "@/lib/firebaseAdmin";

export async function verifyEmail(uid: string): Promise<boolean> {
  const user = await adminAuth.getUser(uid);
  return user.emailVerified === true;
}
