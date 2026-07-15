import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api, money } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle, MessageCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { DISCORD_INVITE_URL } from "@/constants/config";

const MAX_ATTEMPTS = 8;

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const provider = params.get("provider");
  const { clear } = useCart();
  const { user } = useAuth();
  const [state, setState] = useState("checking");
  const [orderId, setOrderId] = useState(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (provider === "paypal" && params.get("paid") === "1") {
      if (!cleared.current) { clear(); cleared.current = true; }
      setState("paid");
      return;
    }
    if (!sessionId) {
      setState("failed");
      return;
    }
    let attempts = 0;
    let timer;

    const poll = async () => {
      try {
        const { data } = await api.get(`/checkout/status/${sessionId}`);
        if (data.payment_status === "paid") {
          if (!cleared.current) { clear(); cleared.current = true; }
          if (data.order_id) setOrderId(data.order_id);
          setState("paid");
          return;
        }
        if (data.status === "expired") {
          setState("failed");
          return;
        }
      } catch {}
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) { setState("timeout"); return; }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="pt-28 pb-20 text-center min-h-screen px-6" data-testid="checkout-success-page">
      {state === "checking" && (
        <div className="pt-20" data-testid="status-checking">
          <Loader2 size={56} className="mx-auto text-amber mb-6 animate-spin" />
          <h2 className="font-display font-700 text-3xl mb-3">Confirming payment</h2>
          <p className="text-muted-foreground">Verifying your transaction with Stripe.</p>
        </div>
      )}

      {state === "paid" && (
        <div className="pt-12" data-testid="status-paid">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <span className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <CheckCircle2 size={48} className="text-green-400" />
            </span>
          </motion.div>
          <h2 className="font-display font-700 text-3xl mb-2">Payment successful!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-1">
            Thank you for your purchase. Your digital goods will be delivered to your contact shortly.
          </p>
          {orderId && (
            <p className="text-sm text-amber/80 font-mono mb-6">Order #{orderId.slice(-8)}</p>
          )}

          <div className="max-w-sm mx-auto rounded-xl border border-amber/10 bg-card p-5 mb-8 text-left">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Package size={15} className="text-amber" /> What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">1. We process your order within minutes</li>
              <li className="flex gap-2">2. Delivery sent to your contact (email/Discord)</li>
              <li className="flex gap-2">3. Join our Discord for 24/7 support</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user && (
              <Link to="/orders">
                <Button className="rounded-lg bg-amber/20 border border-amber/30 text-amber hover:bg-amber/30 font-semibold">
                  <Package size={16} /> View Orders
                </Button>
              </Link>
            )}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
              <Button className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-semibold">
                <MessageCircle size={16} /> Join Discord
              </Button>
            </a>
            <Link to="/products">
              <Button className="rounded-lg bg-amber text-black hover:bg-amber/90 font-bold">
                <ShoppingBag size={16} /> Continue Shopping <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {(state === "failed" || state === "timeout") && (
        <div className="pt-20" data-testid="status-failed">
          <XCircle size={64} className="mx-auto text-destructive mb-6" />
          <h2 className="font-display font-600 text-3xl mb-3">
            {state === "timeout" ? "Still processing" : "Payment not completed"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            {state === "timeout"
              ? "If you were charged, your order will be delivered. Check your email or contact support."
              : "Your payment was not completed. You can try again from your cart."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/cart"><Button className="rounded-lg bg-amber text-black hover:bg-amber/90 font-bold">Back to Cart</Button></Link>
            {state === "timeout" && (
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer"><Button className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold">Get Support</Button></a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
