"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, SendHorizonal, LogOut, Trash2, Menu, Moon } from "lucide-react";
import { signOut } from "next-auth/react";
import { CLUBS } from "@/lib/clubs";

interface Message { role: "user" | "assistant"; content: string; }

interface ChatWindowProps {
  userId: string;
  studentName?: string | null;
  onToggleSidebar?: () => void;
  sessionId?: string | null;
  onSessionCreated?: (sessionId: string) => void;
  onChatCleared?: () => void;
}

export default function ChatWindow({ userId, studentName, onToggleSidebar, sessionId: externalSessionId, onSessionCreated, onChatCleared }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(externalSessionId ?? null);
  const createdSessionIdRef = useRef<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try { const stored = localStorage.getItem("campusmind_user"); if (stored) setUserProfile(JSON.parse(stored)); } catch {}
  }, []);

  const getGreeting = () => {
    if (!userProfile) return "Welcome to CampusMind! How can I help you today?";
    const name = userProfile.name.split(" ")[0];
    const clubs = userProfile.clubs;
    if (clubs && clubs.length > 0) return `Hey ${name}! Based on your ${userProfile.branch} background and interest in ${clubs}, I've got some great recommendations for you. What would you like to explore today?`;
    return `Hey ${name}! As a ${userProfile.year} ${userProfile.branch} student, there's a lot you can explore. Tell me what you're interested in!`;
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
          if (data.messages?.length > 0) setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        } catch {}
        return;
      }
      setCurrentSessionId(null);
      createdSessionIdRef.current = null;
      const saved = localStorage.getItem(`campusmind_chat_${userId}`);
      if (saved) { try { const parsed = JSON.parse(saved); if (parsed.length > 0) { setMessages(parsed); return; } } catch {} }
      if (userProfile) setMessages([{ role: "assistant", content: JSON.stringify({ text: getGreeting(), recommendations: [] }) }]);
    };
    loadMessages();
  }, [userId, externalSessionId, userProfile]);

  useEffect(() => {
    if (!isMounted || !userId || messages.length === 0 || externalSessionId) return;
    const savable = messages.filter(m => !(m.role === "assistant" && m.content === ""));
    localStorage.setItem(`campusmind_chat_${userId}`, JSON.stringify(savable));
  }, [messages, userId, isMounted, externalSessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const handleSend = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isLoading) return;
    const userMessage: Message = { role: "user", content: text };
    const placeholder: Message = { role: "assistant", content: "" };
    const history = messages.filter(m => !(m.role === "assistant" && m.content === ""));
    setMessages([...history, userMessage, placeholder]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text, userId,
          history: history.map(m => { try { const p = JSON.parse(m.content); return { role: m.role, content: p.text }; } catch { return m; } }),
          sessionId: currentSessionId,
        }),
      });
      if (!response.ok) throw new Error("Stream failed");
      const newSid = response.headers.get("X-Session-Id");
      if (newSid && !currentSessionId) {
        createdSessionIdRef.current = newSid;
        setCurrentSessionId(newSid);
        onSessionCreated?.(newSid);
        localStorage.removeItem(`campusmind_chat_${userId}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + chunk }; return u; });
      }
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: JSON.stringify({ text: "Sorry, something went wrong.", recommendations: [] }) }; return u; });
    } finally { setIsLoading(false); }
  }, [input, isLoading, messages, userId, currentSessionId, onSessionCreated]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } };

  const handleClearChat = async () => {
    try { await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' }); } catch {}
    localStorage.removeItem(`campusmind_chat_${userId}`);
    setCurrentSessionId(null);
    createdSessionIdRef.current = null;
    if (userProfile) setMessages([{ role: "assistant", content: JSON.stringify({ text: getGreeting(), recommendations: [] }) }]);
    else setMessages([]);
    onChatCleared?.();
    setShowClearModal(false);
  };

  const confirmSignOut = async () => {
    localStorage.removeItem(`campusmind_chat_${userId}`);
    localStorage.removeItem("campusmind_user");
    await signOut({ callbackUrl: "/login" });
  };

  const parseMessage = (content: string) => {
    try { const p = JSON.parse(content); return { text: p.text || "", recommendations: p.recommendations || [] }; }
    catch { return { text: content, recommendations: [] }; }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "transparent", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <header className="chat-header">
        <button onClick={onToggleSidebar} className="icon-btn pearl md:hidden" aria-label="Toggle sidebar" title="Open sidebar"><Menu size={16} /></button>
        <Moon size={16} style={{ color: "var(--accent2)", flexShrink: 0 }} />
        <div>
          <h1 className="chat-header-title">CampusMind</h1>
          <p className="chat-header-sub">{userProfile ? `${userProfile.branch} - ${userProfile.year}` : "VIT Bhopal"}</p>
        </div>
        <div className="chat-header-spacer" />
        <div className="chat-header-actions">
          <button onClick={() => setShowClearModal(true)} className="icon-btn danger" aria-label="Clear chat" title="Clear chat"><Trash2 size={16} /></button>
          <button onClick={() => setShowSignOutModal(true)} className="icon-btn pearl" aria-label="Log out" title="Log out"><LogOut size={16} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="chat-container">
        <AnimatePresence>
          {messages.map((message, index) => {
            if (message.role === "assistant" && message.content === "" && isLoading && index === messages.length - 1) {
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bubble-bot" style={{ padding: "14px 18px" }}>
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </motion.div>
              );
            }
            if (message.role === "user") {
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end pl-12">
                  <div className="bubble-user">{message.content}</div>
                </motion.div>
              );
            }
            const { text, recommendations } = parseMessage(message.content);
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start pr-12 w-full gap-2">
                {text && <div className="bubble-bot whitespace-pre-wrap leading-relaxed">{text}</div>}
                {recommendations?.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2 w-full">
                    {recommendations.map((recName: string, i: number) => {
                      const club = CLUBS.find(c => c.name.toLowerCase() === recName.toLowerCase());
                      if (!club) return null;
                      let tagColor = "var(--muted)";
                      if (club.cat === "Technical") tagColor = "var(--accent)";
                      if (club.cat === "Non-Technical") tagColor = "var(--green)";
                      if (club.cat === "Regional") tagColor = "var(--amber)";
                      if (club.cat === "Chapter") tagColor = "var(--red)";
                      if (club.cat === "Community") tagColor = "#818cf8";
                      return (
                        <div key={i} style={{ flex: "1 1 260px", maxWidth: 320, borderRadius: "var(--r-lg)", border: "1px solid var(--border2)", padding: "16px", background: "var(--surface2)" }}>
                          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--r-pill)", display: "inline-block", marginBottom: 8, background: `color-mix(in srgb, ${tagColor} 15%, transparent)`, color: tagColor }}>{club.cat}</span>
                          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "var(--text)", fontFamily: "var(--font-display)" }}>{club.name}</h3>
                          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, lineHeight: 1.5 }}>{club.desc}</p>
                          <div style={{ fontSize: 11, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>{club.contact}</div>
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

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={(e) => { e.preventDefault(); void handleSend(); }}>
          <div className="chat-input-wrapper">
            <textarea ref={textareaRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} placeholder="Ask CampusMind about clubs, communities..." className="chat-input-box" />
            <button type="submit" disabled={isLoading || !input.trim()} className="chat-send-btn" aria-label="Send message" title="Send message">
              <SendHorizonal size={17} />
            </button>
          </div>
        </form>
      </div>

      {/* Clear Chat Modal */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon" style={{ color: "var(--red)", display: "flex", justifyContent: "center" }}><Trash2 size={28} /></div>
            <h2 className="modal-title">Clear Chat?</h2>
            <p className="modal-body">This removes your saved chat sessions and clears the current conversation from this device.</p>
            <div className="modal-actions">
              <button onClick={() => setShowClearModal(false)} className="modal-btn-cancel">Cancel</button>
              <button onClick={handleClearChat} className="modal-btn-confirm">Clear Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      {showSignOutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon" style={{ color: "var(--red)", display: "flex", justifyContent: "center" }}><AlertTriangle size={28} /></div>
            <h2 className="modal-title">Clear Memory & Log Out?</h2>
            <p className="modal-body">This will wipe your current chat session and remove your profile from this device. Are you sure?</p>
            <div className="modal-actions">
              <button onClick={() => setShowSignOutModal(false)} className="modal-btn-cancel">Cancel</button>
              <button onClick={confirmSignOut} className="modal-btn-confirm">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
