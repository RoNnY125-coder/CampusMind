"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Memory {
    id: string;
    content: string;
    type: "world" | "experience" | "observation";
    created_at: string;
}

interface MemorySidebarProps {
    userId: string;
}

const TYPE_ICONS: Record<Memory["type"], string> = {
    world: "🌍",
    experience: "💬",
    observation: "🧠",
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

export default function MemorySidebar({ userId }: MemorySidebarProps) {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [newIds, setNewIds] = useState<Set<string>>(new Set());

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
                console.log(`📝 ${incoming.size} new memory(ies) detected`);
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

    // Initial fetch on mount
    useEffect(() => {
        fetchMemories();
    }, [fetchMemories]);

    // Poll every 8 seconds
    useEffect(() => {
        const interval = setInterval(fetchMemories, 8000);
        return () => clearInterval(interval);
    }, [fetchMemories]);

    return (
        <div
            ref={containerRef}
            className="bg-gradient-to-b from-slate-900/80 to-purple-900/80 backdrop-blur-md h-full overflow-y-auto p-4 flex flex-col gap-3"
        >
            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 10px rgba(34, 197, 94, 0.5); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
                .animate-glow-pulse {
                    animation: glow-pulse 0.6s ease-in-out;
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gradient-to-r from-slate-900/90 to-purple-900/90 backdrop-blur-md p-3 rounded-xl z-10">
                <span className="text-white font-bold text-sm bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    🧠 Memory Bank
                </span>
                {!isLoading && memories.length > 0 && (
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs rounded-full px-2.5 py-1 font-semibold shadow-lg shadow-purple-500/30">
                        {memories.length}
                    </span>
                )}
            </div>

            {/* Loading skeletons */}
            {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-3 animate-pulse border border-purple-500/20"
                        style={{animationDelay: `${i * 100}ms`}}
                    >
                        <div className="h-3 bg-gradient-to-r from-purple-500/50 to-indigo-500/50 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-purple-500/30 rounded w-1/2" />
                    </div>
                ))}

            {/* Empty state */}
            {!isLoading && memories.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center">
                        💭 Start chatting to build your memory bank...
                    </p>
                </div>
            )}

            {/* Memory cards */}
            {!isLoading &&
                memories.map((memory, idx) => (
                    <div
                        key={memory.id}
                        className={`rounded-lg p-3.5 text-sm transition-all duration-700 animate-slide-in border ${newIds.has(memory.id)
                                ? "bg-gradient-to-r from-green-900/50 to-emerald-900/30 border-green-400/60 animate-glow-pulse shadow-lg shadow-green-500/30"
                                : "bg-gradient-to-r from-purple-900/30 to-indigo-900/20 border-purple-500/30 hover:border-purple-500/60 hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-indigo-900/30"
                            }`}
                        style={{animationDelay: `${idx * 50}ms`}}
                    >
                        <p className="font-medium text-white flex items-start gap-2">
                            <span className="text-base">{TYPE_ICONS[memory.type]}</span>
                            <span className="line-clamp-3">
                                {memory.content.length > 80
                                    ? memory.content.slice(0, 80) + "..."
                                    : memory.content}
                            </span>
                        </p>
                        <p className="text-gray-400 text-xs mt-2 pl-6">
                            {timeAgo(memory.created_at)}
                        </p>
                    </div>
                ))}
        </div>
    );
}
