import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles, MessagesSquare } from "lucide-react";

const SUGGESTIONS = [
  "How fast is delivery?",
  "Which payment methods do you accept?",
  "Is buying a game account safe?",
  "Do you offer refunds?",
];

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function Support() {
  const [sessionId] = useState(genId);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey! 👋 I'm the Aurea Assistant. Ask me anything about our products, delivery, payments or account safety." },
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
      setMessages((m) => [...m, { role: "assistant", text: formatApiError(e.response?.data?.detail) || "Sorry, I'm having trouble right now. Please try again or reach us on Discord." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen max-w-3xl mx-auto px-6 pt-28 pb-16">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red/10 border border-red/30 text-red text-xs font-bold uppercase tracking-wide mb-4">
          <MessagesSquare size={13} /> Support
        </span>
        <h1 className="font-display font-800 text-4xl lg:text-5xl tracking-tight mb-3">
          Need a hand? <span className="text-red text-glow-red">Ask away.</span>
        </h1>
        <p className="text-muted-foreground">Chat with our AI assistant — instant answers, 24/7.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: "60vh", minHeight: 420 }} data-testid="support-chat">
        {/* header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-secondary/50">
          <span className="w-9 h-9 rounded-lg bg-red flex items-center justify-center">
            <Bot size={19} className="text-white" />
          </span>
          <div>
            <p className="font-display font-600 text-sm">Aurea Assistant</p>
            <p className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online</p>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              data-testid={`chat-msg-${m.role}`}
            >
              <span className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${m.role === "user" ? "bg-secondary" : "bg-red"}`}>
                {m.role === "user" ? <User size={16} className="text-foreground" /> : <Bot size={16} className="text-white" />}
              </span>
              <div className={`max-w-[78%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-red text-white" : "bg-secondary text-foreground"}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-2.5" data-testid="chat-typing">
              <span className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-red"><Bot size={16} className="text-white" /></span>
              <div className="bg-secondary rounded-xl px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* suggestions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} data-testid={`suggestion-${s}`} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:border-red hover:text-red transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* input */}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 p-4 border-t border-border">
          <Input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            className="h-11 rounded-lg bg-input border-border focus-visible:ring-red"
          />
          <Button type="submit" disabled={loading || !input.trim()} data-testid="chat-send-btn" className="h-11 w-11 p-0 rounded-lg bg-primary hover:bg-primary/90 text-white shrink-0">
            <Send size={18} />
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
        <Sparkles size={12} className="text-red" /> AI can make mistakes — for order issues, open a ticket on our Discord.
      </p>
    </div>
  );
}
