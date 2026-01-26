"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

interface ScheduledPost {
  id: string;
  workspaceId: string;
  assetId: string;
  platform: string;
  scheduledFor: Timestamp;
  status: "queued" | "scheduled" | "published" | "failed";
  createdAt: any;
  updatedAt: any;
}

interface ContentAsset {
  id: string;
  type: string;
  platform: string;
  copy: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [assets, setAssets] = useState<Map<string, ContentAsset>>(new Map());
  const [view, setView] = useState<"calendar" | "agenda">("agenda");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    setLoading(true);
    (async () => {
      try {
        const assetsQ = query(
          collection(db, "content_assets"),
          where("workspaceId", "==", workspaceId)
        );
        const assetsSnap = await getDocs(assetsQ);
        const assetsMap = new Map<string, ContentAsset>();
        assetsSnap.docs.forEach((doc) => {
          assetsMap.set(doc.id, { id: doc.id, ...doc.data() } as ContentAsset);
        });
        setAssets(assetsMap);

        const postsQ = query(
          collection(db, "scheduled_posts"),
          where("workspaceId", "==", workspaceId),
          orderBy("scheduledFor", "asc")
        );
        const unsubscribe = onSnapshot(postsQ, (snapshot) => {
          const postsData = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ScheduledPost[];
          setScheduledPosts(postsData);
          setLoading(false);
        }, (error) => {
          console.error("Error in scheduled posts listener:", error);
          setScheduledPosts([]);
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading schedule:", error);
        alert("Error loading schedule: " + (error as any).message);
        setLoading(false);
      }
    })();
  }, [isReady, isAuthorized, workspaceId]);

  function getStatusColor(status: string) {
    switch (status) {
      case "published":
        return { bg: "#d4edda", color: "#155724" };
      case "scheduled":
        return { bg: "#cfe2ff", color: "#084298" };
      case "queued":
        return { bg: "#fff3cd", color: "#856404" };
      case "failed":
        return { bg: "#f8d7da", color: "#721c24" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  }

  function formatDate(timestamp: Timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timestamp: Timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDateTime(timestamp: Timestamp) {
    return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  }

  function getPostsForDate(date: Date) {
    return scheduledPosts.filter((post) => {
      const postDate = post.scheduledFor.toDate();
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  }

  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  // Group posts by date for agenda view
  const postsByDate = scheduledPosts.reduce((acc, post) => {
    const dateKey = formatDate(post.scheduledFor);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(post);
    return acc;
  }, {} as Record<string, ScheduledPost[]>);

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

  const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            border: "1px solid #d0d0d0",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
           Back
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
            Publishing Schedule
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            {scheduledPosts.length} posts scheduled
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#f8f9fa",
              borderRadius: 4,
              padding: 4,
              border: "1px solid #ddd",
            }}
          >
            <button
              onClick={() => setView("agenda")}
              style={{
                padding: "8px 16px",
                backgroundColor: view === "agenda" ? "#fff" : "transparent",
                color: view === "agenda" ? "#000" : "#6c757d",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: view === "agenda" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Agenda
            </button>
            <button
              onClick={() => setView("calendar")}
              style={{
                padding: "8px 16px",
                backgroundColor: view === "calendar" ? "#fff" : "transparent",
                color: view === "calendar" ? "#000" : "#6c757d",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: view === "calendar" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => router.push("/app/assets")}
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
            View Assets
          </button>
        </div>
      </div>

      {view === "agenda" ? (
        /* Agenda View */
        <div>
          {Object.keys(postsByDate).length === 0 ? (
            <div
              style={{
                padding: 64,
                textAlign: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
                border: "2px dashed #ddd",
              }}
            >
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                No Scheduled Posts
              </h2>
              <p style={{ opacity: 0.7, marginBottom: 24 }}>
                Schedule assets from the asset library to see them here
              </p>
              <button
                onClick={() => router.push("/app/assets")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#0d6efd",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Go to Assets
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {Object.entries(postsByDate).map(([date, posts]) => (
                <div key={date}>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 16,
                      paddingBottom: 8,
                      borderBottom: "2px solid #0d6efd",
                    }}
                  >
                    {date}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {posts.map((post) => {
                      const asset = assets.get(post.assetId);
                      const statusColors = getStatusColor(post.status);

                      return (
                        <div
                          key={post.id}
                          style={{
                            padding: 16,
                            backgroundColor: "#fff",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>
                                {formatTime(post.scheduledFor)}
                              </span>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  backgroundColor: statusColors.bg,
                                  color: statusColors.color,
                                }}
                              >
                                {post.status}
                              </span>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#0d6efd",
                                  color: "#fff",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {post.platform}
                              </span>
                            </div>
                            {asset && (
                              <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>
                                {asset.copy.substring(0, 100)}
                                {asset.copy.length > 100 && "..."}
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => router.push(`/app/schedule/${post.id}`)}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "#0d6efd",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => router.push(`/app/assets/${post.assetId}`)}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "#6c757d",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              View Asset
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div style={{ backgroundColor: "#fff", padding: 24, borderRadius: 8, border: "1px solid #ddd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <button
              onClick={goToPreviousMonth}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
               Previous
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={goToNextMonth}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Next 
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{
                  padding: 12,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  backgroundColor: "#f8f9fa",
                  textTransform: "uppercase",
                }}
              >
                {day}
              </div>
            ))}

            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} style={{ padding: 12, backgroundColor: "#f8f9fa" }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const posts = getPostsForDate(date);
              const isToday =
                date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 100,
                    padding: 8,
                    backgroundColor: isToday ? "#e7f3ff" : "#fff",
                    border: isToday ? "2px solid #0d6efd" : "1px solid #e9ecef",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    {day}
                  </div>
                  {posts.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {posts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          style={{
                            padding: "4px 6px",
                            backgroundColor: "#0d6efd",
                            color: "#fff",
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatTime(post.scheduledFor)}  {post.platform}
                        </div>
                      ))}
                      {posts.length > 3 && (
                        <div style={{ fontSize: 10, opacity: 0.6, textAlign: "center" }}>
                          +{posts.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

