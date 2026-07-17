import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, money, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Receipt, DollarSign, Clock, LogOut, Zap, Store, Check, X } from "lucide-react";

const CATS = [
  { slug: "discord-nitro", name: "Discord Nitro" },
  { slug: "game-accounts", name: "Game Accounts" },
  { slug: "game-keys", name: "Game Keys" },
  { slug: "gift-cards", name: "Gift Cards" },
  { slug: "boosting", name: "Boosting" },
];

const EMPTY = { title: "", category: "discord-nitro", price: "", original_price: "", description: "", image: "", tier: "standard", stock: 10, featured: false, delivery: "Instant Delivery" };

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0, revenue: 0, sellers: 0, pending_sellers: 0 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
    api.get("/admin/orders").then((r) => setOrders(r.data)).catch(() => {});
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/sellers").then((r) => setSellers(r.data)).catch(() => {});
  };

  const setSellerStatus = async (id, status) => {
    try {
      await api.put(`/admin/sellers/${id}/status?status=${status}`);
      toast.success(`Seller ${status}`);
      load();
    } catch { toast.error("Action failed"); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ ...EMPTY, ...p, original_price: p.original_price ?? "" });
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock: parseInt(form.stock) || 0,
    };
    if (!payload.title || !payload.image || !payload.description) {
      toast.error("Title, image and description are required");
      return;
    }
    try {
      if (editing) await api.put(`/admin/products/${editing}`, payload);
      else await api.post("/admin/products", payload);
      toast.success(editing ? "Product updated" : "Product created");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Save failed");
    }
  };

  const del = async (id) => {
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const doLogout = () => { logout(); navigate("/admin/login"); };

  const statCards = [
    { icon: Package, label: "Products", value: stats.products },
    { icon: Store, label: "Sellers", value: stats.sellers },
    { icon: Receipt, label: "Orders", value: stats.orders },
    { icon: DollarSign, label: "Revenue", value: money(stats.revenue) },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-sm bg-red flex items-center justify-center">
              <Zap size={18} strokeWidth={2.5} className="text-white" fill="currentColor" />
            </span>
            <span className="font-display font-600 tracking-tight">Admin Console</span>
          </div>
          <Button variant="outline" data-testid="logout-btn" onClick={doLogout} className="rounded-sm border-border hover:border-destructive hover:text-destructive">
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden mb-10">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card p-5" data-testid={`stat-${s.label.toLowerCase()}`}>
              <s.icon size={24} className="text-red mb-3" />
              <p className="font-display font-600 text-2xl font-mono">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="bg-card border border-border rounded-sm p-1">
            <TabsTrigger value="products" data-testid="tab-products" className="rounded-sm font-mono uppercase text-xs data-[state=active]:bg-red data-[state=active]:text-white">Products</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders" className="rounded-sm font-mono uppercase text-xs data-[state=active]:bg-red data-[state=active]:text-white">Orders</TabsTrigger>
            <TabsTrigger value="sellers" data-testid="tab-sellers" className="rounded-sm font-mono uppercase text-xs data-[state=active]:bg-red data-[state=active]:text-white">
              Sellers{stats.pending_sellers > 0 ? ` (${stats.pending_sellers})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers" className="mt-6">
            <h2 className="font-display font-500 text-xl mb-5">Seller applications</h2>
            {sellers.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center font-mono" data-testid="sellers-empty">No sellers yet.</p>
            ) : (
              <div className="rounded-sm border border-border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-secondary text-muted-foreground uppercase text-xs tracking-widest font-mono">
                    <tr>
                      <th className="text-left p-4">Store</th>
                      <th className="text-left p-4 hidden md:table-cell">Email</th>
                      <th className="text-left p-4">Listings</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((s) => (
                      <tr key={s.id} className="border-t border-border" data-testid={`seller-row-${s.id}`}>
                        <td className="p-4">
                          <p className="font-medium">{s.store_name}</p>
                          <p className="text-xs text-muted-foreground">{s.name}</p>
                        </td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground font-mono">{s.email}</td>
                        <td className="p-4 font-mono">{s.products}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-sm font-mono uppercase border ${s.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/30" : s.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-red/10 text-red border-red/30"}`}>{s.status}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {s.status !== "approved" && (
                              <button data-testid={`approve-${s.id}`} onClick={() => setSellerStatus(s.id, "approved")} className="h-8 px-3 rounded-sm border border-green-500/40 text-green-400 flex items-center gap-1 hover:bg-green-500/10 transition-colors text-xs font-semibold">
                                <Check size={14} /> Approve
                              </button>
                            )}
                            {s.status !== "rejected" && (
                              <button data-testid={`reject-${s.id}`} onClick={() => setSellerStatus(s.id, "rejected")} className="h-8 px-3 rounded-sm border border-border text-muted-foreground flex items-center gap-1 hover:border-destructive hover:text-destructive transition-colors text-xs font-semibold">
                                <X size={14} /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display font-500 text-xl">Manage products</h2>
              <Button onClick={openNew} data-testid="add-product-btn" className="rounded-sm bg-primary hover:bg-primary/90 text-white font-bold">
                <Plus size={16} className="mr-1" /> Add product
              </Button>
            </div>
            <div className="rounded-sm border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-secondary text-muted-foreground uppercase text-xs tracking-widest font-mono">
                  <tr>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4 hidden md:table-cell">Category</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4 hidden md:table-cell">Stock</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-border" data-testid={`admin-product-${p.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="w-10 h-10 rounded-sm object-cover border border-border" />
                          <span className="font-medium line-clamp-1 max-w-[220px]">{p.title}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground font-mono">{p.category}</td>
                      <td className="p-4 font-medium font-mono">{money(p.price)}</td>
                      <td className="p-4 hidden md:table-cell font-mono">{p.stock}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button data-testid={`edit-${p.id}`} onClick={() => openEdit(p)} className="w-8 h-8 rounded-sm border border-border flex items-center justify-center hover:border-red hover:text-red transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button data-testid={`delete-${p.id}`} onClick={() => del(p.id)} className="w-8 h-8 rounded-sm border border-border flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <h2 className="font-display font-500 text-xl mb-5">Recent orders</h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center font-mono" data-testid="orders-empty">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-sm border border-border bg-card p-5" data-testid={`order-${o.id}`}>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <p className="font-semibold">{o.customer_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{o.customer_email} · {o.contact}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-600 text-lg font-mono">{money(o.total)}</p>
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-red/10 text-red border border-red/30 font-mono uppercase">{o.status}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {o.items?.map((it, idx) => (<span key={idx}>{it.quantity}× {it.title}{idx < o.items.length - 1 ? ", " : ""}</span>))}
                    </div>
                    {o.note && <p className="text-xs text-muted-foreground mt-2 italic">"{o.note}"</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto rounded-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-500">{editing ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Title</Label>
              <Input data-testid="form-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-input border-border rounded-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="form-category" className="bg-input border-border rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger data-testid="form-tier" className="bg-input border-border rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Price ($)</Label>
                <Input data-testid="form-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-input border-border rounded-sm" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Original price ($)</Label>
                <Input data-testid="form-original" type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="bg-input border-border rounded-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Stock</Label>
                <Input data-testid="form-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="bg-input border-border rounded-sm" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Delivery</Label>
                <Input data-testid="form-delivery" value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })} className="bg-input border-border rounded-sm" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Image URL</Label>
              <Input data-testid="form-image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" className="bg-input border-border rounded-sm" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Description</Label>
              <Textarea data-testid="form-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-input border-border rounded-sm" />
            </div>
            <div className="flex items-center gap-3">
              <Switch data-testid="form-featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label className="text-sm">Featured product</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} data-testid="save-product-btn" className="rounded-sm bg-primary hover:bg-primary/90 text-white font-bold w-full">
              {editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
