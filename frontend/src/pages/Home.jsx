import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Particles } from "@/components/Particles";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShieldCheck, Headphones, Flame } from "lucide-react";

const TAGS = ["Discord Nitro", "Game Accounts", "Steam Keys", "Gift Cards", "Boosting", "Instant Delivery"];

const CATEGORIES = [
  { slug: "discord-nitro", name: "Discord Nitro", img: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "game-accounts", name: "Game Accounts", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "game-keys", name: "Game Keys", img: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "gift-cards", name: "Gift Cards", img: "https://images.unsplash.com/photo-1614294148960-9aa740632a87?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { slug: "boosting", name: "Boosting", img: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

const STATS = [
  { value: "70K+", label: "Orders completed" },
  { value: "Seconds", label: "Average delivery" },
  { value: "24/7", label: "Discord support" },
  { value: "0", label: "Account issues" },
];

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
      {/* HERO */}
      <section className="relative overflow-hidden hero-radial">
        <div className="absolute inset-0 z-0 opacity-70">
          <Particles />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {TAGS.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red/10 border border-red/30 text-red text-xs font-bold uppercase tracking-wide mb-6">
              <Flame size={13} fill="currentColor" /> #1 Trusted Digital Store
            </span>
            <h1 className="font-display font-800 text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6">
              Level up your<br />
              <span className="text-red text-shadow-[0_10px_50px_-8px_rgba(0,229,255,0.5)]">digital game.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              Legit Discord Nitro, ranked game accounts, Steam keys and gift cards. Instant delivery, card & crypto checkout and Discord support — so your setup stays safe.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                data-testid="hero-shop-btn"
                onClick={() => navigate("/products")}
                className="rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 text-black font-bold text-base transition-colors active:scale-95 shadow-[0_10px_50px_-8px_rgba(0,229,255,0.5)]"
              >
                Browse the store <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                data-testid="hero-nitro-btn"
                onClick={() => navigate("/products?cat=discord-nitro")}
                className="rounded-lg h-12 px-8 border-border bg-secondary hover:border-red hover:text-red text-foreground font-semibold text-base transition-colors"
              >
                Discord Nitro
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/products?cat=boosting")}
                className="rounded-lg h-12 px-8 border-border bg-secondary hover:border-primary hover:text-primary text-foreground font-semibold text-base transition-colors"
              >
                Boosting
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-6 text-center">
              <p className="font-display font-800 text-3xl text-red mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display font-700 text-2xl mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/products?cat=${c.slug}`}
              data-testid={`home-category-${c.slug}`}
              className="group relative rounded-xl overflow-hidden border border-border h-36"
            >
              <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="font-display font-700 text-white">{c.name}</p>
                <span className="text-xs text-red font-semibold flex items-center gap-1">Shop now <ArrowRight size={12} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Zap, t: "Instant Delivery", d: "Codes sent in seconds" },
            { icon: ShieldCheck, t: "100% Secure", d: "Verified & warrantied" },
            { icon: Headphones, t: "24/7 Support", d: "Always on Discord" },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-4 rounded-xl bg-card border border-border p-5">
              <span className="w-11 h-11 rounded-lg bg-red/10 flex items-center justify-center shrink-0">
                <f.icon size={22} className="text-red" />
              </span>
              <div>
                <p className="font-display font-600 text-sm">{f.t}</p>
                <p className="text-xs text-muted-foreground">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-red font-bold text-xs uppercase tracking-wide mb-2">🔥 Hot right now</p>
            <h2 className="font-display font-700 text-3xl lg:text-4xl tracking-tight">Featured products</h2>
          </div>
          <Link to="/products">
            <Button data-testid="view-all-btn" variant="outline" className="rounded-lg h-11 px-6 border-border bg-card hover:border-red hover:text-red font-semibold transition-colors">
              View all <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="featured-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
