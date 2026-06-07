"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BRAND } from "@/lib/config";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      router.push("/app");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    }
  }

  async function handleGoogleLogin() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/app");
    } catch (err: any) {
      setError(err?.message ?? "Google login failed");
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "70px auto", padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <img 
          src={BRAND.logoPath} 
          alt={BRAND.app} 
          style={{ height: 28 }} 
          onError={(e: any) => { e.currentTarget.style.display = 'none'; }} 
        />
        <strong>{BRAND.app}</strong>
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 900 }}>
        {mode === "login" ? "Log In" : "Sign Up"}
      </h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          style={{ padding: 12 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          style={{ padding: 12 }}
        />

        <button type="submit" style={{ padding: 12, fontWeight: 900 }}>
          {mode === "login" ? "Log In" : "Create Account"}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{ padding: 12, background: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: 4 }}
        >
          Continue with Google
        </button>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{ padding: 10 }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>

        <button
          type="button"
          onClick={() => setMode("signup")}
          style={{ padding: 10 }}
        >
          Create Account
        </button>
      </form>
    </main>
  );
}
