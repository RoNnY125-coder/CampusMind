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
                        history: updatedHistory.slice(0, -1),
                    }),
                });

                if (!response.ok || !response.body) {
                    throw new Error("Stream failed");
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
        <div className="h-screen flex flex-col bg-gray-950">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <span className="text-white font-bold text-xl">🎓 CampusMind</span>
                <span className="bg-indigo-900 text-indigo-300 text-xs rounded-full px-3 py-1">
                    AI-powered by Hindsight
                </span>
            </header>

            {/* ── Messages Area ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {messages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        <span className="text-6xl">🎓</span>
                        <p className="text-gray-400 text-xl">
                            What can I help you with?
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {SUGGESTIONS.map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => handleChipClick(chip)}
                                    className="bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
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
                                <div key={i} className="flex justify-start">
                                    <div>
                                        <p className="text-gray-500 text-xs mb-1">CampusMind</p>
                                        <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                                            {/* Typing dots */}
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: "0ms" }}
                                                />
                                                <span
                                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: "150ms" }}
                                                />
                                                <span
                                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
                                <div key={i} className="flex justify-end">
                                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs ml-auto text-sm">
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={i} className="flex justify-start">
                                <div>
                                    <p className="text-gray-500 text-xs mb-1">CampusMind</p>
                                    <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input Bar ──────────────────────────────────────────────── */}
            <div className="bg-gray-900 border-t border-gray-800 p-4">
                <div className="flex gap-3">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder="Message CampusMind..."
                        className="bg-gray-800 text-white rounded-2xl px-4 py-3 flex-1 resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-40"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl px-5 py-3 font-medium text-sm transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
