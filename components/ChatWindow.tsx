"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Send, LogOut, Brain } from "lucide-react";
import { signOut } from "next-auth/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  userId: string;
  onToggleSidebar?: () => void;
  sessionId?: string | null;
  onSessionCreated?: (sessionId: string) => void;
}

const SUGGESTIONS = [
  "What events are happening this week?",
  "Help me prepare for my exams",
  "What clubs should I join?",
];

export default function ChatWindow({
  userId,
  onToggleSidebar,
  sessionId: externalSessionId,
  onSessionCreated,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(externalSessionId ?? null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (!userId) return;

    const loadMessages = async () => {
      if (externalSessionId) {
        console.log("[chat-window] loading DB session", externalSessionId);
        setMessages([]);
        setCurrentSessionId(externalSessionId);

        try {
          const response = await fetch(`/api/sessions/messages?sessionId=${encodeURIComponent(externalSessionId)}`);
          const data = await response.json();
          if (data.messages?.length > 0) {
            setMessages(
              data.messages.map((message: Message) => ({
                role: message.role,
                content: message.content,
              }))
            );
          }
        } catch (error) {
          console.error("[chat-window] failed to load session messages", error);
        }

        return;
      }

      console.log("[chat-window] loading local draft chat");
      setCurrentSessionId(null);
      const saved = localStorage.getItem(`campusmind_chat_${userId}`);
      if (!saved) {
        setMessages([]);
        return;
      }

      try {
        setMessages(JSON.parse(saved));
      } catch (error) {
        console.error("[chat-window] failed to load chat history", error);
      }
    };

    void loadMessages();
  }, [userId, externalSessionId]);

  useEffect(() => {
    if (!isMounted || !userId || messages.length === 0 || externalSessionId) return;
    const savable = messages.filter((message) => !(message.role === "assistant" && message.content === ""));
    localStorage.setItem(`campusmind_chat_${userId}`, JSON.stringify(savable));
  }, [messages, userId, isMounted, externalSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  const handleSend = useCallback(
    async (overrideInput?: string) => {
      const text = (overrideInput ?? input).trim();
      if (!text || isLoading) return;

      const userMessage: Message = { role: "user", content: text };
      const assistantPlaceholder: Message = { role: "assistant", content: "" };
      const conversationHistory = messages.filter(
        (message) => !(message.role === "assistant" && message.content === "")
      );

      setMessages([...conversationHistory, userMessage, assistantPlaceholder]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            userId,
            history: conversationHistory,
            sessionId: currentSessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Stream failed: ${response.status}`);
        }
        if (!response.body) {
          throw new Error("Stream body is empty");
        }

        const newSessionId = response.headers.get("X-Session-Id");
        if (newSessionId && !currentSessionId) {
          console.log("[chat-window] created session", newSessionId);
          setCurrentSessionId(newSessionId);
          onSessionCreated?.(newSessionId);
          localStorage.removeItem(`campusmind_chat_${userId}`);
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
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        }
      } catch (error) {
        console.error("[chat-window] chat error:", error);
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
    [input, isLoading, messages, userId, currentSessionId, onSessionCreated]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

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
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

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
                <p className="text-white text-2xl text-center font-medium">Welcome to CampusMind</p>
                <p className="text-gray-400 text-sm text-center mt-2">Your AI campus assistant</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                {SUGGESTIONS.map((chip, index) => (
                  <button
                    key={chip}
                    onClick={() => void handleSend(chip)}
                    className="rounded-full px-5 py-2.5 text-sm text-gray-200 cursor-pointer transition-all border border-white/10 bg-gray-900/80 hover:-translate-y-0.5 hover:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => {
              if (
                message.role === "assistant" &&
                message.content === "" &&
                index === messages.length - 1 &&
                isLoading
              ) {
                return (
                  <motion.div
                    key={index}
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

              if (message.role === "user") {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-end"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl rounded-br-sm px-5 py-3.5 max-w-xs sm:max-w-sm ml-auto text-sm shadow-[0_16px_34px_rgba(37,99,235,0.18)]">
                      {message.content}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-medium">CampusMind</p>
                    <div className="bg-gray-900 border border-white/10 text-gray-100 rounded-2xl rounded-bl-sm px-5 py-3.5 max-w-sm text-sm leading-relaxed whitespace-pre-wrap shadow-[0_12px_24px_rgba(0,0,0,0.16)]">
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </section>

      <form
        className="glass border-t border-white/10 p-3 md:p-4 shrink-0 pb-safe"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
      >
        <div className="flex gap-2 md:gap-3 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Message CampusMind..."
            aria-label="Message CampusMind"
            className="bg-gray-900 border border-white/10 text-white rounded-2xl px-4 py-3 min-h-[44px] max-h-32 flex-1 resize-none outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-sm md:text-base disabled:opacity-40 transition-all placeholder-gray-500 hover:border-blue-500/20"
          />
          <button
            type="submit"
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
