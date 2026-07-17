import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, money } from "@/lib/api";
import { Package, Loader2, ArrowLeft } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders")
      .then((r) => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Loader2 size={32} className="text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
        <ArrowLeft size={15} /> Back to home
      </Link>

      <div className="flex items-center gap-3 mb-10">
        <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Package size={20} className="text-primary" />
        </span>
        <h1 className="font-display font-800 text-3xl tracking-tight">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground mb-6">No orders yet.</p>
          <Link to="/products" className="inline-flex items-center px-5 h-10 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-colors">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-primary/10 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(-8)}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${order.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                {order.items?.map((item, j) => (
                  <div key={j} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.title} <span className="text-muted-foreground">x{item.quantity}</span></span>
                    <span className="text-primary font-semibold">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border text-sm">
                <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="font-bold text-primary">{money(order.total)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
