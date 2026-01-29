import { auth } from "@/lib/firebaseAdmin";

export async function verifyEmail(uid: string): Promise<boolean> {
  const user = await auth.getUser(uid);
  return user.emailVerified === true;
}
