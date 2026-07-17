import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, LogIn, MessageCircle, LogOut, Menu, X, Package } from "lucide-react";
import { SignInModal } from "@/components/SignInModal";
import { DISCORD_INVITE_URL } from "@/constants/config";
import { NavbarLogo3D } from "@/components/NavbarLogo3D";

const LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Nitro", to: "/products?cat=discord-nitro" },
  { label: "Accounts", to: "/products?cat=game-accounts" },
  { label: "Boosting", to: "/products?cat=boosting" },
  { label: "About", to: "/about" },
];

export const Navbar = () => {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const isActive = (to) => location.pathname === to || location.search?.includes(to.split("?")[1] || "");

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 px-4" data-testid="navbar">
        <nav className={`mx-auto max-w-7xl flex items-center justify-between px-5 h-14 rounded-2xl transition-all duration-500 mt-2 ${scrolled ? "glass shadow-lg shadow-black/20" : "bg-transparent"}`}>
          <Link to="/" onClick={closeMobile} className="flex items-center gap-2.5 group">
            <NavbarLogo3D />
            <span className="font-display font-800 text-sm tracking-tight">
              AUREA<span className="text-primary">MARKET</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => navigate(l.to)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${isActive(l.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/seller")} className="hidden sm:flex items-center px-3 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Sell
            </button>

            {user ? (
              <>
                <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/15 text-indigo-300 hover:bg-indigo-600/20 text-xs font-medium transition-colors">
                  <MessageCircle size={13} />
                  <span>Discord</span>
                </a>
                <button onClick={() => navigate("/orders")} className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors">
                  <Package size={13} />
                  <span className="hidden sm:inline">Orders</span>
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{user.name}</span>
                  <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors" title="Sign out">
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowSignIn(true)} className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors">
                <LogIn size={13} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <Link to="/cart" className="relative flex items-center gap-2 px-3 h-8 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors">
              <ShoppingCart size={13} />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-white text-primary text-[9px] font-bold flex items-center justify-center shadow">
                  {count}
                </span>
              )}
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="md:hidden max-w-7xl mx-auto mt-2 glass rounded-2xl px-5 py-4 space-y-2" style={{ animation: "fadeIn 0.2s ease-out" }}>
            {LINKS.map((l) => (
              <button key={l.label} onClick={() => { navigate(l.to); closeMobile(); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                {l.label}
              </button>
            ))}
            <div className="border-t border-border pt-2 mt-2 space-y-2">
              <button onClick={() => { navigate("/support"); closeMobile(); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Support</button>
              {user && (
                <button onClick={() => { navigate("/orders"); closeMobile(); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">My Orders</button>
              )}
              {user && (
                <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="block w-full px-3 py-2.5 rounded-lg text-sm text-indigo-400 hover:text-indigo-300 hover:bg-secondary transition-colors">Discord</a>
              )}
              {!user && (
                <button onClick={() => { setShowSignIn(true); closeMobile(); }} className="w-full py-2.5 rounded-lg bg-primary/20 text-primary text-sm font-semibold">Sign In</button>
              )}
            </div>
          </div>
        )}
      </header>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
};
