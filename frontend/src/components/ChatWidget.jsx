import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, formatApiError } from "@/lib/api";
import { Bot, Send, X, MessageCircle } from "lucide-react";

const SUGGESTIONS = [
  "How fast is delivery?",
  "Which payment methods do you accept?",
  "Is buying a game account safe?",
  "Do you offer refunds?",
];

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [sessionId] = useState(genId);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey! I'm Aurea Assistant. Ask me anything about our products, delivery or support." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post("/support/chat", { session_id: sessionId, message: msg });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: formatApiError(e.response?.data?.detail) || "Sorry, I'm having trouble. Please try again or visit our support page." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-amber to-hot text-black shadow-[0_0_30px_rgba(219,165,32,0.4)] flex items-center justify-center hover:scale-105 transition-transform ${open ? "hidden" : ""}`}
      >
        <MessageCircle size={24} fill="currentColor" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-40px)] rounded-2xl border border-amber/20 bg-card shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-amber/20 to-transparent border-b border-amber/10">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber/20 flex items-center justify-center">
                  <Bot size={18} className="text-amber" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Aurea Assistant</p>
                  <p className="text-[11px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-amber transition-colors">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="h-[320px] overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${m.role === "user" ? "bg-amber/20" : "bg-amber/20"}`}>
                    {m.role === "user" ? <span className="text-[11px] font-bold text-amber">U</span> : <Bot size={14} className="text-amber" />}
                  </span>
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-amber/20 text-foreground" : "bg-secondary text-foreground"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <span className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-amber/20"><Bot size={14} className="text-amber" /></span>
                  <div className="bg-secondary rounded-xl px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-[11px] px-2.5 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:border-amber hover:text-amber transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 p-3 border-t border-border">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-10 px-3.5 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber/50"
              />
              <button type="submit" disabled={loading || !input.trim()} className="h-10 w-10 rounded-lg bg-amber text-black flex items-center justify-center disabled:opacity-50 hover:bg-amber/90 transition-colors">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
