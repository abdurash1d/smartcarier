"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
  Building2,
  Download,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationApi, resumeApi } from "@/lib/api";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import type { Application } from "@/types/api";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  reviewing: { label: "Ko'rib chiqilmoqda", color: "bg-blue-100 text-blue-700", icon: Eye },
  interview: { label: "Intervyu", color: "bg-purple-100 text-purple-700", icon: User },
  accepted: { label: "Qabul qilindi", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rad etildi", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function ApplicantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setIsLoading(true);
        const res = await applicationApi.get(appId);
        setApplication(res.data?.data || res.data);
      } catch {
        setError("Ariza topilmadi.");
      } finally {
        setIsLoading(false);
      }
    };
    if (appId) fetchApplication();
  }, [appId]);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await applicationApi.updateStatus(appId, newStatus);
      setApplication((prev) => prev ? { ...prev, status: newStatus as any } : prev);
      toast.success(`Holat "${statusConfig[newStatus]?.label}" ga o'zgartirildi.`);
    } catch {
      toast.error("Holatni o'zgartirishda xatolik.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <h2 className="mt-4 text-xl font-bold">{error || "Ariza topilmadi"}</h2>
        <Button className="mt-6" onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>
      </div>
    );
  }

  const applicant = application.applicant;
  const resume = application.resume;
  const job = application.job;
  const status = statusConfig[application.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-surface-600">
          <ArrowLeft className="h-4 w-4" />
          Arizalarga qaytish
        </Button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Applicant Info */}
        <div className="space-y-4">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-3xl font-bold text-white">
              {(applicant?.full_name || "A")[0].toUpperCase()}
            </div>
            <h2 className="mt-3 text-lg font-bold text-surface-900">
              {applicant?.full_name || "Noma'lum"}
            </h2>
            <p className="text-sm text-surface-500">{applicant?.email || "—"}</p>

            <div className="mt-4 space-y-2 text-left text-sm">
              {applicant?.phone && (
                <div className="flex items-center gap-2 text-surface-600">
                  <Phone className="h-4 w-4 text-surface-400" />
                  {applicant.phone}
                </div>
              )}
              {applicant?.location && (
                <div className="flex items-center gap-2 text-surface-600">
                  <MapPin className="h-4 w-4 text-surface-400" />
                  {applicant.location}
                </div>
              )}
            </div>

            <Badge className={cn("mt-4", status.color)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </motion.div>

          {/* Status Change */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
          >
            <h3 className="mb-3 font-semibold text-surface-900">Holat o'zgartirish</h3>
            <div className="space-y-2">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    disabled={isUpdating || application.status === key}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl p-2.5 text-sm font-medium transition-all",
                      application.status === key
                        ? cn("cursor-default", cfg.color)
                        : "hover:bg-surface-50 text-surface-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {cfg.label}
                    {application.status === key && (
                      <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Job Info */}
          {job && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-3 font-semibold text-surface-900">Ish e'loni</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-surface-900">{job.title}</p>
                  <p className="text-sm text-surface-500">{formatDate(application.applied_at)} da ariza berilgan</p>
                </div>
                <Link href={`/company/jobs`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Ko'rish
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-surface-900">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                Cover Letter
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap">
                {application.cover_letter}
              </p>
            </motion.div>
          )}

          {/* Resume */}
          {resume && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-surface-900">
                <FileText className="h-5 w-5 text-purple-500" />
                Resume
              </h3>

              {/* Personal Info */}
              {resume.content?.personal_info && (
                <div className="mb-4">
                  <p className="text-base font-bold text-surface-900">
                    {resume.content.personal_info.professional_title}
                  </p>
                </div>
              )}

              {/* Skills */}
              {resume.content?.skills?.technical && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-400">
                    Texnik ko'nikmalar
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.content.skills.technical.map((s) => (
                      <span key={s} className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resume.content?.experience && resume.content.experience.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-400">
                    Ish tajribasi
                  </p>
                  {resume.content.experience.slice(0, 2).map((exp, i) => (
                    <div key={i} className="mb-2 border-l-2 border-purple-200 pl-3">
                      <p className="text-sm font-medium text-surface-900">{exp.position}</p>
                      <p className="text-xs text-surface-500">{exp.company}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {resume.content?.education && resume.content.education.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-400">
                    Ta'lim
                  </p>
                  {resume.content.education.map((edu, i) => (
                    <div key={i} className="border-l-2 border-purple-200 pl-3">
                      <p className="text-sm font-medium text-surface-900">{edu.institution}</p>
                      <p className="text-xs text-surface-500">{edu.degree} — {edu.field}</p>
                    </div>
                  ))}
                </div>
              )}

              {resume.pdf_url && (
                <a href={resume.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="mt-4 w-full">
                    <Download className="mr-2 h-4 w-4" />
                    PDF ko'chirish
                  </Button>
                </a>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
