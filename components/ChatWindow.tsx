"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { CLUBS, CAT_COLOR_CLASS } from "@/lib/clubs";

interface Message {
  role: "user" | "assistant";
  content: string; // the raw JSON or text
}

interface ChatWindowProps {
  userId: string;
  studentName?: string | null;
  onToggleSidebar?: () => void;
  sessionId?: string | null;
  onSessionCreated?: (sessionId: string) => void;
}

export default function ChatWindow({
  userId,
  studentName,
  onToggleSidebar,
  sessionId: externalSessionId,
  onSessionCreated,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(externalSessionId ?? null);
  const createdSessionIdRef = useRef<string | null>(null);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load User Profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("campusmind_user");
      if (stored) setUserProfile(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse campusmind_user", e);
    }
  }, []);

  const getGreeting = () => {
    if (!userProfile) return "Welcome to CampusMind! How can I help you today?";
    const name = userProfile.name.split(" ")[0];
    const branch = userProfile.branch;
    const year = userProfile.year;
    const clubs = userProfile.clubs;

    if (clubs && clubs.length > 0) {
      return `Hey ${name}! Based on your ${branch} background and interest in ${clubs}, I've got some great recommendations for you. What would you like to explore today?`;
    } else {
      return `Hey ${name}! As a ${year} ${branch} student, there's a lot you can explore. Tell me what you're interested in!`;
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (!userId) return;

    const loadMessages = async () => {
      if (externalSessionId) {
        if (externalSessionId === createdSessionIdRef.current) return;
        createdSessionIdRef.current = null;
        setMessages([]);
        setCurrentSessionId(externalSessionId);
        try {
          const response = await fetch(`/api/sessions/messages?sessionId=${encodeURIComponent(externalSessionId)}`);
          const data = await response.json();
          if (data.messages?.length > 0) {
            setMessages(
              data.messages.map((m: any) => ({
                role: m.role,
                content: m.content,
              }))
            );
          }
        } catch (error) {
          console.error("[chat-window] failed to load session", error);
        }
        return;
      } else {
        setCurrentSessionId(null);
        createdSessionIdRef.current = null;
        const saved = localStorage.getItem(`campusmind_chat_${userId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.length > 0) {
              setMessages(parsed);
              return;
            }
          } catch (e) {}
        }
        // No saved messages, show greeting if profile loaded
        if (userProfile) {
          setMessages([{ role: "assistant", content: JSON.stringify({ text: getGreeting(), recommendations: [] }) }]);
        }
      }
    };
    loadMessages();
  }, [userId, externalSessionId, userProfile]);

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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
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
            history: conversationHistory.map(m => {
               // extract plain text if it's JSON for history
               try {
                 const parsed = JSON.parse(m.content);
                 return { role: m.role, content: parsed.text };
               } catch {
                 return m;
               }
            }),
            sessionId: currentSessionId,
          }),
        });

        if (!response.ok) throw new Error("Stream failed");

        const newSessionId = response.headers.get("X-Session-Id");
        if (newSessionId && !currentSessionId) {
          createdSessionIdRef.current = newSessionId;
          setCurrentSessionId(newSessionId);
          onSessionCreated?.(newSessionId);
          localStorage.removeItem(`campusmind_chat_${userId}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");
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
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: JSON.stringify({ text: "Sorry, something went wrong.", recommendations: [] })
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

  const handleClearChat = () => {
    localStorage.removeItem(`campusmind_chat_${userId}`);
    setCurrentSessionId(null);
    createdSessionIdRef.current = null;
    if (userProfile) {
      setMessages([{ role: "assistant", content: JSON.stringify({ text: getGreeting(), recommendations: [] }) }]);
    } else {
      setMessages([]);
    }
  };

  const confirmSignOut = async () => {
    localStorage.removeItem(`campusmind_chat_${userId}`);
    localStorage.removeItem("campusmind_user");
    await signOut({ callbackUrl: "/login" });
  };

  const parseMessage = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return { text: parsed.text || "", recommendations: parsed.recommendations || [] };
    } catch {
      return { text: content, recommendations: [] };
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-logo">CM</div>
        <div>
          <h1 className="chat-header-title">CampusMind</h1>
          <p className="chat-header-sub">
            {userProfile ? `${userProfile.branch} • ${userProfile.year}` : "VIT Bhopal"}
          </p>
        </div>
        <div className="chat-header-spacer" />
        <div className="chat-header-actions">
          <button onClick={handleClearChat} className="btn-clear-chat">
            <Trash2 size={14} /> <span className="hidden sm:inline">Clear Chat</span>
          </button>
          <button onClick={() => setShowSignOutModal(true)} className="btn-sign-out">
            <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="chat-container">
        <AnimatePresence>
          {messages.map((message, index) => {
            if (message.role === "assistant" && message.content === "" && isLoading && index === messages.length - 1) {
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bubble-bot p-4">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </motion.div>
              );
            }

            if (message.role === "user") {
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end pl-12">
                  <div className="bubble-user px-4 py-3 max-w-[85%] sm:max-w-[75%]">
                    {message.content}
                  </div>
                </motion.div>
              );
            }

            const { text, recommendations } = parseMessage(message.content);

            return (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start pr-12 w-full gap-2">
                {text && (
                  <div className="bubble-bot px-4 py-3 max-w-[90%] whitespace-pre-wrap leading-relaxed shadow-sm">
                    {text}
                  </div>
                )}
                {recommendations && recommendations.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 w-full">
                    {recommendations.map((recName: string, i: number) => {
                      const club = CLUBS.find(c => c.name.toLowerCase() === recName.toLowerCase());
                      if (!club) return null;
                      
                      let tagColor = "var(--muted)";
                      if (club.cat === "Technical") tagColor = "var(--accent)";
                      if (club.cat === "Non-Technical") tagColor = "var(--green)";
                      if (club.cat === "Regional") tagColor = "var(--amber)";
                      if (club.cat === "Chapter") tagColor = "var(--red)";
                      if (club.cat === "Community") tagColor = "#3b82f6";

                      return (
                        <div key={i} className="flex-1 min-w-[260px] max-w-[320px] rounded-xl border p-4 shadow-sm" style={{ background: "var(--surface2)", borderColor: "var(--border2)" }}>
                          <span className="text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: `${tagColor}20`, color: tagColor }}>
                            {club.cat}
                          </span>
                          <h3 className="font-bold text-[15px] mb-1 text-[var(--text)] font-display">{club.name}</h3>
                          <p className="text-[13px] text-[var(--text2)] mb-3 leading-snug">{club.desc}</p>
                          <div className="text-[11px] text-[var(--muted)] border-t border-[var(--border)] pt-2">
                            {club.contact}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask CampusMind about clubs, communities..."
            className="chat-input-box"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="chat-send-btn">
            <Send size={18} color="#fff" />
          </button>
        </form>
      </div>

      {/* Sign Out Modal */}
      {showSignOutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon text-[var(--red)]">⚠️</div>
            <h2 className="modal-title">Clear Memory & Sign Out?</h2>
            <p className="modal-body">
              This will wipe your current chat session and remove your profile from this device. Are you sure?
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowSignOutModal(false)} className="modal-btn-cancel">Cancel</button>
              <button onClick={confirmSignOut} className="modal-btn-confirm">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
