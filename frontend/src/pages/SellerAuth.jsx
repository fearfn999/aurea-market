import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Particles } from "@/components/Particles";
import { Store } from "lucide-react";

export default function SellerAuth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", store_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res =
      mode === "register"
        ? await register({ name: form.name, store_name: form.store_name, email: form.email, password: form.password })
        : await login(form.email, form.password);
    setLoading(false);
    if (res.ok) {
      if (res.user?.role === "admin") navigate("/admin");
      else navigate("/seller/dashboard");
    } else setError(res.error);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div className="absolute inset-0 opacity-60"><Particles /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-10 h-10 rounded-lg bg-red flex items-center justify-center">
              <Store size={20} className="text-white" />
            </span>
            <span className="font-display font-800 text-lg tracking-tight">Seller Portal</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-secondary">
            <button data-testid="tab-register" onClick={() => setMode("register")} className={`h-9 rounded-md text-sm font-semibold transition-colors ${mode === "register" ? "bg-red text-white" : "text-muted-foreground"}`}>Become a seller</button>
            <button data-testid="tab-login" onClick={() => setMode("login")} className={`h-9 rounded-md text-sm font-semibold transition-colors ${mode === "login" ? "bg-red text-white" : "text-muted-foreground"}`}>Sign in</button>
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="seller-auth-form">
            {mode === "register" && (
              <>
                <div>
                  <Label className="text-sm mb-1.5 block">Your name</Label>
                  <Input data-testid="seller-name" value={form.name} onChange={set("name")} placeholder="Jane Doe" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Store name</Label>
                  <Input data-testid="seller-store" value={form.store_name} onChange={set("store_name")} placeholder="Jane's Game Shop" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
                </div>
              </>
            )}
            <div>
              <Label className="text-sm mb-1.5 block">Email</Label>
              <Input data-testid="seller-email" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Password</Label>
              <Input data-testid="seller-password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
            </div>
            {error && <p data-testid="seller-auth-error" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} data-testid="seller-auth-submit" className="w-full rounded-lg h-11 bg-red hover:bg-amber text-white font-bold">
              {loading ? "Please wait…" : mode === "register" ? "Create seller account" : "Sign in"}
            </Button>
          </form>
          {mode === "register" && (
            <p className="text-xs text-muted-foreground mt-4 text-center">New sellers are reviewed by our team before products go live.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
