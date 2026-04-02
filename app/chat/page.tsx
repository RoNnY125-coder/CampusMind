"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthProvider";
import MemorySidebar from "@/components/MemorySidebar";
import ChatWindow from "@/components/ChatWindow";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ChatPage() {
    const { user, session, loading, refreshSession } = useSupabaseAuth();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isBooting, setIsBooting] = useState(true);
    const [bootError, setBootError] = useState("");

    useEffect(() => {
        let mounted = true;

        const bootApp = async () => {
            if (loading) return;

            console.log("[chat] boot start");
            let activeSession = session;

            if (!activeSession?.access_token) {
                console.log("[chat] no session in context, refreshing");
                activeSession = await refreshSession();
            }

            if (!activeSession?.access_token || !user) {
                console.log("[chat] missing session after refresh, redirecting to login");
                router.replace("/login");
                return;
            }

            console.log("[chat] session found, booting app");
            setIsBooting(true);
            setBootError("");
            setUserId(user.id);

            const startupTasks = await Promise.allSettled([
                fetch("/api/seed", { method: "POST" }).then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`seed failed: ${response.status}`);
                    }
                    return response.json();
                }),
                fetch("/api/auth/ensure-profile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${activeSession.access_token}`,
                    },
                }).then(async (response) => {
                    if (!response.ok) {
                        const body = await response.text();
                        throw new Error(`ensure-profile failed: ${response.status} ${body}`);
                    }
                    return response.json();
                }),
            ]);

            if (!mounted) return;

            const [seedResult, profileResult] = startupTasks;

            if (seedResult.status === "rejected" || profileResult.status === "rejected") {
                console.error("[chat] startup fetch warning", {
                    seed: seedResult.status === "rejected" ? seedResult.reason : "ok",
                    profile: profileResult.status === "rejected" ? profileResult.reason : "ok",
                });
                setBootError("Some app data could not be loaded. You can still continue.");
            } else {
                console.log("[chat] startup fetch complete", {
                    seed: seedResult.value,
                    profile: profileResult.value,
                });
            }

            setIsBooting(false);
        };

        bootApp().catch((error) => {
            console.error("[chat] app boot failed", error);
            if (!mounted) return;
            setBootError("We could not finish loading the app. Please refresh.");
            setIsBooting(false);
        });

        return () => {
            mounted = false;
        };
    }, [loading, refreshSession, router, session, user]);

    if (loading || isBooting || !userId) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-400">Loading CampusMind...</p>
                </div>
            </div>
        );
    }

    if (!session || !user) {
        return null;
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
                {bootError && (
                    <div className="px-4 pt-4 md:px-6">
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                            {bootError}
                        </div>
                    </div>
                )}
                <ChatWindow userId={userId} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            </main>
        </div>
        </ErrorBoundary>
    );
}
