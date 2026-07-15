import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";

export default function Cart() {
  const { items, removeItem, updateQty, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0)
    return (
      <div className="pt-40 pb-20 text-center min-h-screen" data-testid="cart-empty">
        <ShoppingCart size={56} className="mx-auto text-muted-foreground mb-6" />
        <h2 className="font-display font-600 text-2xl mb-3">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Time to stock up your arsenal.</p>
        <Link to="/"><Button className="rounded-sm bg-red text-white hover:bg-amber font-bold">Browse marketplace</Button></Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-20 min-h-screen">
      <h1 className="font-display font-600 text-4xl tracking-tight mb-10">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((it) => (
            <motion.div
              key={it.product_id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-testid={`cart-item-${it.product_id}`}
              className="flex items-center gap-4 rounded-sm border border-border bg-card p-4"
            >
              <img src={it.image} alt={it.title} className="w-20 h-20 rounded-sm object-cover border border-border" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-500 text-sm truncate">{it.title}</p>
                <p className="text-red font-bold mt-1 font-mono">{money(it.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button data-testid={`qty-dec-${it.product_id}`} onClick={() => updateQty(it.product_id, it.quantity - 1)} className="w-8 h-8 rounded-sm border border-border flex items-center justify-center hover:border-red hover:text-red transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-medium font-mono">{it.quantity}</span>
                <button data-testid={`qty-inc-${it.product_id}`} onClick={() => updateQty(it.product_id, it.quantity + 1)} className="w-8 h-8 rounded-sm border border-border flex items-center justify-center hover:border-red hover:text-red transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <button data-testid={`remove-${it.product_id}`} onClick={() => removeItem(it.product_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="rounded-sm border border-border bg-card p-6 h-fit">
          <p className="font-mono uppercase tracking-widest text-xs font-bold text-muted-foreground mb-5">Order Summary</p>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono" data-testid="cart-subtotal">{money(total)}</span>
          </div>
          <div className="flex justify-between text-sm mb-5">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-red font-mono">Instant · Free</span>
          </div>
          <div className="border-t border-border pt-4 flex justify-between items-baseline mb-6">
            <span className="font-semibold">Total</span>
            <span className="font-display font-600 text-2xl font-mono" data-testid="cart-total">{money(total)}</span>
          </div>
          <Button data-testid="checkout-btn" onClick={() => navigate("/checkout")} className="w-full rounded-sm h-12 bg-red hover:bg-amber text-white font-bold transition-colors active:scale-95">
            Checkout <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
