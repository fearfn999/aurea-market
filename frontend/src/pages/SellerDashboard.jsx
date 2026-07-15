import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, money, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ShoppingBag, DollarSign, LogOut, Store, Clock } from "lucide-react";

const CATS = [
  { slug: "discord-nitro", name: "Discord Nitro" },
  { slug: "game-accounts", name: "Game Accounts" },
  { slug: "game-keys", name: "Game Keys" },
  { slug: "gift-cards", name: "Gift Cards" },
];
const EMPTY = { title: "", category: "discord-nitro", price: "", original_price: "", description: "", image: "", tier: "standard", stock: 10, featured: false, delivery: "Instant Delivery" };

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, sales: 0, revenue: 0 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const pending = user?.status === "pending";

  useEffect(() => {
    if (pending) return;
    api.get("/seller/products").then((r) => setProducts(r.data)).catch(() => {});
    api.get("/seller/stats").then((r) => setStats(r.data)).catch(() => {});
  }, [pending]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...EMPTY, ...p, original_price: p.original_price ?? "" }); setOpen(true); };

  const save = async () => {
    const payload = { ...form, price: parseFloat(form.price) || 0, original_price: form.original_price ? parseFloat(form.original_price) : null, stock: parseInt(form.stock) || 0 };
    if (!payload.title || !payload.image || !payload.description) return toast.error("Title, image and description are required");
    try {
      if (editing) await api.put(`/seller/products/${editing}`, payload);
      else await api.post("/seller/products", payload);
      toast.success(editing ? "Product updated" : "Product listed");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Save failed"); }
  };

  const del = async (id) => {
    try { await api.delete(`/seller/products/${id}`); toast.success("Product deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const doLogout = () => { logout(); navigate("/seller"); };

  const statCards = [
    { icon: Package, label: "Listings", value: stats.products },
    { icon: ShoppingBag, label: "Units sold", value: stats.sales },
    { icon: DollarSign, label: "Revenue", value: money(stats.revenue) },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-background/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-red flex items-center justify-center"><Store size={18} className="text-white" /></span>
            <div>
              <span className="font-display font-700 tracking-tight block leading-tight">Seller Dashboard</span>
              <span className="text-xs text-muted-foreground">{user?.store_name}</span>
            </div>
          </div>
          <Button variant="outline" data-testid="seller-logout-btn" onClick={doLogout} className="rounded-lg border-border hover:border-destructive hover:text-destructive">
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {pending ? (
          <div className="rounded-2xl border border-red/30 bg-red/5 p-10 text-center" data-testid="pending-banner">
            <Clock size={44} className="text-red mx-auto mb-4" />
            <h2 className="font-display font-700 text-2xl mb-2">Account under review</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thanks for signing up, {user?.name}! Our team is reviewing <span className="text-white font-semibold">{user?.store_name}</span>.
              You'll be able to list products as soon as you're approved.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-xl bg-card border border-border p-5" data-testid={`seller-stat-${s.label}`}>
                  <s.icon size={22} className="text-red mb-3" />
                  <p className="font-display font-800 text-2xl">{s.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display font-700 text-xl">My listings</h2>
              <Button onClick={openNew} data-testid="seller-add-product-btn" className="rounded-lg bg-red hover:bg-amber text-white font-bold">
                <Plus size={16} className="mr-1" /> List product
              </Button>
            </div>

            {products.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center" data-testid="seller-empty">No products yet. List your first product!</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="bg-secondary text-muted-foreground uppercase text-xs tracking-wide">
                    <tr><th className="text-left p-4">Product</th><th className="text-left p-4">Price</th><th className="text-left p-4 hidden md:table-cell">Stock</th><th className="text-right p-4">Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t border-border" data-testid={`seller-product-${p.id}`}>
                        <td className="p-4"><div className="flex items-center gap-3"><img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" /><span className="font-medium line-clamp-1 max-w-[220px]">{p.title}</span></div></td>
                        <td className="p-4 font-medium">{money(p.price)}</td>
                        <td className="p-4 hidden md:table-cell">{p.stock}</td>
                        <td className="p-4"><div className="flex justify-end gap-2">
                          <button data-testid={`seller-edit-${p.id}`} onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:border-red hover:text-red transition-colors"><Pencil size={15} /></button>
                          <button data-testid={`seller-delete-${p.id}`} onClick={() => del(p.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader><DialogTitle className="font-display">{editing ? "Edit product" : "List new product"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-sm mb-1.5 block">Title</Label><Input data-testid="sform-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-input border-border rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-sm mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="sform-category" className="bg-input border-border rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm mb-1.5 block">Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger data-testid="sform-tier" className="bg-input border-border rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-sm mb-1.5 block">Price ($)</Label><Input data-testid="sform-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-input border-border rounded-lg" /></div>
              <div><Label className="text-sm mb-1.5 block">Original price ($)</Label><Input data-testid="sform-original" type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="bg-input border-border rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-sm mb-1.5 block">Stock</Label><Input data-testid="sform-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="bg-input border-border rounded-lg" /></div>
              <div><Label className="text-sm mb-1.5 block">Delivery</Label><Input data-testid="sform-delivery" value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} className="bg-input border-border rounded-lg" /></div>
            </div>
            <div><Label className="text-sm mb-1.5 block">Image URL</Label><Input data-testid="sform-image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" className="bg-input border-border rounded-lg" /></div>
            <div><Label className="text-sm mb-1.5 block">Description</Label><Textarea data-testid="sform-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-input border-border rounded-lg" /></div>
            <div className="flex items-center gap-3"><Switch data-testid="sform-featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /><Label className="text-sm">Featured</Label></div>
          </div>
          <DialogFooter><Button onClick={save} data-testid="sform-save-btn" className="rounded-lg bg-red hover:bg-amber text-white font-bold w-full">{editing ? "Save changes" : "List product"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
