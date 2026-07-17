import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, money } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Zap, Sparkles, CheckCircle2 } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setProduct(r.data)).catch(() => setNotFound(true));
  }, [id]);

  if (notFound)
    return (
      <div className="pt-40 text-center min-h-screen">
        <p className="text-muted-foreground mb-6 font-mono" data-testid="product-not-found">Product not found.</p>
        <Link to="/"><Button className="rounded-sm bg-red text-white hover:bg-amber">Back to shop</Button></Link>
      </div>
    );

  if (!product) return <div className="pt-40 text-center min-h-screen text-muted-foreground font-mono">Loading…</div>;

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 min-h-screen">
      <button onClick={() => navigate(-1)} data-testid="back-btn" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red transition-colors mb-8 font-mono uppercase tracking-wide">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative rounded-sm overflow-hidden border border-border">
          <img src={product.image} alt={product.title} className="w-full h-[420px] object-cover" data-testid="product-image" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
          {product.tier === "premium" && (
            <span className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 rounded-sm bg-red text-white text-xs font-bold uppercase tracking-wider font-mono">
              <Sparkles size={13} /> Premium
            </span>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="font-mono uppercase tracking-widest text-xs font-bold text-red mb-3">// {product.category.replace("-", " ")}</p>
          <h1 className="font-display font-600 text-3xl lg:text-4xl tracking-tight mb-2" data-testid="product-title">{product.title}</h1>
          <p className="text-sm text-muted-foreground mb-5">Sold by <span className="text-white font-semibold">{product.seller_name || "Aurea Market Official"}</span></p>

          <div className="flex items-baseline gap-4 mb-6 font-mono">
            <span className="font-700 text-4xl text-white">{money(product.price)}</span>
            {product.original_price && <span className="text-lg text-muted-foreground line-through">{money(product.original_price)}</span>}
            {discount > 0 && <span className="px-2.5 py-1 rounded-sm bg-secondary border border-red/40 text-red text-xs font-bold">SAVE {discount}%</span>}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-8" data-testid="product-description">{product.description}</p>

          <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-sm overflow-hidden mb-8">
            {[
              { icon: Zap, t: product.delivery },
              { icon: ShieldCheck, t: "Warrantied & Secure" },
              { icon: CheckCircle2, t: product.stock > 0 ? `${product.stock} in stock` : "Out of stock" },
              { icon: Sparkles, t: "Verified Seller" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2 bg-card p-4">
                <f.icon size={20} className="text-red shrink-0" />
                <span className="text-sm">{f.t}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              data-testid="detail-add-cart-btn"
              disabled={product.stock <= 0}
              onClick={() => { addItem(product); toast.success("Added to cart"); }}
              className="rounded-sm h-12 px-8 bg-secondary hover:border-red border border-border text-foreground font-semibold transition-colors"
            >
              Add to cart
            </Button>
            <Button
              data-testid="detail-buy-now-btn"
              disabled={product.stock <= 0}
              onClick={() => { addItem(product); navigate("/checkout"); }}
              className="rounded-sm h-12 px-8 bg-primary hover:bg-primary/90 text-black font-bold transition-colors active:scale-95"
            >
              <Zap size={18} className="mr-2" fill="currentColor" /> Buy now
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
