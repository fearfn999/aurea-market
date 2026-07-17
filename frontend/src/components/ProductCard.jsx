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
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:-translate-y-1.5 hover:border-red/60 hover:shadow-[0_16px_50px_-12px_rgba(239,68,68,0.35)]" data-testid={`product-card-${product.id}`}>
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {discount > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-red text-white text-xs font-extrabold shadow-lg">-{discount}%</span>
          )}
          {premium && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wide border border-white/15">
              <Sparkles size={11} /> Premium
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] font-semibold text-red uppercase tracking-wide mb-1.5">{product.delivery}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display font-600 text-[15px] leading-snug mb-1 hover:text-red transition-colors line-clamp-2">
            {product.title}
          </h3>
        </Link>
        <p className="text-[11px] text-muted-foreground mb-3">by {product.seller_name || "Aurea Market Official"}</p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Starting at</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-700 text-lg text-white">{money(product.price)}</span>
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
            className="rounded-lg bg-primary hover:bg-primary/90 text-black font-bold transition-colors active:scale-95"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};
