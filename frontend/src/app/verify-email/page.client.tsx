"use client";

/**
 * Email Verification Page (Client)
 * Verifies user email address via token in query params.
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";

export default function VerifyEmailPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      void verifyEmail();
    } else {
      setStatus("error");
      setMessage("No verification token provided");
    }
    // token must be included so it reacts if user re-opens with a different token
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      setStatus("success");
      setMessage(response.data.message || "Email verified successfully!");

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.response?.data?.detail || "Verification failed. Token may be invalid or expired.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 to-brand-50/20 dark:from-surface-950 dark:to-surface-900 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full p-8 text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 mx-auto animate-spin text-brand-500" />
            <h2 className="text-2xl font-bold">Verifying Email...</h2>
            <p className="text-surface-600 dark:text-surface-400">
              Please wait while we verify your email address
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="bg-green-100 dark:bg-green-950 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Email Verified!</h2>
            <p className="text-surface-700 dark:text-surface-300">{message}</p>
            <p className="text-sm text-surface-500">Redirecting to login...</p>
            <Link href="/login">
              <Button variant="gradient" size="lg" className="mt-4">
                Go to Login
              </Button>
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-100 dark:bg-red-950 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Verification Failed</h2>
            <p className="text-surface-700 dark:text-surface-300">{message}</p>
            <div className="flex flex-col gap-2 mt-4">
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Register Again
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

