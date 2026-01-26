"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

interface InboxThread {
  id: string;
  workspaceId: string;
  channel: string;
  source: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
  subject?: string;
  status: "open" | "pending" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedToUid?: string;
  lastMessageAt: Timestamp;
  lastMessagePreview: string;
  unreadCount: number;
  tags?: string[];
  suggestedReply?: string;
  createdAt: any;
  updatedAt: any;
}

interface InboxMessage {
  id: string;
  workspaceId: string;
  threadId: string;
  direction: "inbound" | "outbound";
  senderName?: string;
  senderHandle?: string;
  text: string;
  attachments?: any[];
  sentAt: Timestamp;
  status?: "delivered" | "failed";
  createdAt: any;
}

export default function InboxPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draftingReply, setDraftingReply] = useState(false);
  
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [convertingToLead, setConvertingToLead] = useState(false);

  // Filters
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    setLoading(true);
    const threadsQ = query(
      collection(db, "inbox_threads"),
      where("workspaceId", "==", workspaceId)
    );
    const unsubscribe = onSnapshot(threadsQ, (snapshot) => {
      const threadsData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InboxThread[];
      threadsData.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setThreads(threadsData);
      setLoading(false);
    }, (err) => {
      console.error("Inbox threads listener error:", err);
      setThreads([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isReady, isAuthorized, workspaceId]);

  async function selectThread(thread: InboxThread) {
    setSelectedThread(thread);
    setNewMessage("");

    // Mark thread as read
    if (thread.unreadCount > 0) {
      await updateDoc(doc(db, "inbox_threads", thread.id), {
        unreadCount: 0,
        updatedAt: serverTimestamp(),
      });
    }

    // Load messages for this thread
    const messagesQ = query(
      collection(db, "inbox_messages"),
      where("workspaceId", "==", workspaceId),
      where("threadId", "==", thread.id),
      orderBy("sentAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQ, (snapshot) => {
      const messagesData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InboxMessage[];
      setMessages(messagesData);
    });

    return unsubscribe;
  }

  async function handleSendMessage() {
    if (!selectedThread || !newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      const sentAt = Timestamp.now();

      // Create outbound message
      await addDoc(collection(db, "inbox_messages"), {
        workspaceId,
        threadId: selectedThread.id,
        direction: "outbound",
        senderName: user.displayName || user.email,
        text: newMessage.trim(),
        sentAt,
        status: "delivered",
        createdAt: serverTimestamp(),
      });

      // Update thread summary
      await updateDoc(doc(db, "inbox_threads", selectedThread.id), {
        lastMessageAt: sentAt,
        lastMessagePreview: newMessage.trim(),
        updatedAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + (error as any).message);
    } finally {
      setSending(false);
    }
  }

  async function handleUpdateStatus(status: "open" | "pending" | "closed") {
    if (!selectedThread) return;

    try {
      await updateDoc(doc(db, "inbox_threads", selectedThread.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status: " + (error as any).message);
    }
  }

  async function handleUpdatePriority(priority: "low" | "normal" | "high" | "urgent") {
    if (!selectedThread) return;

    try {
      await updateDoc(doc(db, "inbox_threads", selectedThread.id), {
        priority,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority: " + (error as any).message);
    }
  }

  async function handleConvertToLead() {
    if (!selectedThread || convertingToLead || !user || !workspaceId) return;

    setConvertingToLead(true);
    try {
      // Check if thread already has a leadId
      const threadDoc = await getDocs(query(
        collection(db, "inbox_threads"),
        where("__name__", "==", selectedThread.id)
      ));

      if (!threadDoc.empty) {
        const threadData = threadDoc.docs[0].data() as any;
        if (threadData.leadId) {
          // Lead already exists, navigate to it
          router.push(`/app/leads/${threadData.leadId}`);
          setConvertingToLead(false);
          return;
        }
      }

      // Create new lead
      const leadRef = await addDoc(collection(db, "leads"), {
        workspaceId,
        threadId: selectedThread.id,
        fullName: selectedThread.displayName,
        handle: selectedThread.handle || selectedThread.displayName,
        channel: selectedThread.channel,
        status: "open",
        stage: "new",
        score: 0,
        scoreLabel: "cold",
        assignedToUid: user.uid,
        notes: `Converted from ${selectedThread.channel} conversation`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update thread with leadId
      await updateDoc(doc(db, "inbox_threads", selectedThread.id), {
        leadId: leadRef.id,
        tags: [...(selectedThread.tags || []), "lead"],
        updatedAt: serverTimestamp(),
      });

      alert(" Converted to lead successfully!");
      router.push(`/app/leads/${leadRef.id}`);
    } catch (error) {
      console.error("Error converting to lead:", error);
      alert("Failed to convert to lead: " + (error as any).message);
    } finally {
      setConvertingToLead(false);
    }
  }

  async function handleDraftReply() {
    if (!selectedThread || draftingReply) return;

    setDraftingReply(true);
    try {
      // Create workflow to draft reply using community_manager agent
      const steps = [
        {
          stepId: "step_1",
          order: 1,
          agentType: "Community_Manager",
          instruction: `Draft a reply for this conversation. 
Contact: ${selectedThread.displayName} (${selectedThread.handle || ""})
Channel: ${selectedThread.channel}
Recent messages: ${messages.slice(-3).map(m => `${m.direction}: ${m.text}`).join("; ")}
Create a helpful, on-brand response that maintains our tone and addresses their needs.`,
          status: "pending" as const,
        },
      ];

      const runRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId,
        workflowId: "draft_reply",
        workflowName: `Draft Reply: ${selectedThread.displayName}`,
        runType: "manual",
        status: "queued",
        createdByUid: user?.uid || "",
        createdByName: user?.displayName || user?.email || "Unknown",
        inputs: { threadId: selectedThread.id },
        outputs: {},
        steps,
        progress: {
          totalSteps: steps.length,
          completedSteps: 0,
          currentStepOrder: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Execute workflow
      setTimeout(async () => {
        try {
          const response = await fetch("/api/orchestrator/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId: runRef.id, action: "executeAll" }),
          });

          const result = await response.json();

          if (result.success) {
            // Get the suggested reply from output
            const runSnap = await getDocs(
              query(
                collection(db, "workflow_runs"),
                where("__name__", "==", runRef.id)
              )
            );

            if (!runSnap.empty) {
              const runData = runSnap.docs[0].data();
              const output = runData.steps[0]?.output;
              
              if (output && output.reply) {
                // Update thread with suggested reply
                await updateDoc(doc(db, "inbox_threads", selectedThread.id), {
                  suggestedReply: output.reply,
                  suggestedReplyUpdatedAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });

                // Pre-fill the message box
                setNewMessage(output.reply);
                alert(" Reply drafted! Review and edit before sending.");
              }
            }
          }
        } catch (error) {
          console.error("Draft reply error:", error);
          alert("Failed to draft reply: " + (error as any).message);
        } finally {
          setDraftingReply(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error starting draft:", error);
      alert("Failed to start draft: " + (error as any).message);
      setDraftingReply(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "open":
        return { bg: "#d4edda", color: "#155724" };
      case "pending":
        return { bg: "#fff3cd", color: "#856404" };
      case "closed":
        return { bg: "#e2e3e5", color: "#383d41" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "urgent":
        return { bg: "#f8d7da", color: "#721c24" };
      case "high":
        return { bg: "#fff3cd", color: "#856404" };
      case "normal":
        return { bg: "#cfe2ff", color: "#084298" };
      case "low":
        return { bg: "#e2e3e5", color: "#383d41" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  }

  function getChannelIcon(channel: string) {
    const icons: Record<string, string> = {
      instagram: "",
      facebook: "",
      tiktok: "",
      youtube: "",
      linkedin: "",
      email: "",
      sms: "",
      web: "",
    };
    return icons[channel.toLowerCase()] || "";
  }

  function formatTime(timestamp: Timestamp) {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const filteredThreads = threads.filter((thread) => {
    if (filterChannel !== "all" && thread.channel !== filterChannel) return false;
    if (filterStatus !== "all" && thread.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        thread.displayName.toLowerCase().includes(query) ||
        thread.handle?.toLowerCase().includes(query) ||
        thread.lastMessagePreview.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (!isReady) {
    return <GuardLoadingScreen />;
  }

  if (!isAuthorized || !workspaceId) {
    return null;
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #ddd", backgroundColor: "#fff" }}>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => router.push("/app")} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>
             Dashboard
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Unified Inbox</h1>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => router.push("/app/inbox/new")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              + New Thread
            </button>
            <button
              onClick={() => router.push("/app")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Column - Thread List */}
        <div style={{ width: 380, borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", backgroundColor: "#f8f9fa" }}>
          {/* Filters */}
          <div style={{ padding: 16, borderBottom: "1px solid #ddd", backgroundColor: "#fff" }}>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 12,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ddd",
                  fontSize: 12,
                }}
              >
                <option value="all">All Channels</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="web">Web</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ddd",
                  fontSize: 12,
                }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Thread List */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", opacity: 0.6 }}>
                <p>No conversations yet</p>
                <button
                  onClick={() => router.push("/app/inbox/new")}
                  style={{
                    marginTop: 12,
                    padding: "8px 16px",
                    backgroundColor: "#0d6efd",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Create First Thread
                </button>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const statusColors = getStatusColor(thread.status);
                const isSelected = selectedThread?.id === thread.id;

                return (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread)}
                    style={{
                      padding: 16,
                      borderBottom: "1px solid #ddd",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#e7f3ff" : "#fff",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#fff";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                        <span style={{ fontSize: 20 }}>{getChannelIcon(thread.channel)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {thread.displayName}
                          </div>
                          {thread.handle && (
                            <div style={{ fontSize: 12, opacity: 0.6 }}>{thread.handle}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 11, opacity: 0.6 }}>
                          {formatTime(thread.lastMessageAt)}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "#0d6efd",
                              color: "#fff",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        opacity: 0.7,
                        margin: "8px 0 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {thread.lastMessagePreview}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 3,
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {thread.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Conversation View */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
          {selectedThread ? (
            <>
              {/* Conversation Header */}
              <div style={{ padding: 16, borderBottom: "1px solid #ddd", backgroundColor: "#f8f9fa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                      {selectedThread.displayName}
                    </h2>
                    <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                      {getChannelIcon(selectedThread.channel)} {selectedThread.channel}
                      {selectedThread.handle && `  ${selectedThread.handle}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={handleConvertToLead}
                      disabled={convertingToLead}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: convertingToLead ? "#6c757d" : "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: convertingToLead ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {convertingToLead ? "Converting..." : " Convert to Lead"}
                    </button>
                    <select
                      value={selectedThread.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as any)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={selectedThread.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value as any)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: "center", opacity: 0.6 }}>No messages yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {messages.map((message) => {
                      const isOutbound = message.direction === "outbound";
                      return (
                        <div
                          key={message.id}
                          style={{
                            display: "flex",
                            justifyContent: isOutbound ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "70%",
                              padding: 12,
                              borderRadius: 8,
                              backgroundColor: isOutbound ? "#0d6efd" : "#f8f9fa",
                              color: isOutbound ? "#fff" : "#000",
                            }}
                          >
                            {message.senderName && (
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  marginBottom: 4,
                                  opacity: isOutbound ? 0.9 : 0.6,
                                }}
                              >
                                {message.senderName}
                              </div>
                            )}
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                              {message.text}
                            </p>
                            <div
                              style={{
                                fontSize: 11,
                                marginTop: 4,
                                opacity: isOutbound ? 0.8 : 0.5,
                              }}
                            >
                              {formatTime(message.sentAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Composer */}
              <div style={{ padding: 16, borderTop: "1px solid #ddd", backgroundColor: "#f8f9fa" }}>
                <div style={{ marginBottom: 12 }}>
                  <button
                    onClick={handleDraftReply}
                    disabled={draftingReply}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: draftingReply ? "#6c757d" : "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: draftingReply ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {draftingReply ? " Drafting..." : " Draft Reply (AI)"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 4,
                      border: "1px solid #ddd",
                      fontSize: 14,
                      resize: "none",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: !newMessage.trim() || sending ? "#6c757d" : "#0d6efd",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: !newMessage.trim() || sending ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.6,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, marginBottom: 12 }}>Select a conversation to start messaging</p>
                <p style={{ fontSize: 14 }}>or create a new thread to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

