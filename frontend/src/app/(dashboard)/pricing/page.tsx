"use client";

/**
 * =============================================================================
 * PRICING PAGE
 * =============================================================================
 * 
 * Premium subscription pricing and plans
 */

import { useState, useEffect } from "react";
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface PricingPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: string[];
  notIncluded?: string[];
  popular?: boolean;
  icon: any;
  color: string;
}

// =============================================================================
// PRICING DATA
// =============================================================================

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Perfect for trying out SmartCareer AI",
    features: [
      "1 AI-generated resume",
      "5 job applications/month",
      "Basic job matching",
      "Email support",
    ],
    notIncluded: [
      "Unlimited AI generations",
      "Auto-apply feature",
      "Priority support",
      "Analytics dashboard",
    ],
    icon: Sparkles,
    color: "bg-gray-500",
  },
  {
    id: "premium",
    name: "Premium",
    price: {
      monthly: 4,
      yearly: 40,
    },
    description: "For serious job seekers and students",
    features: [
      "Unlimited AI resume generation",
      "50 job applications/month",
      "Auto-apply to matching jobs",
      "Priority job matching",
      "Advanced analytics dashboard",
      "Premium resume templates",
      "Priority email support",
    ],
    popular: true,
    icon: Zap,
    color: "bg-brand-500",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: {
      monthly: 0,  // Custom
      yearly: 0,   // Custom
    },
    description: "For teams and organizations",
    features: [
      "Everything in Premium",
      "Unlimited job applications",
      "Team management (up to 50 users)",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "24/7 priority support",
      "SLA guarantee",
      "Custom integrations",
    ],
    icon: Crown,
    color: "bg-purple-500",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe");
      router.push("/login?redirect=/pricing");
      return;
    }

    if (planId === "free") {
      toast.info("You're already on the free plan!");
      return;
    }

    if (planId === "enterprise") {
      // Redirect to contact page
      router.push("/contact");
      return;
    }

    // Redirect to checkout
    router.push(`/checkout?plan=${planId}&cycle=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-brand-50/20 dark:from-surface-950 dark:to-surface-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-2xl mx-auto">
            Unlock the full power of AI-driven career tools. Start free, upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white dark:bg-surface-800 rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-brand-500 text-white"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-brand-500 text-white"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;
            const isCurrentPlan = user?.subscription_tier === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "border-2 border-brand-500 shadow-xl"
                    : "border border-surface-200 dark:border-surface-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${plan.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-surface-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.id === "enterprise" ? (
                      <div className="text-4xl font-bold text-surface-900 dark:text-white">
                        Custom
                      </div>
                    ) : (
                      <div>
                        <span className="text-5xl font-bold text-surface-900 dark:text-white">
                          ${price}
                        </span>
                        <span className="text-surface-600 dark:text-surface-400 ml-2">
                          /{billingCycle === "monthly" ? "mo" : "yr"}
                        </span>
                        {billingCycle === "yearly" && plan.id !== "free" && (
                          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Save ${plan.price.monthly * 12 - plan.price.yearly}/year
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || loading}
                    variant={plan.popular ? "gradient" : "outline"}
                    className="w-full mb-6"
                    size="lg"
                  >
                    {isCurrentPlan ? (
                      "Current Plan"
                    ) : plan.id === "enterprise" ? (
                      "Contact Sales"
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-surface-700 dark:text-surface-300">
                          {feature}
                        </span>
                      </div>
                    ))}

                    {plan.notIncluded && plan.notIncluded.length > 0 && (
                      <>
                        <div className="border-t border-surface-200 dark:border-surface-700 my-4" />
                        {plan.notIncluded.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3 opacity-50">
                            <X className="h-5 w-5 text-surface-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-surface-600 dark:text-surface-400">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            All plans include access to our AI-powered tools and regular updates.
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-500">
            Need help choosing? <a href="/contact" className="text-brand-500 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}
