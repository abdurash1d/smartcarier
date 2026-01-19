"use client";

/**
 * =============================================================================
 * CHECKOUT PAGE
 * =============================================================================
 * 
 * Payment checkout for premium subscriptions
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Wallet, 
  CreditCard, 
  ArrowLeft, 
  Check, 
  Shield,
  Zap,
  Crown
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type PaymentMethod = "stripe" | "payme";
type BillingCycle = "monthly" | "yearly";

interface PriceInfo {
  usd: number;
  uzs: number;
}

// =============================================================================
// PRICING DATA
// =============================================================================

const PRICES: Record<BillingCycle, PriceInfo> = {
  monthly: { usd: 4, uzs: 1000000 },
  yearly: { usd: 40, uzs: 10000000 },
};

const FEATURES = [
  "Unlimited AI resume generation",
  "Unlimited university search",
  "Unlimited motivation letters",
  "50 job applications/month",
  "Auto-apply to matching jobs",
  "Advanced analytics dashboard",
  "Premium resume templates",
  "Priority email support",
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");

  const plan = searchParams.get("plan") || "premium";
  const cycle = (searchParams.get("cycle") || "monthly") as BillingCycle;

  const price = PRICES[cycle];

  // Redirect if not authenticated
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
        // Create Stripe payment intent
        const response = await api.post("/payments/create-payment-intent", {
          subscription_tier: plan,
          subscription_months: cycle === "monthly" ? 1 : 12,
        });

        const { client_secret } = response.data;

        // TODO: Integrate Stripe Elements here
        // For now, show success message
        toast.success("Payment initiated! Redirecting to Stripe...");
        
        // In production, redirect to Stripe Checkout or use Stripe Elements
        console.log("Stripe client secret:", client_secret);
        
      } else if (paymentMethod === "payme") {
        // Payme integration (coming soon)
        toast.info("Payme integration coming soon!");
        
        // When implemented:
        // const response = await api.post("/payments/create-payme-payment", {
        //   subscription_tier: plan,
        //   subscription_months: cycle === "monthly" ? 1 : 12,
        // });
        // window.location.href = response.data.payment_url;
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(
        error.response?.data?.detail || "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-brand-50/20 dark:from-surface-950 dark:to-surface-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pricing
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-500 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Order Summary</h2>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Upgrade to Premium
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-surface-600 dark:text-surface-400">
                    Plan:
                  </span>
                  <span className="font-semibold capitalize">{plan}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-surface-600 dark:text-surface-400">
                    Billing:
                  </span>
                  <span className="font-semibold capitalize">{cycle}</span>
                </div>

                {cycle === "yearly" && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      🎉 You save ${PRICES.monthly.usd * 12 - PRICES.yearly.usd} per year!
                    </p>
                  </div>
                )}

                <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <div className="text-right">
                      <div>${price.usd}</div>
                      <div className="text-sm text-surface-600 dark:text-surface-400 font-normal">
                        {price.uzs.toLocaleString()} so'm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* What's Included */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">What's Included</h3>
              <div className="space-y-3">
                {FEATURES.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Payment Method */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

              <div className="space-y-4">
                {/* Stripe */}
                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === "stripe"
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
                      : "border-surface-200 dark:border-surface-700 hover:border-brand-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      paymentMethod === "stripe" 
                        ? "bg-brand-500" 
                        : "bg-surface-200 dark:bg-surface-700"
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        paymentMethod === "stripe"
                          ? "text-white"
                          : "text-surface-600 dark:text-surface-400"
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Credit Card</div>
                      <div className="text-sm text-surface-600 dark:text-surface-400">
                        Visa, Mastercard, American Express
                      </div>
                    </div>
                    {paymentMethod === "stripe" && (
                      <div className="text-brand-500">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Payme - Coming Soon */}
                <button
                  disabled
                  className="w-full p-4 rounded-lg border-2 border-surface-200 dark:border-surface-700 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface-200 dark:bg-surface-700">
                      <Wallet className="h-5 w-5 text-surface-600 dark:text-surface-400" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold">Payme</div>
                      <div className="text-sm text-surface-600 dark:text-surface-400">
                        Coming Soon - Uzcard, Humo
                      </div>
                    </div>
                  </div>
                </button>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  variant="gradient"
                  size="lg"
                  className="w-full mt-6"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span>
                        Pay ${price.usd} / {price.uzs.toLocaleString()} so'm
                      </span>
                    </div>
                  )}
                </Button>

                <p className="text-xs text-center text-surface-500 dark:text-surface-400 mt-4">
                  🔒 Secure payment. Your data is encrypted and protected. Cancel anytime.
                </p>
              </div>
            </Card>

            {/* Money-back Guarantee */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">
                    30-Day Money-Back Guarantee
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Not satisfied? Get a full refund within 30 days, no questions asked.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
