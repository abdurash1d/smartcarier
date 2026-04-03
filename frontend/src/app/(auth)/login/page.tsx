/**
 * =============================================================================
 * SMARTCAREER AI - Login Page
 * =============================================================================
 *
 * Features:
 * - Email + Password authentication
 * - "Remember me" checkbox
 * - "Forgot password?" link
 * - Social login buttons (Google, LinkedIn)
 * - Form validation with react-hook-form + zod
 * - Loading states
 * - Error messages
 */

"use client";

import { Suspense, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LoginPage() {
  // `useSearchParams()` requires a Suspense boundary during prerender/static export.
  // Wrapping keeps `next build` from failing while still allowing client-side query usage.
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md p-6 text-center text-surface-500">
          Loading...
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
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

  const email = watch("email");

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(
        { email: data.email, password: data.password },
        redirectTo || undefined
      );
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-md"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 text-center"
      >
        <h1 className="font-display text-3xl font-bold text-surface-900">
          {t("auth.login.title")}
        </h1>
        <p className="mt-2 text-surface-500">
          {t("auth.login.subtitle")}
        </p>
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
                errors.email
                  ? "border-red-300 focus:ring-red-500"
                  : "border-surface-300 hover:border-surface-400"
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
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
                errors.password
                  ? "border-red-300 focus:ring-red-500"
                  : "border-surface-300 hover:border-surface-400"
              )}
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <motion.p {...fadeIn} className="text-sm text-red-600">
              {errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 rounded border-surface-300 text-purple-600 focus:ring-purple-500"
            {...register("rememberMe")}
          />
          <Label htmlFor="rememberMe" className="text-sm text-surface-600 cursor-pointer">
            {t("auth.login.rememberMe")}
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t("auth.login.signingIn")}
            </>
          ) : (
            <>
              {t("auth.login.signIn")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </motion.form>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative my-8"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-surface-500">{t("auth.login.orContinueWith")}</span>
        </div>
      </motion.div>

      {/* Social Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleOAuth}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-surface-200 bg-white font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={handleLinkedInOAuth}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-surface-200 bg-white font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50"
        >
          <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          LinkedIn
        </button>
      </motion.div>

      {/* Sign up link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-surface-500"
      >
        {t("auth.login.noAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
        >
          {t("auth.login.createAccount")}
        </Link>
      </motion.p>

      {/* Demo credentials hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 rounded-xl bg-surface-50 p-4 text-center text-sm text-surface-500"
      >
        <p className="font-medium text-surface-700">{t("auth.login.demo")}</p>
        <p>demo@smartcareer.uz • demo123</p>
      </motion.div>
    </motion.div>
  );
}
