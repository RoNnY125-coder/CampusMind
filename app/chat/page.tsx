"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@supabase/supabase-js';
import MemorySidebar from "@/components/MemorySidebar";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Check has_onboarded
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('has_onboarded')
                .eq('id', user.id)
                .single();

            // If no row found OR has_onboarded is false → go to onboard
            // But if DB query itself errored (not just missing row) → still let them in
            if (!studentError && student && !student.has_onboarded) {
                router.push('/onboard');
                return;
            }

            // If student row doesn't exist at all, create it and send to onboard
            if (studentError?.code === 'PGRST116') {
                // Row not found — create basic row and send to onboard
                const { createClient: createAdmin } = await import('@supabase/supabase-js');
                // Can't use service role on client — just redirect to onboard
                router.push('/onboard');
                return;
            }

            setUserId(user.id);

            // Seed campus knowledge (idempotent)
            fetch("/api/seed", { method: "POST" }).catch(console.error);
        };

        checkAuth();
    }, [router]);

    if (!userId) {
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
            <aside
                className={`absolute md:relative z-20 w-80 h-full bg-slate-950/95 md:bg-transparent backdrop-blur-md transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0 border-r border-purple-500/20 shadow-xl md:shadow-none`}
            >
                <MemorySidebar
                    userId={userId}
                    onSessionSelect={(sessionId) => {
                        setActiveSessionId(sessionId);
                        setIsSidebarOpen(false);
                    }}
                />
            </aside>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-10 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <ChatWindow
                    userId={userId}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    sessionId={activeSessionId}
                    onSessionCreated={(id) => setActiveSessionId(id)}
                />
            </main>
        </div>
    );
}
