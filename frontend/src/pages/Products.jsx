import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";

const CATS = [
  { slug: "all", name: "All" },
  { slug: "discord-nitro", name: "Discord Nitro" },
  { slug: "game-accounts", name: "Game Accounts" },
  { slug: "game-keys", name: "Game Keys" },
  { slug: "gift-cards", name: "Gift Cards" },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [params, setParams] = useSearchParams();
  const active = params.get("cat") || "all";

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  const setCat = (slug) => (slug === "all" ? setParams({}) : setParams({ cat: slug }));

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const catOk = active === "all" || p.category === active;
        const sOk = !search || p.title.toLowerCase().includes(search.toLowerCase());
        return catOk && sOk;
      }),
    [products, active, search]
  );

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-5 font-semibold">
          <Link to="/" className="hover:text-red transition-colors">Home</Link>
          <ChevronRight size={13} />
          <span className="text-red">Shop</span>
        </div>
        <h1 className="font-display font-800 text-4xl lg:text-6xl tracking-tight mb-3">
          Shop <span className="text-red text-glow-red">products</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Browse all our accounts, tools and services in one place — instant delivery.
        </p>
      </section>

      {/* Controls */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 sticky top-16 py-4 bg-background/90 backdrop-blur-xl border-y border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2.5">
            {CATS.map((c) => (
              <button
                key={c.slug}
                data-testid={`products-filter-${c.slug}`}
                onClick={() => setCat(c.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                  active === c.slug
                    ? "bg-red text-white border-red"
                    : "bg-card text-muted-foreground border-border hover:border-red hover:text-red"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="products-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-11 h-11 rounded-lg bg-card border-border focus-visible:ring-red"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <p className="text-sm text-muted-foreground mb-6">
          Showing <span className="text-white font-semibold">{filtered.length}</span> item{filtered.length === 1 ? "" : "s"}
        </p>
        {filtered.length === 0 ? (
          <p data-testid="products-empty" className="text-muted-foreground py-24 text-center">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="products-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
