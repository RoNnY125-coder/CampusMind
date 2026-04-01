"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isCheckingUser, setIsCheckingUser] = useState(false);

    const handleGetStarted = async () => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated" && session?.user) {
            setIsCheckingUser(true);
            try {
                const { data } = await supabase
                    .from('students')
                    .select('has_onboarded')
                    .eq('id', (session.user as any).id)
                    .single();
                router.push(data?.has_onboarded ? "/chat" : "/onboard");
            } catch {
                router.push("/onboard");
            } finally {
                setIsCheckingUser(false);
            }
        }
    };

    const features = [
        { icon: Brain, label: "Memory-First", desc: "Remembers everything about your campus journey" },
        { icon: Zap, label: "Instant", desc: "Powered by LLaMA 3.3 70B via Groq" },
        { icon: Lock, label: "Private", desc: "Your data, your memory bank, always" },
    ];

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
            <div
                className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
                    animation: "drift 20s ease-in-out infinite",
                }}
            />
            <div
                className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
                    animation: "drift 20s ease-in-out infinite -10s",
                }}
            />

            <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Brain className="text-blue-500 w-5 h-5" />
                    <span className="text-white font-semibold tracking-tight">CampusMind</span>
                </div>
                <button onClick={handleGetStarted} className="text-sm text-gray-300 hover:text-white transition-colors">
                    Sign In
                </button>
            </nav>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-medium tracking-wide"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    AI-Powered · Memory-First · Campus-Native
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none mb-6"
                >
                    Your campus, <span className="gradient-text">remembered.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-gray-400 text-lg max-w-xl leading-relaxed mb-10"
                >
                    CampusMind is an AI assistant that learns your journey - your courses, interests, events, and goals - and gets smarter every conversation.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    onClick={handleGetStarted}
                    disabled={status === "loading" || isCheckingUser}
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-50 shadow-glow-blue hover:shadow-glow-blue-lg"
                    style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}
                >
                    {status === "loading" || isCheckingUser ? "Loading..." : "Get Started"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-20 grid grid-cols-3 gap-4 max-w-md w-full"
                >
                    {[
                        { val: "24/7", label: "Available" },
                        { val: "∞", label: "Memory" },
                        { val: "100%", label: "Private" },
                    ].map((stat) => (
                        <div key={stat.label} className="border border-white/10 rounded-xl p-4 bg-gray-800/40 hover:border-blue-500/30 transition-colors">
                            <div className="text-2xl font-bold text-white">{stat.val}</div>
                            <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-12 flex flex-wrap justify-center gap-3"
                >
                    {features.map(({ icon: Icon, label, desc }) => (
                        <div
                            key={label}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-gray-800/40 text-sm text-gray-300 hover:border-blue-500/30 hover:text-white transition-all"
                        >
                            <Icon className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-white">{label}</span>
                            <span className="text-gray-500 hidden sm:inline">- {desc}</span>
                        </div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
}
