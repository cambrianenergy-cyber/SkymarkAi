"use client";
import React, { useEffect } from "react";
import { useUserRole } from "../../components/UserRoleContext";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (role === "founder") {
        router.replace("/app");
      } else {
        router.replace("/onboarding/welcome");
      }
    }
  }, [role, loading, router]);

  return null;
}
