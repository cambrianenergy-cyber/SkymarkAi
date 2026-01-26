import React from "react";
import Link from "next/link";
import { useUserRole } from "./UserRoleContext";

export default function Sidebar() {
  const { role, workspaceRole, loading } = useUserRole();
  if (loading) return null;

  return (
    <nav style={{
      width: 220,
      minHeight: "100vh",
      background: "#f5f7fa",
      borderRight: "1px solid #e0e7ef",
      padding: "32px 0 0 0",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 10,
    }}>
      <Link href="/" style={{ padding: "12px 32px", fontWeight: 700, color: "#222", textDecoration: "none" }}>Home</Link>
      {/* Only show founder/admin menu for those roles */}
      {role === 'founder' && (
        <Link href="/founder" style={{ padding: "12px 32px", fontWeight: 700, color: "#1976d2", textDecoration: "none" }}>Founder Dashboard</Link>
      )}
      {role === 'admin' && (
        <Link href="/admin" style={{ padding: "12px 32px", fontWeight: 700, color: "#1976d2", textDecoration: "none" }}>Admin Panel</Link>
      )}
      {/* User menu: only show minimal, necessary options */}
      {(role === 'owner' || role === 'manager' || role === 'analyst' || role === 'user' || !role) && (
        <>
          <Link href="/dashboard" style={{ padding: "12px 32px", fontWeight: 700, color: "#1976d2", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/profile" style={{ padding: "12px 32px", fontWeight: 700, color: "#1976d2", textDecoration: "none" }}>Profile</Link>
        </>
      )}
    </nav>
  );
}
