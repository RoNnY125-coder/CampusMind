"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

export default function MemorySidebar({ userId, onSessionSelect }: MemorySidebarProps) {
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
    } catch (error) {
      console.error("[memory-sidebar] failed to fetch memories:", error);
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
    } catch (error) {
      console.error("[memory-sidebar] failed to fetch sessions:", error);
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
    if (tab === "chats") {
      void fetchSessions();
    }
  }, [tab, fetchSessions]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-4 flex flex-col gap-3 border-r border-white/10 bg-[linear-gradient(180deg,#070707,#0c111b)]"
    >
      <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-xl p-3 rounded-xl border border-white/10">
        <div className="grid grid-cols-2 gap-2">
          {(["memory", "chats"] as const).map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`rounded-xl px-3 py-2 text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                tab === name
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  : "bg-gray-900 text-gray-300 border-white/10 hover:border-blue-500/30"
              }`}
            >
              {name === "memory" ? "Memory" : "Chats"}
            </button>
          ))}
        </div>
      </div>

      {tab === "memory" && (
        <>
          {memLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-3 animate-pulse border border-white/10">
                <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-700 rounded w-1/2" />
              </div>
            ))}

          {!memLoading && memories.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="text-gray-400 text-sm text-center px-4">Start chatting to build your memory bank.</p>
            </div>
          )}

          {!memLoading &&
            memories.map((memory, index) => (
              <div
                key={memory.id}
                className={`rounded-xl p-3.5 text-sm transition-all duration-700 border ${
                  newIds.has(memory.id)
                    ? "bg-gray-800 border-blue-500/50 memory-new"
                    : "bg-gray-900 border-white/10 hover:border-blue-500/30"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="font-medium text-white flex items-start gap-2">
                  <span className="text-blue-400">🧠</span>
                  <span className="line-clamp-3">
                    {memory.content.length > 100 ? `${memory.content.slice(0, 100)}...` : memory.content}
                  </span>
                </p>
                <p className="text-gray-400 text-xs mt-2 pl-6">{timeAgo(memory.created_at)}</p>
              </div>
            ))}
        </>
      )}

      {tab === "chats" && (
        <>
          {chatLoading &&
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-3 animate-pulse border border-white/10">
                <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-700 rounded w-1/3" />
              </div>
            ))}

          {!chatLoading && sessions.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="text-gray-400 text-sm text-center px-4">No saved chats yet. Start a conversation.</p>
            </div>
          )}

          {!chatLoading &&
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect?.(session.id)}
                className="w-full text-left rounded-xl p-3 bg-gray-900 border border-white/10 hover:border-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <p className="text-white text-sm font-medium truncate">{session.title || "New Chat"}</p>
                <p className="text-gray-400 text-xs mt-1">{timeAgo(session.updated_at)}</p>
              </button>
            ))}
        </>
      )}
    </div>
  );
}
