/**
 * =============================================================================
 * AUTH STORE - Zustand State Management
 * =============================================================================
 *
 * Handles authentication state:
 * - User data
 * - Tokens (access + refresh)
 * - Login/Logout actions
 * - Auth status
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { User } from "@/types/api";

// =============================================================================
// API CONFIG
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error?.message === "string") return data.error.message;
    return `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: "student" | "company";
  company_name?: string;
  company_website?: string;
}

// =============================================================================
// STORE
// =============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user
      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),

      // Set tokens
      setTokens: (accessToken, refreshToken) =>
        set((state) => {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
        }),

      // Login
      login: async (email, password) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            const msg = await parseApiError(res);
            throw new Error(msg);
          }

          const data = await res.json();

          set((state) => {
            state.user = data.user;
            state.accessToken = data.access_token;
            state.refreshToken = data.refresh_token;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message || "Login failed";
          });
          throw error;
        }
      },

      // Register
      register: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const msg = await parseApiError(res);
            throw new Error(msg);
          }

          const resp = await res.json();

          set((state) => {
            state.user = resp.user;
            state.accessToken = resp.access_token;
            state.refreshToken = resp.refresh_token;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message || "Registration failed";
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        const { accessToken, refreshToken } = get();
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Best-effort server logout (token blacklist). Even if it fails,
          // we still clear local state.
          if (accessToken) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
          }
        } catch {
          // ignore
        } finally {
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
          });
        }
      },

      // Refresh access token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!res.ok) {
            const msg = await parseApiError(res);
            throw new Error(msg);
          }

          const data = await res.json();

          set((state) => {
            state.user = data.user;
            state.accessToken = data.access_token;
            state.refreshToken = data.refresh_token;
            state.isAuthenticated = true;
          });

          return data.access_token as string;
        } catch (error) {
          // If refresh fails, logout
          await get().logout();
          return null;
        }
      },

      // Update profile
      updateProfile: async (data) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const { accessToken } = get();
          if (!accessToken) throw new Error("Not authenticated");

          const res = await fetch(`${API_BASE_URL}/users/me`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const msg = await parseApiError(res);
            throw new Error(msg);
          }

          const updated = await res.json();

          // Backend may return {success, user} or raw user; handle both
          const user = updated.user ?? updated;

          set((state) => {
            state.user = user;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message || "Update failed";
          });
          throw error;
        }
      },

      // Clear error
      clearError: () =>
        set((state) => {
          state.error = null;
        }),
    })),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectAccessToken = (state: AuthState) => state.accessToken;
