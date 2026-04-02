"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Menu, LogOut } from "lucide-react";
import { useSupabaseAuth } from "@/components/SupabaseAuthProvider";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatWindowProps {
    userId: string;
    onToggleSidebar?: () => void;
}

const SUGGESTIONS = [
    "What events are happening this week?",
    "Remind me about my DSA assignment due Friday",
    "What clubs should I join?",
];

export default function ChatWindow({ userId, onToggleSidebar }: ChatWindowProps) {
    const router = useRouter();
    const { signOut } = useSupabaseAuth();
    const searchParams = useSearchParams();
    const urlSessionId = searchParams.get("session");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(urlSessionId);

    useEffect(() => {
        if (urlSessionId) setSessionId(urlSessionId);
    }, [urlSessionId]);

    // Hydrate chat history from local storage
    useEffect(() => {
        setIsMounted(true);
        if (!userId) return;
        setMessages([]);
        const savedSession = localStorage.getItem(`campusmind_session_${userId}`);
        if (!urlSessionId && savedSession) setSessionId(savedSession);
        const saved = localStorage.getItem(`campusmind_chat_${userId}_${urlSessionId ?? savedSession ?? "default"}`);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, [userId, urlSessionId]);

    // Persist chat history to local storage
    useEffect(() => {
        if (!isMounted || !userId || messages.length === 0) return;
        
        // Don't save empty placeholder assistant messages
        const savable = messages.filter(m => !(m.role === "assistant" && m.content === ""));
        const key = `campusmind_chat_${userId}_${sessionId ?? "default"}`;
        localStorage.setItem(key, JSON.stringify(savable));
        if (sessionId) localStorage.setItem(`campusmind_session_${userId}`, sessionId);
    }, [messages, userId, isMounted, sessionId]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll on every messages update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [input]);

    const handleSend = useCallback(
        async (overrideInput?: string) => {
            const text = (overrideInput ?? input).trim();
            if (!text || isLoading) return;

            const userMessage: Message = { role: "user", content: text };
            const assistantPlaceholder: Message = { role: "assistant", content: "" };

            const updatedHistory = [...messages, userMessage];

            setMessages([...updatedHistory, assistantPlaceholder]);
            setInput("");
            setIsLoading(true);

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: text,
                        userId,
                        history: [],
                        sessionId,
                    }),
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Stream failed: ${response.status} - ${error}`);
                }

                if (!response.body) {
                    throw new Error("Stream body is empty");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                const xSessionId = response.headers.get("X-Session-Id");
                if (xSessionId && !sessionId) {
                    setSessionId(xSessionId);
                    localStorage.setItem(`campusmind_session_${userId}`, xSessionId);
                }

                let metaHandled = false;
                let streamBuffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    let chunk = decoder.decode(value, { stream: true });
                    if (!metaHandled) {
                        streamBuffer += chunk;
                        const marker = streamBuffer.indexOf("\n__META_END__\n");
                        if (marker === -1) continue;
                        const metaRaw = streamBuffer.slice(0, marker);
                        chunk = streamBuffer.slice(marker + "\n__META_END__\n".length);
                        streamBuffer = "";
                        metaHandled = true;
                        try {
                            const meta = JSON.parse(metaRaw) as { sessionId?: string };
                            if (meta.sessionId && !sessionId) {
                                setSessionId(meta.sessionId);
                                localStorage.setItem(`campusmind_session_${userId}`, meta.sessionId);
                            }
                        } catch {
                            // ignore meta parsing failure, stream still works
                        }
                    }

                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        updated[updated.length - 1] = {
                            ...last,
                            content: last.content + chunk,
                        };
                        return updated;
                    });
                }
            } catch (error) {
                console.error("Chat error:", error);
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: "assistant",
                        content: "Sorry, something went wrong. Please try again.",
                    };
                    return updated;
                });
            } finally {
                setIsLoading(false);
            }
        },
        [input, isLoading, messages, userId]
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChipClick = (text: string) => {
        setInput(text);
        handleSend(text);
    };

    const handleLogout = async () => {
        await signOut();
        router.replace("/");
        router.refresh();
    };

    const showTypingIndicator =
        isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant" &&
        messages[messages.length - 1].content === "";

    return (
        <main className="h-screen flex flex-col bg-black">
            <header className="glass border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {onToggleSidebar && (
                        <button 
                            onClick={onToggleSidebar} 
                            className="md:hidden text-gray-300 hover:text-white p-2 rounded-xl bg-gray-900 hover:bg-gray-800 transition-all border border-white/10 hover:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            aria-label="Toggle Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}
                    <span className="text-white font-semibold text-lg md:text-xl flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-500" /> CampusMind
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline bg-gray-800 text-blue-300 text-xs rounded-full px-3 py-1 border border-blue-500/30">
                        AI-powered by Hindsight
                    </span>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        aria-label="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign out</span>
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-4 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_28%),#030303]">
                <AnimatePresence>
                {messages.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-full gap-8"
                    >
                        <div>
                            <p className="text-white text-2xl text-center font-medium">
                                Welcome to CampusMind
                            </p>
                            <p className="text-gray-400 text-sm text-center mt-2">
                                Your AI campus assistant
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                            {SUGGESTIONS.map((chip, idx) => (
                                <button
                                    key={chip}
                                    onClick={() => handleChipClick(chip)}
                                    className="rounded-full px-5 py-2.5 text-sm text-gray-200 cursor-pointer transition-all border border-white/10 bg-gray-900/80 hover:-translate-y-0.5 hover:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    style={{animationDelay: `${idx * 100}ms`}}
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    messages.map((msg, i) => {
                        if (
                            msg.role === "assistant" &&
                            msg.content === "" &&
                            i === messages.length - 1 &&
                            isLoading
                        ) {
                            return (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex justify-start"
                                >
                                    <div>
                                        <p className="text-gray-500 text-xs mb-2 font-medium">CampusMind</p>
                                        <div className="bg-gray-900 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
                                            <div className="flex items-center gap-2">
                                                <span className="typing-dot" />
                                                <span className="typing-dot" />
                                                <span className="typing-dot" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }

                        if (msg.role === "user") {
                            return (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex justify-end"
                                >
                                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl rounded-br-sm px-5 py-3.5 max-w-xs sm:max-w-sm ml-auto text-sm shadow-[0_16px_34px_rgba(37,99,235,0.18)]">
                                        {msg.content}
                                    </div>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex justify-start"
                            >
                                <div>
                                    <p className="text-gray-500 text-xs mb-2 font-medium">CampusMind</p>
                                    <div className="bg-gray-900 border border-white/10 text-gray-100 rounded-2xl rounded-bl-sm px-5 py-3.5 max-w-sm text-sm leading-relaxed whitespace-pre-wrap shadow-[0_12px_24px_rgba(0,0,0,0.16)]">
                                        {msg.content}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </section>

            {/* Input Bar */}
            <form
                className="glass border-t border-white/10 p-3 md:p-4 shrink-0 pb-safe"
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSend();
                }}
            >
                <div className="flex gap-2 md:gap-3 items-end">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder="Message CampusMind..."
                        aria-label="Message CampusMind"
                        className="bg-gray-900 border border-white/10 text-white rounded-2xl px-4 py-3 min-h-[44px] max-h-32 flex-1 resize-none outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-sm md:text-base disabled:opacity-40 transition-all placeholder-gray-500 hover:border-blue-500/20"
                    />
                    <button
                        type="submit"
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="h-[44px] flex items-center justify-center bg-gradient-blue disabled:opacity-40 text-white rounded-2xl px-4 md:px-6 py-2.5 font-medium text-sm md:text-base transition-all shadow-glow-blue hover:-translate-y-0.5 hover:shadow-glow-blue-lg disabled:shadow-none shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <span className="hidden md:inline">Send</span>
                        <Send className="md:hidden w-4 h-4" />
                    </button>
                </div>
            </form>
        </main>
    );
}
