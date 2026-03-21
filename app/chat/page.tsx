"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MemorySidebar from "@/components/MemorySidebar";
import ChatWindow from "@/components/ChatWindow";

function ChatPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const id = searchParams.get("userId");
        if (!id) {
            router.push("/onboard");
            return;
        }
        setUserId(id);

        // Seed campus knowledge (idempotent — skips if already seeded)
        fetch("/api/seed", { method: "POST" }).catch((err) =>
            console.error("Failed to seed campus data:", err)
        );
    }, [searchParams, router]);

    if (!userId) return null;

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden">
            {/* Left sidebar */}
            <aside className="w-80 shrink-0 border-r border-purple-500/20">
                <MemorySidebar userId={userId} />
            </aside>

            {/* Main chat area */}
            <main className="flex-1">
                <ChatWindow userId={userId} />
            </main>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p>Loading CampusMind...</p>
            </div>
        </div>}>
            <ChatPageContent />
        </Suspense>
    );
}
