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
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            {/* Left sidebar */}
            <aside className="w-80 shrink-0 border-r border-gray-800">
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
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-gray-950 text-white">Loading...</div>}>
            <ChatPageContent />
        </Suspense>
    );
}
