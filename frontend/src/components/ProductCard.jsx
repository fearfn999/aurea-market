import { Link } from "react-router-dom";
import { money } from "@/lib/api";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const premium = product.tier === "premium";
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card/60 border border-border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {discount > 0 && (
            <span className="px-2 py-1 rounded-md bg-primary text-white text-[11px] font-bold shadow">-{discount}%</span>
          )}
          {premium && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wide border border-white/15">
              <Sparkles size={10} /> Premium
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1.5">{product.delivery}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display font-600 text-sm leading-snug mb-1 hover:text-primary transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        <p className="text-[11px] text-muted-foreground mb-3">by {product.seller_name || "Aurea Market"}</p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Starting at</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-700 text-lg text-foreground">{money(product.price)}</span>
              {product.original_price && (
                <span className="text-xs text-muted-foreground line-through">{money(product.original_price)}</span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            data-testid={`add-to-cart-${product.id}`}
            onClick={() => {
              addItem(product);
              toast.success(`${product.title} added to cart`);
            }}
            className="rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-all active:scale-95"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};
