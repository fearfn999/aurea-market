import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/Particles";
import { ShieldCheck, Zap, Headphones, Users, ArrowRight, Flame } from "lucide-react";

const VALUES = [
  { icon: Zap, t: "Instant delivery", d: "Most orders land in your inbox within seconds of checkout — no waiting around." },
  { icon: ShieldCheck, t: "Safe & verified", d: "Every account and key is checked and warrantied. Your purchase is protected." },
  { icon: Headphones, t: "24/7 support", d: "Real humans (and our AI assistant) on Discord around the clock." },
  { icon: Users, t: "Trusted by 70K+", d: "Thousands of gamers rely on Aurea Market for their digital gear." },
];

export default function About() {
  return (
    <div className="relative min-h-screen">
      <section className="relative overflow-hidden hero-radial">
        <div className="absolute inset-0 z-0 opacity-60"><Particles /></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-40 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red/10 border border-red/30 text-red text-xs font-bold uppercase tracking-wide mb-6">
              <Flame size={13} fill="currentColor" /> About Aurea Market
            </span>
            <h1 className="font-display font-800 text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6">
              The store gamers<br /><span className="text-red text-glow-red">actually trust.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Aurea Market was built by gamers, for gamers. We make premium digital goods —
              Discord Nitro, ranked accounts, keys and gift cards — fast, affordable and safe to buy.
              No sketchy resellers, no waiting: just legit products delivered instantly.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((v) => (
            <div key={v.t} className="rounded-xl bg-card border border-border p-6" data-testid={`about-value-${v.t}`}>
              <span className="w-11 h-11 rounded-lg bg-red/10 flex items-center justify-center mb-4">
                <v.icon size={22} className="text-red" />
              </span>
              <p className="font-display font-600 text-base mb-2">{v.t}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <h2 className="font-display font-700 text-2xl lg:text-3xl mb-4">Ready to level up?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Browse the store or chat with our AI assistant if you need a hand choosing the right product.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products"><Button data-testid="about-shop-btn" className="rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 text-black font-bold shadow-[0_10px_50px_-8px_rgba(0,229,255,0.5)]">Browse the store <ArrowRight size={18} className="ml-2" /></Button></Link>
            <Link to="/support"><Button data-testid="about-support-btn" variant="outline" className="rounded-lg h-12 px-8 border-border bg-secondary hover:border-red hover:text-red font-semibold">Talk to support</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
