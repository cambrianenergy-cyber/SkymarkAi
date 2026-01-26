import { adminAuth } from "./firebaseAdmin";
import { NextRequest } from "next/server";

/**
 * Verifies the Firebase ID token from the Authorization header and returns the decoded user info.
 * Throws an error if the token is missing or invalid.
 */
export async function requireAuth(req: NextRequest): Promise<any> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const idToken = authHeader.split(" ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
