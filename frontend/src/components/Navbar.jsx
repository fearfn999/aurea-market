import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Zap } from "lucide-react";

const LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Nitro", to: "/products?cat=discord-nitro" },
  { label: "Accounts", to: "/products?cat=game-accounts" },
  { label: "Keys", to: "/products?cat=game-keys" },
  { label: "About", to: "/about" },
];

export const Navbar = () => {
  const { count } = useCart();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-4 inset-x-0 z-50 px-4" data-testid="navbar">
      <nav className={`max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-4 sm:px-6 h-14 transition-all duration-500 ${scrolled ? "glass" : "bg-transparent"}`}>
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-hot flex items-center justify-center shadow-[0_0_18px_rgba(138,43,226,0.6)]">
            <Zap size={17} className="text-white" fill="currentColor" />
          </span>
          <span className="font-display font-800 text-base tracking-tight">
            AUREA<span className="text-primary">MARKET</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-[13px] font-mono uppercase tracking-widest">
          {LINKS.map((l) => (
            <button key={l.label} onClick={() => navigate(l.to)} data-testid={`nav-${l.label.toLowerCase()}`} className="text-muted-foreground hover:text-white transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-cyan transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
          <button onClick={() => navigate("/support")} data-testid="nav-support" className="text-cyan hover:text-white transition-colors">Support</button>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/seller")} data-testid="nav-sell" className="hidden sm:flex items-center px-4 h-9 rounded-full bg-white/5 border border-white/10 text-white hover:border-cyan hover:text-cyan text-[13px] font-semibold transition-colors">
            Sell
          </button>
          <Link to="/cart" data-testid="cart-link" className="relative flex items-center gap-2 px-4 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white text-[13px] font-semibold hover:shadow-[0_0_20px_rgba(138,43,226,0.6)] transition-shadow">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span data-testid="cart-count" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan text-black text-[11px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
};
