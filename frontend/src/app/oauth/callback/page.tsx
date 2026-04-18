"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function parseParams(input: string, prefix: "#" | "?" = "#"): Record<string, string> {
  const clean = input.startsWith(prefix) ? input.slice(1) : input;
  const params = new URLSearchParams(clean);
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function readOAuthParams(): Record<string, string> {
  return {
    ...parseParams(window.location.hash, "#"),
    ...parseParams(window.location.search, "?"),
  };
}

function isUserLike(value: unknown): value is User {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const hasEmail = typeof record.email === "string";
  const hasIdentity =
    typeof record.full_name === "string" ||
    typeof record.role === "string" ||
    typeof record.id === "string";

  return hasEmail && hasIdentity;
}

function extractUser(payload: unknown): User | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const data = record.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    if (isUserLike(nested.user)) {
      return nested.user;
    }
  }

  if (isUserLike(record.user)) {
    return record.user;
  }

  if (isUserLike(record)) {
    return record;
  }

  return null;
}

function getRoleRoot(role?: string | null) {
  return role === "company" ? "/company" : role === "admin" ? "/admin" : "/student";
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const { access_token, refresh_token } = readOAuthParams();

        if (!access_token || !refresh_token) {
          setError("OAuth callback missing tokens. Please try again.");
          return;
        }

        useAuthStore.getState().setTokens(access_token, refresh_token);

        // Clear tokens from the URL no matter which transport was used.
        window.history.replaceState({}, document.title, "/oauth/callback");

        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load profile after OAuth");
        }

        const payload = await res.json();
        const user = extractUser(payload);

        if (!user) {
          throw new Error("OAuth profile payload is invalid");
        }

        useAuthStore.getState().setUser(user);

        router.replace(getRoleRoot(user.role));
      } catch (e: any) {
        setError(e?.message || "OAuth login failed");
      }
    };

    run();
  }, [router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-xl font-semibold">OAuth Login Failed</h1>
        <p className="mt-2 text-sm text-surface-600">{error}</p>
        <button
          className="mt-6 rounded-lg bg-purple-600 px-4 py-2 text-white"
          onClick={() => router.replace("/login")}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">Signing you in...</h1>
      <p className="mt-2 text-sm text-surface-600">Completing OAuth login and loading your profile.</p>
    </div>
  );
}
