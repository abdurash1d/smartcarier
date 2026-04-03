/**
 * Forgot Password Page
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestPasswordReset } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(data.email);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Check your email</h1>
        <p className="mt-3 text-surface-500">
          We've sent a password reset link to{" "}
          <strong className="text-surface-700">{getValues("email")}</strong>
        </p>
        <p className="mt-4 text-sm text-surface-400">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            onClick={() => setIsSuccess(false)}
            className="font-medium text-brand-600 hover:text-brand-500"
          >
            try again
          </button>
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-surface-900">Forgot your password?</h1>
        <p className="mt-2 text-surface-500">
          No worries! Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-5 w-5" />}
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Send reset link
        </Button>
      </form>

      {/* Back to login */}
      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}















