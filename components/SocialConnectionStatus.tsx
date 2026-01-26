import React from "react";
import { useSocialConnection } from "../lib/useSocialConnection";

interface Props {
  userId: string;
  platform: string;
  onReconnect?: () => void;
}

export function SocialConnectionStatus({ userId, platform, onReconnect }: Props) {
  const { connection, loading } = useSocialConnection(userId, platform);

  if (loading) return <span>Checking connection...</span>;
  if (!connection) return <span style={{ color: "red" }}>Not connected</span>;

  let statusColor = "green";
  let statusText = "Connected";
  let showReconnect = false;

  if (connection.status === "expired" || (connection.expiresAt && connection.expiresAt < Date.now())) {
    statusColor = "orange";
    statusText = "Expired";
    showReconnect = true;
  } else if (connection.status === "revoked") {
    statusColor = "red";
    statusText = "Revoked";
    showReconnect = true;
  }

  return (
    <span style={{ color: statusColor }}>
      {statusText}
      {showReconnect && onReconnect && (
        <button style={{ marginLeft: 8 }} onClick={onReconnect}>
          Reconnect
        </button>
      )}
    </span>
  );
}
