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
            className="bg-gray-900 h-full overflow-y-auto p-4 flex flex-col gap-3"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-white font-semibold">🧠 Memory Bank</span>
                {!isLoading && memories.length > 0 && (
                    <span className="bg-indigo-600 text-white text-xs rounded-full px-2">
                        {memories.length}
                    </span>
                )}
            </div>

            {/* Loading skeletons */}
            {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3 animate-pulse">
                        <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-gray-700 rounded w-1/2" />
                    </div>
                ))}

            {/* Empty state */}
            {!isLoading && memories.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">
                        Start chatting to build your memory...
                    </p>
                </div>
            )}

            {/* Memory cards */}
            {!isLoading &&
                memories.map((memory) => (
                    <div
                        key={memory.id}
                        className={`bg-gray-800 rounded-lg p-3 text-sm ${newIds.has(memory.id)
                                ? "ring-2 ring-green-400 transition-all duration-700"
                                : "transition-all duration-700"
                            }`}
                    >
                        <p className="font-medium text-white">
                            {TYPE_ICONS[memory.type]}{" "}
                            {memory.content.length > 80
                                ? memory.content.slice(0, 80) + "..."
                                : memory.content}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            {timeAgo(memory.created_at)}
                        </p>
                    </div>
                ))}
        </div>
    );
}
