"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName,
        onboardingStatus: "IN_PROGRESS",
        createdAt: new Date().toISOString(),
      });
      router.push("/onboarding");
    } catch (err: any) {
      setError(err?.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "70px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, fontWeight: 900 }}>Sign Up</h1>
      <form onSubmit={handleSignup} style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Full Name"
          required
          style={{ padding: 12 }}
        />
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          style={{ padding: 12 }}
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
          style={{ padding: 12 }}
        />
        <input
          value={passwordConfirm}
          onChange={e => setPasswordConfirm(e.target.value)}
          placeholder="Confirm Password"
          type="password"
          required
          style={{ padding: 12 }}
        />
        <button type="submit" style={{ padding: 12, fontWeight: 900 }} disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    </main>
  );
}
