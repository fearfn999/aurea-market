import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate("/admin");
    else setError(res.error);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div className="absolute inset-0 grid-bg" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="rounded-sm border border-border bg-card p-8">
          <div className="flex items-center gap-2.5 mb-8">
            <span className="w-9 h-9 rounded-sm bg-red flex items-center justify-center">
              <Zap size={20} strokeWidth={2.5} className="text-white" fill="currentColor" />
            </span>
            <span className="font-display font-600 text-lg tracking-tight">Admin Console</span>
          </div>
          <h1 className="font-display font-600 text-2xl mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in to manage the marketplace.</p>

          <form onSubmit={submit} className="space-y-5" data-testid="admin-login-form">
            <div>
              <Label className="text-sm mb-2 block">Email</Label>
              <Input data-testid="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@aureamarket.gg" className="h-11 bg-input border-border focus-visible:ring-red rounded-sm" />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Password</Label>
              <Input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 bg-input border-border focus-visible:ring-red rounded-sm" />
            </div>
            {error && <p data-testid="login-error" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} data-testid="admin-login-btn" className="w-full rounded-sm h-11 bg-red hover:bg-amber text-white font-bold transition-colors active:scale-95">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
