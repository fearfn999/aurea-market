import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

export const Footer = () => (
  <footer data-testid="footer" className="relative z-10 border-t border-border mt-24 bg-card/40">
    <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-9 h-9 rounded-lg bg-red flex items-center justify-center">
            <Flame size={19} className="text-white" fill="currentColor" />
          </span>
          <span className="font-display font-800 text-lg tracking-tight">NITRO<span className="text-red">NEXUS</span></span>
        </div>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          The #1 marketplace for premium digital gaming goods. Discord Nitro, ranked accounts, keys & gift cards — instant delivery, secure checkout, 24/7 support.
        </p>
      </div>
      <div>
        <p className="text-xs font-bold text-white uppercase tracking-wide mb-4">Shop</p>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li><Link to="/?cat=discord-nitro" className="hover:text-red transition-colors">Discord Nitro</Link></li>
          <li><Link to="/products?cat=game-accounts" className="hover:text-red transition-colors">Game Accounts</Link></li>
          <li><Link to="/products?cat=game-keys" className="hover:text-red transition-colors">Game Keys</Link></li>
          <li><Link to="/products?cat=gift-cards" className="hover:text-red transition-colors">Gift Cards</Link></li>
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold text-white uppercase tracking-wide mb-4">Company</p>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li><Link to="/about" className="hover:text-red transition-colors">About Us</Link></li>
          <li><Link to="/support" className="hover:text-red transition-colors">Support</Link></li>
          <li><span className="hover:text-red transition-colors cursor-pointer">Terms</span></li>
          <li><Link to="/admin/login" data-testid="footer-admin-link" className="hover:text-red transition-colors">Admin</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      © 2026 Aurea Market. All digital goods delivered instantly & securely.
    </div>
  </footer>
);
