/**
 * Admin Dashboard
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { adminApi, getErrorMessage } from "@/lib/api";
import type {
  AdminDashboardData,
  AdminErrorLog,
  AdminErrorStats,
  AdminSystemHealthResponse,
  AdminUserStats,
} from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatRelativeTime } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

type LoadedData = {
  dashboard: AdminDashboardData | null;
  health: AdminSystemHealthResponse | null;
  userStats: AdminUserStats | null;
  errorStats: AdminErrorStats | null;
  errors: AdminErrorLog[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

const sectionIds = { overview: "overview", health: "health", users: "users", errors: "errors" } as const;

const healthIconMap: Record<string, React.ElementType> = {
  database: Database,
  ai_service: Sparkles,
  email_service: Server,
  error_rate: AlertTriangle,
  memory: Shield,
};

function healthClass(status?: string) {
  const s = (status || "warning").toLowerCase();
  if (s === "healthy") return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300";
  if (s === "unhealthy") return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
}

function healthIcon(status?: string) {
  const s = (status || "warning").toLowerCase();
  if (s === "healthy") return CheckCircle2;
  if (s === "unhealthy") return XCircle;
  return AlertTriangle;
}

function MetricCard({ title, value, subtitle, icon: Icon, accent, trend }: { title: string; value: string | number; subtitle: string; icon: React.ElementType; accent: string; trend?: string; }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-surface-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-surface-500">{subtitle}</p>
            {trend && <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-200"><TrendingUp className="h-3.5 w-3.5" />{trend}</p>}
          </div>
          <div className={cn("rounded-2xl p-3", accent)}><Icon className="h-6 w-6" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string; }) {
  return <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-bold text-surface-900 dark:text-white">{title}</h2><p className="mt-2 text-sm text-surface-500">{description}</p></div>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<LoadedData>({ dashboard: null, health: null, userStats: null, errorStats: null, errors: [] });
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<AdminErrorLog | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadAdminData = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoadState("loading");
    setLoadError(null);

    try {
      const [dashboardResult, healthResult, usersResult, statsResult, errorsResult] = await Promise.allSettled([
        adminApi.dashboard(),
        adminApi.systemHealth(),
        adminApi.userStats(),
        adminApi.errorStats(24),
        adminApi.errors({ limit: 10, resolved: false }),
      ]);

      const nextData: LoadedData = { dashboard: null, health: null, userStats: null, errorStats: null, errors: [] };
      if (dashboardResult.status === "fulfilled") nextData.dashboard = dashboardResult.value.data.dashboard;
      if (healthResult.status === "fulfilled") nextData.health = healthResult.value.data;
      if (usersResult.status === "fulfilled") nextData.userStats = usersResult.value.data.stats;
      if (statsResult.status === "fulfilled") nextData.errorStats = statsResult.value.data.stats;
      if (errorsResult.status === "fulfilled") nextData.errors = errorsResult.value.data.errors;
      if (!nextData.errors.length && nextData.dashboard?.errors.recent?.length) nextData.errors = nextData.dashboard.errors.recent;
      setData(nextData);

      const failedCount = [dashboardResult, healthResult, usersResult, statsResult, errorsResult].filter((r) => r.status === "rejected").length;
      if (failedCount > 0) setLoadError("Ba'zi admin endpointlari javob bermadi, lekin qolgan ma'lumotlar yuklandi.");
      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      setLoadError(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadAdminData(); }, []);

  const overviewCards = useMemo(() => [
    {
      title: "Total users",
      value: data.dashboard?.overview.total_users ?? 0,
      subtitle: "Platformadagi jami foydalanuvchilar",
      icon: Users,
      accent: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
      trend: data.userStats ? `${data.userStats.users.active_last_7_days} active / 7d` : undefined,
    },
    {
      title: "New users today",
      value: data.dashboard?.overview.new_users_today ?? 0,
      subtitle: "Bugun ro'yxatdan o'tganlar",
      icon: UserCheck,
      accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    },
    {
      title: "Jobs / resumes / applications",
      value: data.dashboard ? `${data.dashboard.overview.total_jobs} / ${data.dashboard.overview.total_resumes} / ${data.dashboard.overview.total_applications}` : "0 / 0 / 0",
      subtitle: "Kontent hajmi",
      icon: BarChart3,
      accent: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    },
    {
      title: "Errors last 24h",
      value: data.dashboard?.errors.total_24h ?? data.errorStats?.total_errors ?? 0,
      subtitle: "Monitoring signali",
      icon: AlertTriangle,
      accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    },
  ], [data.dashboard, data.errorStats, data.userStats]);

  const healthItems = useMemo(() => {
    if (!data.health?.components) return [];
    return Object.entries(data.health.components).map(([key, details]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      details,
      icon: healthIconMap[key] || Shield,
    }));
  }, [data.health]);

  const severityEntries = useMemo(() => Object.entries(data.errorStats?.errors_by_severity || {}).sort((a, b) => b[1] - a[1]), [data.errorStats]);
  const categoryEntries = useMemo(() => Object.entries(data.errorStats?.errors_by_category || {}).sort((a, b) => b[1] - a[1]), [data.errorStats]);

  const openResolveDialog = (errorItem: AdminErrorLog) => {
    setSelectedError(errorItem);
    setResolutionNotes(errorItem.resolution_notes || "");
  };

  const handleResolve = async () => {
    if (!selectedError) return;
    setResolving(true);
    try {
      await adminApi.resolveError(selectedError.id, { resolution_notes: resolutionNotes.trim() || undefined });
      setSelectedError(null);
      setResolutionNotes("");
      await loadAdminData(true);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setResolving(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.section variants={itemVariants} className="overflow-hidden rounded-[2rem] border border-surface-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))] p-6 text-white shadow-2xl dark:border-surface-700 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur"><Shield className="h-3.5 w-3.5" />Admin control center</div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Platformani kuzating, xatolarni tez bartaraf qiling va foydalanuvchi faolligini boshqaring</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">Bu panel backend admin endpointlariga ulanadi va real vaqtda platformaning holati, foydalanuvchilar soni hamda xatolar statistikasi haqida ma&apos;lumot beradi.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void loadAdminData(true)} className="border-white/20 bg-white/10 text-white hover:bg-white/15"><RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />Refresh data</Button>
            <Link href="#errors"><Button className="bg-white text-slate-900 hover:bg-slate-100">Jump to errors<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </motion.section>

      {loadError && <motion.div variants={itemVariants}><Card className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"><CardContent className="flex items-center gap-3 p-4 text-amber-900 dark:text-amber-100"><AlertTriangle className="h-5 w-5 flex-shrink-0" /><p className="text-sm">{loadError}</p></CardContent></Card></motion.div>}

      <motion.section variants={itemVariants} id={sectionIds.overview} className="space-y-4 scroll-mt-24">
          <SectionTitle eyebrow="Overview" title="Asosiy ko'rsatkichlar" description="Eng muhim KPI&apos;lar bitta ekranda. Bu yerda siz platforma umumiy holatini tez baholaysiz." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loadState === "loading" ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />) : overviewCards.map((card) => <MetricCard key={card.title} title={card.title} value={card.value} subtitle={card.subtitle} icon={card.icon} accent={card.accent} trend={card.trend} />)}
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <motion.section variants={itemVariants} id={sectionIds.health} className="space-y-4 scroll-mt-24">
          <SectionTitle eyebrow="Health" title="System health" description="Backend sog'ligi, AI va email servislarining konfiguratsiyasi, hamda error rate holati." />
          <div className="grid gap-4 md:grid-cols-2">
            {loadState === "loading" ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32 rounded-2xl" />
              ))
            ) : (
              healthItems.map((item) => {
                const CategoryIcon = item.icon;
                const StatusIcon = healthIcon(item.details.status);
                const badge = healthClass(item.details.status);

                return (
                  <Card key={item.key}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-surface-500" />
                            <p className="text-sm font-medium text-surface-500">{item.label}</p>
                          </div>
                          <p className="mt-2 text-lg font-semibold text-surface-900 dark:text-white">
                            {String(item.details.status)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-surface-500">
                            {Object.entries(item.details)
                              .filter(([key]) => key !== "status")
                              .slice(0, 3)
                              .map(([key, value]) => (
                                <span
                                  key={key}
                                  className="rounded-full bg-surface-100 px-2 py-1 dark:bg-surface-700"
                                >
                                  {key.replace(/_/g, " ")}: {String(value)}
                                </span>
                              ))}
                          </div>
                        </div>
                        <div className={cn("rounded-2xl p-3", badge)}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} id={sectionIds.users} className="space-y-4 scroll-mt-24">
          <SectionTitle eyebrow="Users" title="Foydalanuvchi statistikasi" description="Ro&apos;l bo&apos;yicha taqsimot, aktivlik va yangi ro&apos;yxatdan o&apos;tganlar ko&apos;rsatkichlari." />
          <Card>
            <CardHeader><CardTitle className="text-lg">User breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loadState === "loading" ? <div className="space-y-3"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div> : (<>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-50 p-4 dark:bg-surface-900/60"><p className="text-xs uppercase tracking-wide text-surface-500">Active 7d</p><p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">{data.userStats?.users.active_last_7_days ?? 0}</p></div>
                  <div className="rounded-2xl bg-surface-50 p-4 dark:bg-surface-900/60"><p className="text-xs uppercase tracking-wide text-surface-500">Verified</p><p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">{data.userStats?.users.verified ?? 0}</p></div>
                </div>
                <div className="space-y-3">
                  {Object.entries(data.userStats?.users.by_role || {}).map(([role, value]) => {
                    const total = data.userStats?.users.total || 1;
                    const percent = Math.max(6, Math.round((value / total) * 100));
                    return (
                      <div key={role} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm"><span className="font-medium text-surface-700 dark:text-surface-200">{role}</span><span className="text-surface-500">{value}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-500" style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-dashed border-surface-200 p-4 dark:border-surface-700">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">Content totals</p>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-surface-500">Resumes</p><p className="font-semibold text-surface-900 dark:text-white">{data.userStats?.content.total_resumes ?? 0}</p></div>
                    <div><p className="text-surface-500">Jobs</p><p className="font-semibold text-surface-900 dark:text-white">{data.userStats?.content.total_jobs ?? 0}</p></div>
                    <div><p className="text-surface-500">Applications</p><p className="font-semibold text-surface-900 dark:text-white">{data.userStats?.content.total_applications ?? 0}</p></div>
                  </div>
                </div>
              </>)}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <motion.section variants={itemVariants} id={sectionIds.errors} className="space-y-4 scroll-mt-24">
        <SectionTitle eyebrow="Errors" title="Error monitoring and resolution" description="So'nggi errorlar, severity taqsimoti va resolve action bilan ishlash." />
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div><CardTitle className="text-lg">Recent unresolved errors</CardTitle><p className="text-sm text-surface-500">Resolve tugmasi orqali muammoni yopishingiz mumkin.</p></div>
              <Badge variant="warning">{data.dashboard?.errors.total_24h ?? data.errorStats?.total_errors ?? 0} / 24h</Badge>
            </CardHeader>
            <CardContent>
              {loadState === "loading" ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div> : data.errors.length === 0 ? <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-12 text-center dark:border-surface-700"><CheckCircle2 className="h-10 w-10 text-green-600" /><p className="mt-3 font-medium text-surface-900 dark:text-white">Hech qanday unresolved error topilmadi</p><p className="mt-1 text-sm text-surface-500">Hozircha monitoring paneli toza.</p></div> : (
                <div className="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-700">
                  <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:border-surface-700 dark:bg-surface-900/60">
                    <span>Time</span><span>Error</span><span>Severity</span><span>Endpoint</span><span>Action</span>
                  </div>
                  <div className="divide-y divide-surface-200 dark:divide-surface-700">
                    {data.errors.map((errorItem) => (
                      <div key={errorItem.id} className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-sm">
                        <div><p className="font-medium text-surface-900 dark:text-white">{formatRelativeTime(errorItem.timestamp)}</p><p className="mt-1 text-xs text-surface-500">{errorItem.category}</p></div>
                        <div className="min-w-0"><p className="truncate font-medium text-surface-900 dark:text-white">{errorItem.error_type}</p><p className="mt-1 max-h-10 overflow-hidden text-xs text-surface-500">{errorItem.error_message}</p></div>
                        <div><Badge variant={errorItem.severity === "critical" ? "error" : errorItem.severity === "warning" ? "warning" : "secondary"}>{errorItem.severity}</Badge></div>
                        <div className="min-w-0 text-surface-500"><p className="truncate">{errorItem.endpoint || errorItem.path || "Unknown"}</p><p className="mt-1 text-xs">{errorItem.method || "-"}</p></div>
                        <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => openResolveDialog(errorItem)}>Resolve</Button><Badge variant={errorItem.resolved ? "success" : "warning"}>{errorItem.resolved ? "Resolved" : "Open"}</Badge></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Severity breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {loadState === "loading" ? <div className="space-y-3"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /></div> : severityEntries.length > 0 ? severityEntries.map(([severity, value]) => { const max = severityEntries[0]?.[1] || 1; const percent = Math.round((value / max) * 100); return <div key={severity} className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="font-medium text-surface-700 dark:text-surface-200">{severity}</span><span className="text-surface-500">{value}</span></div><div className="h-2 rounded-full bg-surface-100 dark:bg-surface-700"><div className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${percent}%` }} /></div></div>; }) : <p className="text-sm text-surface-500">Severity statistikasi hozircha yo&apos;q.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Top categories</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loadState === "loading" ? <div className="space-y-3"><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /></div> : categoryEntries.length > 0 ? categoryEntries.slice(0, 5).map(([category, value]) => <div key={category} className="flex items-center justify-between rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-900/60"><span className="font-medium text-surface-700 dark:text-surface-200">{category}</span><Badge variant="secondary">{value}</Badge></div>) : <p className="text-sm text-surface-500">Category statistikasi mavjud emas.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      <Dialog open={!!selectedError} onOpenChange={(open) => !open && setSelectedError(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error resolve</DialogTitle>
            <DialogDescription>{selectedError ? `${selectedError.error_type} - ${selectedError.category}` : "Selected error"}</DialogDescription>
          </DialogHeader>
          {selectedError && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-900/60"><p className="text-xs uppercase tracking-wide text-surface-500">Message</p><p className="mt-1 text-sm text-surface-900 dark:text-white">{selectedError.error_message}</p></div><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-900/60"><p className="text-xs uppercase tracking-wide text-surface-500">Endpoint</p><p className="mt-1 text-sm text-surface-900 dark:text-white">{selectedError.endpoint || selectedError.path || "-"}</p></div></div><div className="space-y-2"><p className="text-sm font-medium text-surface-900 dark:text-white">Resolution notes</p><Textarea value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} placeholder="What was fixed? Add context for the team." rows={5} /></div></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedError(null)} disabled={resolving}>Cancel</Button>
            <Button onClick={() => void handleResolve()} disabled={resolving}>{resolving ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Resolving</> : "Mark as resolved"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
