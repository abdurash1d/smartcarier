"use client";

/**
 * Checkout page is client-side because it reads query params (`useSearchParams`)
 * and interacts with browser navigation & toasts.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Wallet, CreditCard, ArrowLeft, Check, Shield, Zap } from "lucide-react";

type PaymentMethod = "stripe" | "payme";
type BillingCycle = "monthly" | "yearly";

interface PriceInfo {
  usd: number;
  uzs: number;
}

const PRICES: Record<BillingCycle, PriceInfo> = {
  monthly: { usd: 4, uzs: 1000000 },
  yearly: { usd: 40, uzs: 10000000 },
};

const FEATURES = [
  "Unlimited AI resume generation",
  "50 job applications/month",
  "Auto-apply to matching jobs",
  "Advanced analytics dashboard",
  "Premium resume templates",
  "Priority email support",
];

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");

  const plan = searchParams.get("plan") || "premium";
  const cycle = (searchParams.get("cycle") || "monthly") as BillingCycle;
  const price = PRICES[cycle];

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (paymentMethod === "stripe") {
        const response = await api.post("/payments/create-payment-intent", {
          subscription_tier: plan,
          subscription_months: cycle === "monthly" ? 1 : 12,
        });

        const { client_secret } = response.data;
        toast.success("Payment initiated! Redirecting to Stripe...");
        // TODO: Integrate Stripe Elements / Checkout
        console.log("Stripe client secret:", client_secret);
      } else {
        toast.info("Payme integration is coming soon");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-brand-50/20 dark:from-surface-950 dark:to-surface-900 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <h1 className="text-2xl font-bold mb-2">Checkout</h1>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              Complete your subscription and unlock premium features.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-medium capitalize">{plan} plan</p>
                  <p className="text-sm text-surface-500 capitalize">{cycle} billing</p>
                </div>
                <p className="text-xl font-bold">${price.usd}</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Payment Method</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className={[
                      "rounded-xl border p-4 text-left transition",
                      paymentMethod === "stripe"
                        ? "border-brand-500 ring-2 ring-brand-200"
                        : "border-surface-200 hover:border-surface-300",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-sm text-surface-500">Card payment</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("payme")}
                    className={[
                      "rounded-xl border p-4 text-left transition",
                      paymentMethod === "payme"
                        ? "border-brand-500 ring-2 ring-brand-200"
                        : "border-surface-200 hover:border-surface-300",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="font-medium">Payme</p>
                        <p className="text-sm text-surface-500">Coming soon</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Button onClick={handlePayment} disabled={loading} variant="gradient" size="lg" className="w-full">
                {loading ? "Processing..." : "Pay now"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">What you get</h2>
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-300">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3 text-sm text-surface-600 dark:text-surface-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Instant activation</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

