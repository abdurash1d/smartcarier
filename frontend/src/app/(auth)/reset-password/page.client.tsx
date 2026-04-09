"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/\d/, "Password must include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPageClient({
  initialToken,
}: {
  initialToken?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: initialToken ?? "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    reset({
      token: initialToken ?? "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [initialToken, reset]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(data.token, data.newPassword);
      setIsSuccess(true);

      setTimeout(() => {
        router.push("/login?password_reset=true");
      }, 1800);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : err.message || "Failed to reset password");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Password updated</h1>
        <p className="mt-3 text-surface-500">
          Your password has been reset successfully. Redirecting you to the login page...
        </p>
        <Link
          href="/login?password_reset=true"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <ShieldCheck className="h-4 w-4" />
          Secure password reset
        </div>
        <h1 className="font-display text-3xl font-bold text-surface-900">Reset your password</h1>
        <p className="text-surface-500">
          Use the token from your email link to create a new password. If the token is missing,
          you can paste it manually below.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!initialToken && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          We could not detect a reset token from the link. Paste the token from your email or
          request a fresh reset link.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="token">Reset token</Label>
          <Input
            id="token"
            type="text"
            placeholder="Paste token from email link"
            icon={<KeyRound className="h-5 w-5" />}
            error={errors.token?.message}
            autoComplete="off"
            {...register("token")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter a strong new password"
              icon={<ShieldCheck className="h-5 w-5" />}
              error={errors.newPassword?.message}
              autoComplete="new-password"
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat the new password"
            icon={<ShieldCheck className="h-5 w-5" />}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-600">
          <p className="font-medium text-surface-800">Password requirements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>At least 8 characters</li>
            <li>At least one uppercase letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one number</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" size="lg" variant="gradient" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting...
            </span>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4 text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-500">
          Need a new reset link?
        </Link>
        <Link href="/login" className="inline-flex items-center gap-2 text-surface-500 hover:text-surface-700">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
