import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

export const Footer = () => (
  <footer className="relative z-10 border-t border-border mt-32 bg-card/30">
    <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Flame size={16} className="text-white" fill="currentColor" />
          </span>
          <span className="font-display font-800 text-base tracking-tight">
            AUREA<span className="text-primary">MARKET</span>
          </span>
        </div>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          Premium digital marketplace. Discord Nitro, ranked accounts, keys & gift cards — delivered instantly.
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-4">Shop</p>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li><Link to="/?cat=discord-nitro" className="hover:text-primary transition-colors">Discord Nitro</Link></li>
          <li><Link to="/products?cat=game-accounts" className="hover:text-primary transition-colors">Game Accounts</Link></li>
          <li><Link to="/products?cat=game-keys" className="hover:text-primary transition-colors">Game Keys</Link></li>
          <li><Link to="/products?cat=gift-cards" className="hover:text-primary transition-colors">Gift Cards</Link></li>
          <li><Link to="/products?cat=boosting" className="hover:text-primary transition-colors">Boosting</Link></li>
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-4">Company</p>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
          <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
          <li><span className="hover:text-primary transition-colors cursor-pointer">Terms</span></li>
          <li><Link to="/admin/login" className="hover:text-primary transition-colors">Admin</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      &copy; 2026 Aurea Market. All digital goods delivered instantly & securely.
    </div>
  </footer>
);
