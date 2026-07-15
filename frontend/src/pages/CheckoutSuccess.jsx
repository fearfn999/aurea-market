import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const MAX_ATTEMPTS = 8;

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const provider = params.get("provider");
  const { clear } = useCart();
  const [state, setState] = useState("checking"); // checking | paid | failed | timeout
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
          if (!cleared.current) {
            clear();
            cleared.current = true;
          }
          setState("paid");
          return;
        }
        if (data.status === "expired") {
          setState("failed");
          return;
        }
      } catch {
        // ignore and retry
      }
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        setState("timeout");
        return;
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="pt-40 pb-20 text-center min-h-screen px-6" data-testid="checkout-success-page">
      {state === "checking" && (
        <div data-testid="status-checking">
          <Loader2 size={64} className="mx-auto text-red mb-6 animate-spin" />
          <h2 className="font-display font-600 text-3xl mb-3">Confirming payment…</h2>
          <p className="text-muted-foreground font-mono">Hang tight, verifying with Stripe.</p>
        </div>
      )}

      {state === "paid" && (
        <div data-testid="status-paid">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <CheckCircle2 size={72} className="mx-auto text-red mb-6" />
          </motion.div>
          <h2 className="font-display font-600 text-3xl mb-3">Payment successful!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Thank you for your purchase. Your digital goods will be delivered to your contact shortly — check your email & messages.
          </p>
          <Link to="/products"><Button className="rounded-sm bg-red text-white hover:bg-amber font-bold">Continue shopping</Button></Link>
        </div>
      )}

      {(state === "failed" || state === "timeout") && (
        <div data-testid="status-failed">
          <XCircle size={72} className="mx-auto text-destructive mb-6" />
          <h2 className="font-display font-600 text-3xl mb-3">
            {state === "timeout" ? "Still processing" : "Payment not completed"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            {state === "timeout"
              ? "We couldn't confirm your payment in time. If you were charged, check your email — your order will be delivered."
              : "Your payment was not completed. You can try again from your cart."}
          </p>
          <Link to="/cart"><Button className="rounded-sm bg-red text-white hover:bg-amber font-bold">Back to cart</Button></Link>
        </div>
      )}
    </div>
  );
}
