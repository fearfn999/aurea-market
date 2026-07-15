import { Link, useNavigate } from "react-router-dom";
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
  { label: "Keys", to: "/products?cat=game-keys" },
  { label: "About", to: "/about" },
];

export const Navbar = () => {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 px-0" data-testid="navbar">
        <nav className={`mx-auto flex items-center justify-between px-5 h-16 transition-all duration-500 ${scrolled ? "glass border-b border-amber/10" : "bg-transparent"}`}>
          <Link to="/" onClick={closeMobile} className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 flex items-center justify-center">
              <NavbarLogo3D />
            </span>
            <span className="font-display font-800 text-base tracking-tight">
              AUREA<span className="text-amber">MARKET</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] font-mono uppercase tracking-widest">
            {LINKS.map((l) => (
              <button key={l.label} onClick={() => navigate(l.to)} className="text-muted-foreground hover:text-amber transition-colors relative group">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-amber transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <button onClick={() => navigate("/support")} className="text-amber/70 hover:text-amber transition-colors">Support</button>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate("/seller")} className="hidden sm:flex items-center px-3.5 h-9 rounded-full border border-amber/20 text-amber/80 hover:bg-amber/10 hover:text-amber text-[12px] font-semibold transition-all">
              Sell
            </button>

            {user ? (
              <>
                <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full bg-indigo-600/15 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/25 text-[12px] font-semibold transition-colors">
                  <MessageCircle size={14} />
                  <span>Discord</span>
                </a>
                <button onClick={() => navigate("/orders")} className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-amber/10 border border-amber/20 text-amber hover:bg-amber/20 text-[12px] font-semibold transition-all">
                  <Package size={14} />
                  <span className="hidden sm:inline">Orders</span>
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-amber/20">
                  <span className="text-[12px] text-muted-foreground truncate max-w-[70px] sm:max-w-[100px]">{user.name}</span>
                  <button onClick={logout} className="text-muted-foreground hover:text-amber transition-colors" title="Sign out">
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowSignIn(true)} className="flex items-center gap-1.5 px-3.5 h-9 rounded-full border border-amber/30 bg-amber/10 text-amber hover:bg-amber/20 text-[12px] font-semibold transition-all">
                <LogIn size={14} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <Link to="/cart" className="relative flex items-center gap-2 px-3.5 h-9 rounded-full bg-gradient-to-br from-amber to-amber/80 text-black text-[12px] font-bold hover:shadow-[0_0_20px_rgba(219,165,32,0.4)] transition-shadow">
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-amber text-[10px] font-bold flex items-center justify-center border border-amber/40">
                  {count}
                </span>
              )}
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-amber transition-colors">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="md:hidden glass border-b border-amber/10 px-5 py-4 space-y-3">
            {LINKS.map((l) => (
              <button key={l.label} onClick={() => { navigate(l.to); closeMobile(); }} className="block w-full text-left py-2 text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-amber transition-colors">
                {l.label}
              </button>
            ))}
            <button onClick={() => { navigate("/support"); closeMobile(); }} className="block w-full text-left py-2 text-sm font-mono uppercase tracking-widest text-amber/70 hover:text-amber transition-colors">Support</button>
            {user && (
              <button onClick={() => { navigate("/orders"); closeMobile(); }} className="block w-full text-left py-2 text-sm font-mono uppercase tracking-widest text-amber/70 hover:text-amber transition-colors">My Orders</button>
            )}
            {user && (
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="block w-full text-left py-2 text-sm font-mono uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">Discord</a>
            )}
            {!user && (
              <button onClick={() => { setShowSignIn(true); closeMobile(); }} className="w-full py-2.5 rounded-lg bg-amber/20 border border-amber/30 text-amber text-sm font-semibold">Sign In</button>
            )}
          </div>
        )}
      </div>

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
};
