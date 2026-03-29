"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MemorySidebar from "@/components/MemorySidebar";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
            return;
        }

        if (status === "authenticated" && session?.user) {
            setUserId((session.user as any).id);

            // Seed campus knowledge (idempotent — skips if already seeded)
            fetch("/api/seed", { method: "POST" }).catch((err) =>
                console.error("Failed to seed campus data:", err)
            );
        }
    }, [status, session, router]);

    if (status === "loading" || !userId) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <p>Loading CampusMind...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
            {/* Left sidebar */}
            <aside 
                className={`absolute md:relative z-20 w-80 h-full bg-slate-950/95 md:bg-transparent backdrop-blur-md transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0 border-r border-purple-500/20 shadow-xl md:shadow-none`}
            >
                <MemorySidebar userId={userId} />
            </aside>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-10 md:hidden backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsSidebarOpen(false)} 
                />
            )}

            {/* Main chat area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <ChatWindow userId={userId} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            </main>
        </div>
    );
}
