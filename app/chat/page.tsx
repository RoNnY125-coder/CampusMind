"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthProvider";
import MemorySidebar from "@/components/MemorySidebar";
import ChatWindow from "@/components/ChatWindow";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ChatPage() {
    const { user, loading } = useSupabaseAuth();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        setUserId(user.id);

        fetch("/api/seed", { method: "POST" }).catch((err) =>
            console.error("Failed to seed campus data:", err)
        );
    }, [loading, user, router]);

    if (loading || !userId) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p>Loading CampusMind...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
        <div className="flex h-screen bg-black overflow-hidden relative">
            <aside
                aria-label="Campus navigation and memory sidebar"
                className={`absolute md:relative z-20 w-80 h-full bg-gray-900/95 md:bg-transparent backdrop-blur-md transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0 border-r border-white/10 shadow-xl md:shadow-none`}
            >
                <MemorySidebar
                    userId={userId}
                    onSessionSelect={(session) => {
                        router.push(`/chat?session=${session}`);
                        setIsSidebarOpen(false);
                    }}
                />
            </aside>

            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-10 md:hidden backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsSidebarOpen(false)} 
                />
            )}

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <ChatWindow userId={userId} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            </main>
        </div>
        </ErrorBoundary>
    );
}
