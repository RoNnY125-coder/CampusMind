"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ComponentType } from "react";
import { Globe, MessageSquare, Eye, Clock } from "lucide-react";

interface Memory {
    id: string;
    content: string;
    type: "world" | "experience" | "observation";
    created_at: string;
}

interface MemorySidebarProps {
    userId: string;
    onSessionSelect?: (sessionId: string) => void;
}

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

const TYPE_ICONS: Record<Memory["type"], ComponentType<{ className?: string }>> = {
    world: Globe,
    experience: MessageSquare,
    observation: Eye,
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function MemorySidebar({ userId, onSessionSelect }: MemorySidebarProps) {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(true);
    const [newIds, setNewIds] = useState<Set<string>>(new Set());
    const [tab, setTab] = useState<"memory" | "chats">("memory");

    const prevIdsRef = useRef<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchMemories = useCallback(async () => {
        try {
            const res = await fetch(`/api/memory?userId=${encodeURIComponent(userId)}`);
            if (!res.ok) {
                throw new Error(`API returned ${res.status}`);
            }
            const data = await res.json();
            const fetched: Memory[] = data.memories ?? [];

            // Detect new IDs compared to previous poll
            const currentIds = new Set(fetched.map((m) => m.id));
            const incoming = new Set<string>();
            currentIds.forEach((id) => {
                if (!prevIdsRef.current.has(id)) {
                    incoming.add(id);
                }
            });

            prevIdsRef.current = currentIds;
            setMemories(fetched);

            if (incoming.size > 0) {
                console.log(`[memory] ${incoming.size} new memory(ies) detected`);
                setNewIds((prev) => new Set([...prev, ...incoming]));

                // Scroll to top on new memories
                containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

                // Remove green flash after 2.5s
                setTimeout(() => {
                    setNewIds((prev) => {
                        const next = new Set(prev);
                        incoming.forEach((id) => next.delete(id));
                        return next;
                    });
                }, 2500);
            }
        } catch (error) {
            console.error("Failed to fetch memories:", error);
            // Continue to try again on next poll
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`);
            if (!res.ok) return;
            const data = await res.json();
            setSessions(data.sessions ?? []);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setIsSessionsLoading(false);
        }
    }, [userId]);

    // Initial fetch on mount
    useEffect(() => {
        fetchMemories();
        fetchSessions();
    }, [fetchMemories, fetchSessions]);

    // Poll every 8 seconds
    useEffect(() => {
        const interval = setInterval(fetchMemories, 8000);
        return () => clearInterval(interval);
    }, [fetchMemories]);

    useEffect(() => {
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, [fetchSessions]);

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto p-4 flex flex-col gap-3 border-r border-white/10 bg-[linear-gradient(180deg,#070707,#0c111b)]"
        >
            <div className="flex items-center justify-between sticky top-0 bg-black/70 backdrop-blur-xl p-3 rounded-xl z-10 border border-white/10">
                <span className="text-white font-semibold text-sm">
                    {tab === "memory" ? "Memory" : "Chats"}
                </span>
                <span className="bg-blue-500/20 text-blue-300 text-xs rounded-full px-2.5 py-1 font-semibold border border-blue-500/30">
                    {tab === "memory" ? memories.length : sessions.length}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setTab("memory")}
                    className={`rounded-xl px-3 py-2 text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        tab === "memory"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : "bg-gray-900 text-gray-300 border-white/10 hover:border-blue-500/30"
                    }`}
                >
                    Memory
                </button>
                <button
                    onClick={() => setTab("chats")}
                    className={`rounded-xl px-3 py-2 text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        tab === "chats"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : "bg-gray-900 text-gray-300 border-white/10 hover:border-blue-500/30"
                    }`}
                >
                    Chats
                </button>
            </div>

            {tab === "memory" && (
                <>
            {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-gray-900 rounded-xl p-3 animate-pulse border border-white/10">
                        <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-gray-700 rounded w-1/2" />
                    </div>
                ))}

            {!isLoading && memories.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center">Start chatting to build your memory bank.</p>
                </div>
            )}

            {!isLoading &&
                memories.map((memory, idx) => {
                    const Icon = TYPE_ICONS[memory.type];
                    return (
                    <div
                        key={memory.id}
                        className={`rounded-lg p-3.5 text-sm transition-all duration-700 border ${
                            newIds.has(memory.id)
                                ? "bg-gray-800 border-blue-500/50 memory-new"
                                : "bg-gray-900 border-white/10 hover:border-blue-500/30"
                        }`}
                        style={{animationDelay: `${idx * 50}ms`}}
                    >
                        <p className="font-medium text-white flex items-start gap-2">
                            <Icon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-3">
                                {memory.content.length > 80 ? memory.content.slice(0, 80) + "..." : memory.content}
                            </span>
                        </p>
                        <p className="text-gray-400 text-xs mt-2 pl-6 font-mono">
                            {timeAgo(memory.created_at)}
                        </p>
                    </div>
                )})}
                </>
            )}

            {tab === "chats" && (
                <>
                {isSessionsLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3 animate-pulse border border-white/10">
                            <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-gray-700 rounded w-1/2" />
                        </div>
                    ))}

                {!isSessionsLoading && sessions.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400 text-sm text-center">No chats yet. Start your first conversation.</p>
                    </div>
                )}

                {!isSessionsLoading && sessions.map((session) => (
                    <button
                        key={session.id}
                        onClick={() => onSessionSelect?.(session.id)}
                        className="w-full text-left rounded-xl p-3 bg-gray-900 border border-white/10 hover:border-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <p className="text-white text-sm font-medium truncate">{(session.title || "New Chat").slice(0, 40)}</p>
                        <p className="text-gray-400 text-xs mt-1 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo(session.updated_at)}
                        </p>
                    </button>
                ))}
                </>
            )}
        </div>
    );
}
