import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap } from "lucide-react";

export const SignInModal = ({ open, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(""); setEmail(""); setPassword(""); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let res;
    if (tab === "login") {
      res = await login(email, password);
    } else {
      if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
      res = await register({ name, email, password, role: "buyer" });
    }
    setLoading(false);
    if (res.ok) { reset(); onClose(); }
    else setError(res.error);
  };

  const switchTab = (t) => { setTab(t); reset(); setError(""); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card">
        <DialogHeader className="text-center">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-magenta flex items-center justify-center mx-auto mb-2 shadow-[0_0_18px_rgba(138,43,226,0.6)]">
            <Zap size={20} className="text-white" fill="currentColor" />
          </span>
          <DialogTitle className="text-lg font-display font-700">
            {tab === "login" ? "Welcome back" : "Create account"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex border border-border rounded-lg overflow-hidden text-sm font-medium mb-4">
          <button onClick={() => switchTab("login")} className={`flex-1 py-2 text-center transition-colors ${tab === "login" ? "bg-red text-white" : "bg-transparent text-muted-foreground"}`}>Sign In</button>
          <button onClick={() => switchTab("register")} className={`flex-1 py-2 text-center transition-colors ${tab === "register" ? "bg-red text-white" : "bg-transparent text-muted-foreground"}`}>Join</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "register" && (
            <div>
              <Label className="text-xs mb-1 block">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-10 bg-input border-border rounded-sm" />
            </div>
          )}
          <div>
            <Label className="text-xs mb-1 block">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-10 bg-input border-border rounded-sm" required />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-10 bg-input border-border rounded-sm" required />
          </div>
          {error && <p className="text-red text-xs">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-10 rounded-sm bg-primary text-black hover:bg-primary/90 font-bold">
            {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
