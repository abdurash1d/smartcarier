"use client";

/**
 * =============================================================================
 * SMARTCAREER AI - Login Page (Client)
 * =============================================================================
 *
 * This file intentionally stays client-side because it uses hooks like
 * `useSearchParams()` and interacts with browser APIs.
 */

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const registered = searchParams.get("registered") === "true";
  const redirectTo = searchParams.get("redirect");

  const { login, isLoading, error, clearError } = useAuth();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  watch("email"); // keeps the form controlled; used by some UI patterns

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login({ email: data.email, password: data.password }, redirectTo || undefined);
      setIsSuccess(true);
    } catch {
      // Error is already stored in state
    }
  };

  const handleGoogleOAuth = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
    window.location.href = `${backendOrigin}/api/v1/auth/oauth/google?redirect=true`;
  };

  const handleLinkedInOAuth = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
    window.location.href = `${backendOrigin}/api/v1/auth/oauth/linkedin?redirect=true`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full max-w-md">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 text-center"
      >
        <h1 className="font-display text-3xl font-bold text-surface-900">{t("auth.login.title")}</h1>
        <p className="mt-2 text-surface-500">{t("auth.login.subtitle")}</p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence mode="wait">
        {sessionExpired && (
          <motion.div
            key="session-expired"
            {...fadeIn}
            className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{t("auth.login.sessionExpired")}</p>
          </motion.div>
        )}

        {registered && (
          <motion.div
            key="registered"
            {...fadeIn}
            className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p>{t("auth.login.registered")}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            {...fadeIn}
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={cn(
                "flex h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm transition-all",
                "placeholder:text-surface-400",
                "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                errors.email ? "border-red-300 focus:ring-red-500" : "border-surface-300 hover:border-surface-400"
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <motion.p {...fadeIn} className="text-sm text-red-600">
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.login.password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                "flex h-12 w-full rounded-xl border bg-white pl-10 pr-12 text-sm transition-all",
                "placeholder:text-surface-400",
                "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                errors.password ? "border-red-300 focus:ring-red-500" : "border-surface-300 hover:border-surface-400"
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <motion.p {...fadeIn} className="text-sm text-red-600">
              {errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-surface-600">
            <input type="checkbox" className="h-4 w-4 rounded border-surface-300" {...register("rememberMe")} />
            {t("auth.login.rememberMe")}
          </label>
          <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          size="lg"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {isSuccess ? t("auth.login.success") : t("auth.login.button")}
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Social */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs text-surface-500">{t("auth.login.orContinue")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={handleGoogleOAuth}>
            Google
          </Button>
          <Button type="button" variant="outline" onClick={handleLinkedInOAuth}>
            LinkedIn
          </Button>
        </div>

        <p className="text-center text-sm text-surface-600">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="font-medium text-purple-600 hover:text-purple-700">
            {t("auth.login.signUp")}
          </Link>
        </p>
      </motion.form>
    </motion.div>
  );
}

