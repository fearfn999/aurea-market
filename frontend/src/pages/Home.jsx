import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShieldCheck, Headphones, Flame, TrendingUp, Clock } from "lucide-react";

const TAGS = ["Discord Nitro", "Game Accounts", "Steam Keys", "Gift Cards", "Boosting", "Instant Delivery"];

const CATEGORIES = [
  { slug: "discord-nitro", name: "Discord Nitro", img: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "game-accounts", name: "Game Accounts", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "game-keys", name: "Game Keys", img: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "gift-cards", name: "Gift Cards", img: "https://images.unsplash.com/photo-1614294148960-9aa740632a87?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "boosting", name: "Boosting", img: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

const STATS = [
  { value: "70K+", label: "Orders completed", icon: TrendingUp },
  { value: "30s", label: "Average delivery", icon: Clock },
  { value: "24/7", label: "Support", icon: Headphones },
  { value: "99.9%", label: "Uptime", icon: Zap },
];

function AnimatedSection({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className={className}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }}>
        {children}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products").then((r) => {
      const f = r.data.filter((p) => p.featured);
      setFeatured((f.length ? f : r.data).slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0 opacity-60">
          <Particles />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background z-[1]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex flex-wrap justify-center gap-2 mb-8 anim-fade-up">
              {TAGS.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-secondary/80 border border-border text-xs font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wide mb-6">
              <Flame size={13} /> #1 Trusted Digital Store
            </span>
            <h1 className="font-display font-800 text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
              Level up your<br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent">digital game.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Premium Discord Nitro, ranked game accounts, Steam keys & gift cards. 
              Instant delivery, secure checkout, and 24/7 support.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/products")}
                className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                Browse Store <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/products?cat=discord-nitro")}
                className="rounded-xl h-12 px-8 border-border bg-secondary/50 hover:border-primary hover:text-primary text-foreground font-semibold text-base transition-all"
              >
                Discord Nitro
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <AnimatedSection className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-card/80 border border-border p-5 text-center backdrop-blur-sm">
              <s.icon size={22} className="text-primary mx-auto mb-2" />
              <p className="font-display font-800 text-2xl text-foreground mb-0.5">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── CATEGORIES ── */}
      <AnimatedSection delay={0.1} className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-primary font-semibold text-xs uppercase tracking-wide mb-1">Categories</p>
            <h2 className="font-display font-700 text-2xl sm:text-3xl tracking-tight">Shop by category</h2>
          </div>
          <Link to="/products" className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {CATEGORIES.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link
                to={`/products?cat=${c.slug}`}
                className="group relative block rounded-xl overflow-hidden border border-border aspect-[4/5] sm:aspect-square"
              >
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-display font-700 text-sm text-white">{c.name}</p>
                  <span className="text-xs text-primary/90 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop now <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── TRUST ── */}
      <AnimatedSection delay={0.15} className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Zap, t: "Instant Delivery", d: "Delivered in seconds" },
            { icon: ShieldCheck, t: "100% Secure", d: "Verified & warrantied" },
            { icon: Headphones, t: "24/7 Support", d: "Always on Discord" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-4 rounded-xl bg-card/60 border border-border p-5 backdrop-blur-sm">
              <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={20} className="text-primary" />
              </span>
              <div>
                <p className="font-medium text-sm">{f.t}</p>
                <p className="text-xs text-muted-foreground">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── FEATURED ── */}
      <AnimatedSection delay={0.2} className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-primary font-semibold text-xs uppercase tracking-wide mb-1">Featured</p>
            <h2 className="font-display font-700 text-2xl sm:text-3xl tracking-tight">Popular products</h2>
          </div>
          <Link to="/products">
            <Button variant="outline" className="rounded-xl h-10 px-5 border-border bg-card hover:border-primary hover:text-primary text-xs font-medium transition-all">
              View all <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="featured-grid">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}
