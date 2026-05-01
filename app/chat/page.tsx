"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MemorySidebar from "@/components/MemorySidebar";
import ChatWindow from "@/components/ChatWindow";
import ErrorBoundary from "@/components/ErrorBoundary";
import ParticleField from "@/components/ParticleField";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && session?.user) setUserId((session.user as any).id);
  }, [status, session, router]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/student-profile?userId=${userId}`)
      .then(res => res.json())
      .then(data => { if (data?.name) setStudentName(data.name); })
      .catch(() => {});
  }, [userId]);

  const handleChatCleared = () => {
    setActiveSessionId(null);
    setSidebarRefreshKey(prev => prev + 1);
  };

  if (status === "loading" || !userId) {
    return (
      <div className="screen-shell" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
        <ParticleField />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: 48, height: 48, border: "4px solid rgba(212,212,212,0.25)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text2)" }}>Loading CampusMind...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="screen-shell" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <ParticleField />
        {/* Sidebar */}
        <aside style={{
          position: isSidebarOpen ? "absolute" : undefined,
          zIndex: 20,
          width: "320px",
          height: "100%",
          flexShrink: 0,
          transform: isSidebarOpen ? "translateX(0)" : undefined,
          transition: "transform 0.3s ease",
          boxShadow: isSidebarOpen ? "8px 0 40px rgba(0,0,0,0.5)" : "none",
        }}
        className={`${isSidebarOpen ? "" : "hidden md:block"}`}
        >
          <MemorySidebar
            userId={userId}
            refreshKey={sidebarRefreshKey}
            onSessionSelect={(sessionId) => { setActiveSessionId(sessionId); setIsSidebarOpen(false); }}
          />
        </aside>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10, backdropFilter: "blur(4px)",
          }} className="md:hidden" />
        )}

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%", overflow: "hidden" }}>
          <ChatWindow
            userId={userId}
            studentName={studentName}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            sessionId={activeSessionId}
            onSessionCreated={sessionId => setActiveSessionId(sessionId)}
            onChatCleared={handleChatCleared}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}
