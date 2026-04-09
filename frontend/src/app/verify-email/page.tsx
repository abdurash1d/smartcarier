import { Suspense } from "react";
import VerifyEmailPageClient from "./page.client";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-surface-500">Loading...</div>
      }
    >
      <VerifyEmailPageClient />
    </Suspense>
  );
}

