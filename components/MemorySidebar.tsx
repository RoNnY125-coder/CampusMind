"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, Clock3, MessageCircle, Moon, Sparkles } from "lucide-react";

interface Memory {
  id: string;
  content: string;
  type: "world" | "experience" | "observation";
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MemorySidebarProps {
  userId: string;
  refreshKey?: number;
  onSessionSelect?: (sessionId: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MemorySidebar({ userId, refreshKey, onSessionSelect }: MemorySidebarProps) {
  const [tab, setTab] = useState<"memory" | "chats">("memory");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [memLoading, setMemLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await fetch(`/api/memory?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      const fetched: Memory[] = data.memories ?? [];
      const currentIds = new Set(fetched.map((memory) => memory.id));
      const incoming = new Set<string>();

      currentIds.forEach((id) => {
        if (!prevIdsRef.current.has(id)) incoming.add(id);
      });

      prevIdsRef.current = currentIds;
      setMemories(fetched);

      if (incoming.size > 0) {
        setNewIds((prev) => new Set([...prev, ...incoming]));
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev);
            incoming.forEach((id) => next.delete(id));
            return next;
          });
        }, 2500);
      }
    } catch {
    } finally {
      setMemLoading(false);
    }
  }, [userId]);

  const fetchSessions = useCallback(async () => {
    setChatLoading(true);
    try {
      const response = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      setSessions(data.sessions ?? []);
    } catch {
    } finally {
      setChatLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchMemories();
  }, [fetchMemories]);

  useEffect(() => {
    const interval = setInterval(() => void fetchMemories(), 8000);
    return () => clearInterval(interval);
  }, [fetchMemories]);

  useEffect(() => {
    if (refreshKey === undefined) return;
    setMemories([]);
    setSessions([]);
    prevIdsRef.current = new Set();
    void fetchMemories();
    if (tab === "chats") void fetchSessions();
  }, [fetchMemories, fetchSessions, refreshKey, tab]);

  useEffect(() => {
    if (tab === "chats") void fetchSessions();
  }, [fetchSessions, tab]);

  return (
    <div ref={containerRef} className="memory-sidebar">
      <div className="memory-sidebar-brand">
        <span className="memory-brand-mark">
          <Moon size={16} />
        </span>
        <div>
          <span className="memory-brand-title">CampusMind</span>
          <span className="memory-brand-sub">Memory workspace</span>
        </div>
      </div>

      <div className="memory-tabs">
        {(["memory", "chats"] as const).map((name) => (
          <button key={name} type="button" onClick={() => setTab(name)} className={`memory-tab ${tab === name ? "active" : ""}`}>
            {name === "memory" ? <BrainCircuit size={15} /> : <MessageCircle size={15} />}
            <span>{name === "memory" ? "Memory" : "Chats"}</span>
          </button>
        ))}
      </div>

      {tab === "memory" && (
        <>
          {memLoading && Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="memory-card shimmer">
              <div className="memory-skeleton-line wide" />
              <div className="memory-skeleton-line short" />
            </div>
          ))}

          {!memLoading && memories.length === 0 && (
            <div className="memory-empty">
              <Sparkles size={22} />
              <p>Start chatting to build your memory bank.</p>
            </div>
          )}

          {!memLoading && memories.map((memory, index) => (
            <div
              key={memory.id}
              className={`memory-card ${newIds.has(memory.id) ? "is-new" : ""}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <p className="memory-card-copy">
                <BrainCircuit size={16} />
                <span>{memory.content.length > 100 ? `${memory.content.slice(0, 100)}...` : memory.content}</span>
              </p>
              <p className="memory-card-time">
                <Clock3 size={12} />
                {timeAgo(memory.created_at)}
              </p>
            </div>
          ))}
        </>
      )}

      {tab === "chats" && (
        <>
          {chatLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="memory-card shimmer">
              <div className="memory-skeleton-line wide" />
              <div className="memory-skeleton-line short" />
            </div>
          ))}

          {!chatLoading && sessions.length === 0 && (
            <div className="memory-empty">
              <MessageCircle size={22} />
              <p>No saved chats yet. Start a conversation.</p>
            </div>
          )}

          {!chatLoading && sessions.map((session) => (
            <button key={session.id} type="button" onClick={() => onSessionSelect?.(session.id)} className="memory-session-card">
              <span className="memory-session-icon">
                <MessageCircle size={15} />
              </span>
              <span className="memory-session-main">
                <span className="memory-session-title">{session.title || "New Chat"}</span>
                <span className="memory-card-time">
                  <Clock3 size={12} />
                  {timeAgo(session.updated_at)}
                </span>
              </span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
