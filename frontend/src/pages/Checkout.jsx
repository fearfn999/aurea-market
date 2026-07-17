import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCart } from "@/context/CartContext";
import { api, money, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Lock, CreditCard } from "lucide-react";

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

export default function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_email: "", contact: "", note: "" });
  const [method, setMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const formValid = form.customer_name && form.customer_email && form.contact;

  const payStripe = async (e) => {
    e.preventDefault();
    if (!formValid) return toast.error("Please fill in all required fields");
    setSubmitting(true);
    try {
      const { data } = await api.post("/checkout/session", {
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        origin_url: window.location.origin,
      });
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL received");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Failed to start checkout");
      setSubmitting(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="pt-40 text-center min-h-screen">
        <p className="text-muted-foreground mb-6">Your cart is empty.</p>
        <Link to="/products"><Button className="rounded-lg bg-red text-white hover:bg-amber">Browse marketplace</Button></Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-20 min-h-screen">
      <h1 className="font-display font-800 text-4xl tracking-tight mb-10">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5" data-testid="checkout-form">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Delivery Details</p>
          <div>
            <Label className="text-sm mb-2 block">Full name *</Label>
            <Input data-testid="input-name" value={form.customer_name} onChange={set("customer_name")} placeholder="John Doe" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Email *</Label>
            <Input data-testid="input-email" type="email" value={form.customer_email} onChange={set("customer_email")} placeholder="you@email.com" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Discord / Telegram handle *</Label>
            <Input data-testid="input-contact" value={form.contact} onChange={set("contact")} placeholder="@yourhandle" className="h-11 bg-input border-border focus-visible:ring-red rounded-lg" />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Note (optional)</Label>
            <Textarea data-testid="input-note" value={form.note} onChange={set("note")} placeholder="Anything we should know?" className="bg-input border-border focus-visible:ring-red rounded-lg" />
          </div>

          {/* Payment method */}
          <div>
            <Label className="text-sm mb-2 block">Payment method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" data-testid="method-card" onClick={() => setMethod("card")} className={`h-11 rounded-lg border font-semibold text-sm transition-colors ${method === "card" ? "border-red bg-red/10 text-red" : "border-border bg-secondary text-muted-foreground hover:border-red/50"}`}>
                Card (Stripe)
              </button>
              <button type="button" data-testid="method-paypal" onClick={() => setMethod("paypal")} className={`h-11 rounded-lg border font-semibold text-sm transition-colors ${method === "paypal" ? "border-red bg-red/10 text-red" : "border-border bg-secondary text-muted-foreground hover:border-red/50"}`}>
                PayPal
              </button>
            </div>
          </div>

          {method === "card" ? (
            <Button onClick={payStripe} disabled={submitting} data-testid="pay-btn" className="w-full rounded-lg h-12 bg-primary hover:bg-primary/90 text-white font-bold transition-colors active:scale-95">
              <CreditCard size={18} className="mr-2" /> {submitting ? "Redirecting…" : `Pay with card · ${money(total)}`}
            </Button>
          ) : (
            <div data-testid="paypal-container">
              {!formValid && <p className="text-xs text-muted-foreground mb-2">Fill in your details above to enable PayPal.</p>}
              <div className={!formValid ? "opacity-50 pointer-events-none" : ""}>
                <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                    disabled={!formValid}
                    forceReRender={[total, formValid]}
                    createOrder={async () => {
                      const { data } = await api.post("/paypal/order", {
                        ...form,
                        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
                      });
                      return data.order_id;
                    }}
                    onApprove={async (data) => {
                      try {
                        const { data: res } = await api.post(`/paypal/capture/${data.orderID}`);
                        if (res.paid) {
                          clear();
                          navigate("/checkout/success?provider=paypal&paid=1");
                        } else {
                          toast.error("Payment not completed. Please try again.");
                        }
                      } catch (err) {
                        toast.error(formatApiError(err.response?.data?.detail) || "PayPal capture failed");
                      }
                    }}
                    onError={() => toast.error("PayPal error. Please try again.")}
                  />
                </PayPalScriptProvider>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Lock size={12} /> Secure checkout · Test mode
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 h-fit">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-5">Order Summary</p>
          <div className="space-y-4 mb-5">
            {items.map((it) => (
              <div key={it.product_id} className="flex items-center gap-3">
                <img src={it.image} alt={it.title} className="w-12 h-12 rounded-lg object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
                </div>
                <span className="text-sm font-medium">{money(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 flex justify-between items-baseline">
            <span className="font-semibold">Total</span>
            <span className="font-display font-800 text-2xl">{money(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
