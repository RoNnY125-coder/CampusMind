"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatWindowProps {
    userId: string;
}

const SUGGESTIONS = [
    "What events are happening this week?",
    "Remind me about my DSA assignment due Friday",
    "What clubs should I join?",
];

export default function ChatWindow({ userId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

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

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

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

    const showTypingIndicator =
        isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant" &&
        messages[messages.length - 1].content === "";

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
            `}</style>

            {/* Header */}
            <header className="bg-gradient-to-r from-slate-900/80 to-purple-900/80 backdrop-blur-md border-b border-purple-500/20 px-6 py-4 flex items-center justify-between">
                <span className="text-white font-bold text-xl bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    🎓 CampusMind
                </span>
                <span className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur-md text-purple-100 text-xs rounded-full px-3 py-1 border border-purple-400/30">
                    AI-powered by Hindsight
                </span>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {messages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in">
                        <span className="text-7xl animate-bounce" style={{animationDuration: '3s'}}>🎓</span>
                        <div>
                            <p className="text-gray-300 text-2xl text-center font-light">
                                Welcome to CampusMind
                            </p>
                            <p className="text-gray-500 text-sm text-center mt-2">
                                Your AI campus assistant
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                            {SUGGESTIONS.map((chip, idx) => (
                                <button
                                    key={chip}
                                    onClick={() => handleChipClick(chip)}
                                    className="bg-gradient-to-r from-purple-600/40 to-indigo-600/40 backdrop-blur-md rounded-full px-5 py-2.5 text-sm text-gray-200 cursor-pointer hover:from-purple-600/60 hover:to-indigo-600/60 transition-all border border-purple-500/30 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 animate-slide-up"
                                    style={{animationDelay: `${idx * 100}ms`}}
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Message bubbles */
                    messages.map((msg, i) => {
                        // Skip rendering the empty assistant placeholder (typing indicator shown separately)
                        if (
                            msg.role === "assistant" &&
                            msg.content === "" &&
                            i === messages.length - 1 &&
                            isLoading
                        ) {
                            return (
                                <div key={i} className="flex justify-start animate-slide-up">
                                    <div>
                                        <p className="text-gray-500 text-xs mb-2 font-medium">CampusMind</p>
                                        <div className="bg-gradient-to-r from-slate-800/60 to-purple-900/40 backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 border border-purple-500/20 shadow-lg">
                                            {/* Typing dots */}
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: "0ms" }}
                                                />
                                                <span
                                                    className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: "150ms" }}
                                                />
                                                <span
                                                    className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: "300ms" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (msg.role === "user") {
                            return (
                                <div key={i} className="flex justify-end animate-slide-up">
                                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-xs ml-auto text-sm shadow-lg shadow-purple-500/30">
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={i} className="flex justify-start animate-slide-up">
                                <div>
                                    <p className="text-gray-500 text-xs mb-2 font-medium">CampusMind</p>
                                    <div className="bg-gradient-to-r from-slate-800/60 to-purple-900/40 backdrop-blur-md text-gray-100 rounded-2xl rounded-tl-sm px-5 py-3.5 max-w-sm text-sm leading-relaxed whitespace-pre-wrap border border-purple-500/20 shadow-lg">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-gradient-to-r from-slate-900/80 to-purple-900/80 backdrop-blur-md border-t border-purple-500/20 p-4">
                <div className="flex gap-3">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder="Message CampusMind..."
                        className="bg-purple-900/30 border border-purple-500/30 text-white rounded-2xl px-4 py-3 flex-1 resize-none outline-none focus:border-purple-500/60 focus:shadow-lg focus:shadow-purple-500/20 text-sm disabled:opacity-40 transition-all placeholder-gray-500"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-2xl px-6 py-3 font-medium text-sm transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:shadow-none"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
