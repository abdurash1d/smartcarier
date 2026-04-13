/**
 * Admin Access Management Page
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, RefreshCw, Shield, Users } from "lucide-react";
import { adminApi, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AdminAccessRole, AdminAccessUser, AdminRoleMatrixItem } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

const ADMIN_ROLE_OPTIONS: Array<{ value: AdminAccessRole; label: string; tone: string }> = [
  { value: "super_admin", label: "Super Admin", tone: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
  { value: "operations_admin", label: "Operations Admin", tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  { value: "finance_admin", label: "Finance Admin", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  { value: "security_admin", label: "Security Admin", tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  { value: "support_agent", label: "Support Agent", tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
];

const FALLBACK_MATRIX: AdminRoleMatrixItem[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    sections: [
      { key: "users", label: "Users", permissions: [{ key: "manage_users", label: "Manage users" }, { key: "change_admin_roles", label: "Change admin roles" }] },
      { key: "content", label: "Content", permissions: [{ key: "moderate_jobs", label: "Moderate jobs" }, { key: "moderate_companies", label: "Moderate companies" }] },
      { key: "system", label: "System", permissions: [{ key: "manage_settings", label: "Manage global settings" }, { key: "view_audit_logs", label: "View audit logs" }] },
    ],
  },
  {
    role: "operations_admin",
    label: "Operations Admin",
    sections: [
      { key: "users", label: "Users", permissions: [{ key: "support_users", label: "Support and verify users" }] },
      { key: "content", label: "Content", permissions: [{ key: "moderate_jobs", label: "Moderate jobs and applications" }] },
    ],
  },
  {
    role: "finance_admin",
    label: "Finance Admin",
    sections: [
      { key: "billing", label: "Billing", permissions: [{ key: "view_payments", label: "View payments" }, { key: "process_refunds", label: "Process refunds" }] },
    ],
  },
  {
    role: "security_admin",
    label: "Security Admin",
    sections: [
      { key: "security", label: "Security", permissions: [{ key: "review_risk_alerts", label: "Review risk alerts" }, { key: "revoke_sessions", label: "Revoke sessions" }] },
    ],
  },
  {
    role: "support_agent",
    label: "Support Agent",
    sections: [
      { key: "support", label: "Support", permissions: [{ key: "view_tickets", label: "View user tickets" }, { key: "assist_users", label: "Assist users" }] },
    ],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAdminRole(value: unknown): AdminAccessRole | null {
  if (typeof value !== "string") return null;
  if (ADMIN_ROLE_OPTIONS.some((option) => option.value === value)) {
    return value as AdminAccessRole;
  }
  return null;
}

function getRoleLabel(role?: AdminAccessRole | null): string {
  const matched = ADMIN_ROLE_OPTIONS.find((option) => option.value === role);
  return matched?.label || "Support Agent";
}

function getRoleTone(role?: AdminAccessRole | null): string {
  return ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.tone || "bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-200";
}

function parseMatrix(data: unknown): AdminRoleMatrixItem[] {
  if (!isRecord(data)) return FALLBACK_MATRIX;
  const source = isRecord(data.data) ? data.data : data;
  const raw = source.matrix;
  if (!Array.isArray(raw) || raw.length === 0) {
    // Backend contract returns { roles: { role_name: [permission,...] } }.
    const roles = isRecord(source.roles) ? source.roles : null;
    if (!roles) {
      return FALLBACK_MATRIX;
    }

    const mapped = Object.entries(roles)
      .filter(([, permissions]) => Array.isArray(permissions))
      .map(([role, permissions]) => {
        const roleName = normalizeAdminRole(role);
        const label = ADMIN_ROLE_OPTIONS.find((item) => item.value === roleName)?.label || role;
        return {
          role: roleName || "support_agent",
          label,
          sections: [
            {
              key: "permissions",
              label: "Permissions",
              permissions: (permissions as unknown[]).map((permission) => ({
                key: String(permission),
                label: String(permission),
              })),
            },
          ],
        } satisfies AdminRoleMatrixItem;
      });

    return mapped.length > 0 ? mapped : FALLBACK_MATRIX;
  }

  const parsed: AdminRoleMatrixItem[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.role !== "string" || typeof item.label !== "string") {
      continue;
    }

    const sections: AdminRoleMatrixItem["sections"] = [];
    if (Array.isArray(item.sections)) {
      for (const section of item.sections) {
        if (!isRecord(section) || typeof section.key !== "string" || typeof section.label !== "string") {
          continue;
        }

        const permissions: Array<{ key: string; label: string; description?: string }> = [];
        if (Array.isArray(section.permissions)) {
          for (const permission of section.permissions) {
            if (!isRecord(permission) || typeof permission.key !== "string" || typeof permission.label !== "string") {
              continue;
            }
            permissions.push({
              key: permission.key,
              label: permission.label,
              description: typeof permission.description === "string" ? permission.description : undefined,
            });
          }
        }

        sections.push({ key: section.key, label: section.label, permissions });
      }
    }

    parsed.push({
      role: item.role as AdminAccessRole,
      label: item.label,
      sections,
    });
  }

  return parsed.length > 0 ? parsed : FALLBACK_MATRIX;
}

function parseUsers(data: unknown): AdminAccessUser[] {
  if (!isRecord(data)) return [];
  const source = isRecord(data.data) ? data.data : data;
  if (!Array.isArray(source.users)) return [];

  const parsed: AdminAccessUser[] = [];
  for (const user of source.users) {
    if (!isRecord(user)) continue;
    const id = typeof user.id === "string" ? user.id : typeof user.user_id === "string" ? user.user_id : null;
    if (!id || typeof user.email !== "string") continue;

    const roleValue =
      typeof user.role === "string" ? (user.role as AdminAccessUser["role"]) : "admin";
    const fullName =
      typeof user.full_name === "string" && user.full_name.trim().length > 0
        ? user.full_name
        : user.email;
    const adminRoleValue = normalizeAdminRole(user.admin_role);

    parsed.push({
      id,
      email: user.email,
      full_name: fullName,
      role: roleValue,
      admin_role: adminRoleValue,
      is_active:
        typeof user.is_active === "boolean"
          ? user.is_active
          : typeof user.is_active_account === "boolean"
          ? user.is_active_account
          : true,
      is_verified: user.is_verified === true,
      created_at: typeof user.created_at === "string" ? user.created_at : undefined,
      last_login:
        typeof user.last_login === "string"
          ? user.last_login
          : typeof user.last_login_at === "string"
          ? user.last_login_at
          : null,
    });
  }

  return parsed;
}

export default function AdminAccessPage() {
  const { user } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<AdminRoleMatrixItem[]>(FALLBACK_MATRIX);
  const [adminUsers, setAdminUsers] = useState<AdminAccessUser[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminAccessRole>>({});

  const effectiveCurrentUserRole = user?.admin_role ?? (user?.role === "admin" ? "super_admin" : null);
  const canManageRoles = effectiveCurrentUserRole === "super_admin";

  const loadAccessData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoadState("loading");
    }
    setLoadError(null);
    setStatusMessage(null);

    try {
      const [matrixResult, usersResult] = await Promise.allSettled([adminApi.roleMatrix(), adminApi.adminUsers()]);

      let errors = 0;
      if (matrixResult.status === "fulfilled") {
        setMatrix(parseMatrix(matrixResult.value.data));
      } else {
        errors += 1;
      }

      if (usersResult.status === "fulfilled") {
        const users = parseUsers(usersResult.value.data);
        setAdminUsers(users);
        setRoleDrafts(
          users.reduce<Record<string, AdminAccessRole>>((acc, item) => {
            acc[item.id] = item.admin_role || "support_agent";
            return acc;
          }, {})
        );
      } else {
        errors += 1;
      }

      if (errors > 0) {
        setLoadError("Ba'zi access endpointlari javob bermadi. Qolgan ma'lumotlar yuklandi.");
      }

      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      setLoadError(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAccessData();
  }, []);

  const sortedUsers = useMemo(
    () =>
      [...adminUsers].sort((a, b) => {
        if ((a.admin_role || "") === "super_admin" && (b.admin_role || "") !== "super_admin") return -1;
        if ((a.admin_role || "") !== "super_admin" && (b.admin_role || "") === "super_admin") return 1;
        return a.full_name.localeCompare(b.full_name);
      }),
    [adminUsers]
  );

  const updateRole = async (userId: string) => {
    if (!canManageRoles || !roleDrafts[userId]) return;
    setSavingId(userId);
    setLoadError(null);
    setStatusMessage(null);

    try {
      const response = await adminApi.updateAdminRole(userId, { admin_role: roleDrafts[userId] });
      const payload = response.data;
      const updatedRole = normalizeAdminRole(payload.user?.admin_role) || normalizeAdminRole(payload.data?.admin_role) || roleDrafts[userId];
      setAdminUsers((prev) =>
        prev.map((item) =>
          item.id === userId
            ? {
                ...item,
                admin_role: updatedRole,
              }
            : item
        )
      );
      setStatusMessage("Admin role muvaffaqiyatli yangilandi.");
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-surface-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.9))] p-6 text-white shadow-2xl dark:border-surface-700 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
              <Shield className="h-3.5 w-3.5" />
              Access governance
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Admin ruxsatlari va rollarni markazlashgan boshqaruv</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">Role matrix va admin foydalanuvchilarni shu yerdan boshqarasiz. `super_admin` bo'lsa role'larni real API orqali yangilash mumkin.</p>
          </div>
          <Button variant="outline" onClick={() => void loadAccessData(true)} className="border-white/20 bg-white/10 text-white hover:bg-white/15">
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh data
          </Button>
        </div>
      </section>

      {loadError && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardContent className="flex items-center gap-3 p-4 text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{loadError}</p>
          </CardContent>
        </Card>
      )}

      {statusMessage && (
        <Card className="border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10">
          <CardContent className="flex items-center gap-3 p-4 text-green-900 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{statusMessage}</p>
          </CardContent>
        </Card>
      )}

      {!canManageRoles && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10">
          <CardContent className="flex items-center gap-3 p-4 text-blue-900 dark:text-blue-100">
            <KeyRound className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Sizning admin rolingiz `{effectiveCurrentUserRole || "not_set"}`. Role o'zgartirish faqat `super_admin` uchun ochiq.</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-500" />
          <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white">Role matrix</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {loadState === "loading"
            ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)
            : matrix.map((item) => (
                <Card key={item.role} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{item.label}</span>
                      <Badge className={getRoleTone(item.role)}>{item.role}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.sections.length === 0 ? (
                      <p className="text-sm text-surface-500">Permissions mavjud emas.</p>
                    ) : (
                      item.sections.map((section) => (
                        <div key={`${item.role}-${section.key}`} className="space-y-2 rounded-xl border border-surface-200 p-3 dark:border-surface-700">
                          <p className="text-sm font-semibold text-surface-900 dark:text-white">{section.label}</p>
                          <div className="space-y-1.5">
                            {section.permissions.map((permission) => (
                              <p key={permission.key} className="text-sm text-surface-600 dark:text-surface-300">
                                - {permission.label}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-500" />
          <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white">Admin users</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin access list</CardTitle>
          </CardHeader>
          <CardContent>
            {loadState === "loading" ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : sortedUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-200 py-12 text-center dark:border-surface-700">
                <p className="text-sm text-surface-500">Admin userlar topilmadi yoki endpoint hali yoqilmagan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedUsers.map((adminUser) => {
                  const selectedRole = roleDrafts[adminUser.id] || adminUser.admin_role || "support_agent";
                  const hasChanges = selectedRole !== (adminUser.admin_role || "support_agent");
                  const isSaving = savingId === adminUser.id;

                  return (
                    <div
                      key={adminUser.id}
                      className="grid gap-3 rounded-2xl border border-surface-200 p-4 dark:border-surface-700 lg:grid-cols-[1.4fr_0.8fr_1fr_auto]"
                    >
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-white">{adminUser.full_name}</p>
                        <p className="text-sm text-surface-500">{adminUser.email}</p>
                        <p className="mt-1 text-xs text-surface-500">
                          Last login: {adminUser.last_login ? formatRelativeTime(adminUser.last_login) : "No recent activity"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={adminUser.is_active ? "success" : "secondary"}>{adminUser.is_active ? "Active" : "Inactive"}</Badge>
                        <Badge variant={adminUser.is_verified ? "success" : "warning"}>{adminUser.is_verified ? "Verified" : "Unverified"}</Badge>
                      </div>
                      <Select
                        value={selectedRole}
                        disabled={!canManageRoles || isSaving}
                        onValueChange={(value) =>
                          setRoleDrafts((prev) => ({
                            ...prev,
                            [adminUser.id]: value as AdminAccessRole,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select admin role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_ROLE_OPTIONS.map((option) => (
                            <SelectItem key={`${adminUser.id}-${option.value}`} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-end gap-2">
                        <Badge className={getRoleTone(adminUser.admin_role)}>{getRoleLabel(adminUser.admin_role)}</Badge>
                        <Button disabled={!canManageRoles || !hasChanges || isSaving} onClick={() => void updateRole(adminUser.id)}>
                          {isSaving ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Saving</> : "Update"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
