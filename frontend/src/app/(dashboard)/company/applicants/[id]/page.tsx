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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationApi } from "@/lib/api";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import type { Application, KnownApplicationStatus } from "@/types/api";
import { toast } from "sonner";

type InterviewFormat = "video" | "phone" | "in-person";

const statusConfig: Record<KnownApplicationStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  reviewing: { label: "Ko'rib chiqilmoqda", color: "bg-blue-100 text-blue-700", icon: Eye },
  shortlisted: { label: "Saralangan", color: "bg-amber-100 text-amber-700", icon: Award },
  interview: { label: "Intervyu", color: "bg-purple-100 text-purple-700", icon: User },
  accepted: { label: "Qabul qilindi", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rad etildi", color: "bg-red-100 text-red-700", icon: XCircle },
  withdrawn: { label: "Bekor qilingan", color: "bg-surface-100 text-surface-600", icon: XCircle },
};

const statusActions: KnownApplicationStatus[] = [
  "pending",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
];

const interviewFormatLabels: Record<
  InterviewFormat,
  { label: string; helper: string }
> = {
  video: {
    label: "Video",
    helper: "Zoom, Meet yoki boshqa online havola ishlatiladi.",
  },
  phone: {
    label: "Phone",
    helper: "Telefon orqali intervyu uchun havola kerak emas.",
  },
  "in-person": {
    label: "In-person",
    helper: "Ofis yoki boshqa manzilda uchrashuv belgilanadi.",
  },
};

function toDatetimeLocalValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ApplicantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [interviewFormat, setInterviewFormat] = useState<InterviewFormat>("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

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

  useEffect(() => {
    setInterviewDateTime(toDatetimeLocalValue(application?.interview_at));
    setInterviewFormat((application?.interview_type as InterviewFormat) || "video");
    setMeetingLink(application?.meeting_link || "");
    setInterviewNotes(application?.notes || "");
  }, [
    application?.id,
    application?.interview_at,
    application?.interview_type,
    application?.meeting_link,
    application?.notes,
  ]);

  const handleStatusChange = async (newStatus: KnownApplicationStatus) => {
    setIsUpdating(true);
    try {
      const response = await applicationApi.updateStatus(appId, { status: newStatus });
      const updatedApplication = response.data?.data || response.data;
      setApplication((prev) =>
        updatedApplication
          ? { ...prev, ...updatedApplication }
          : prev
      );
      toast.success(`Holat "${statusConfig[newStatus]?.label}" ga o'zgartirildi.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Holatni o'zgartirishda xatolik.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInterviewSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!interviewDateTime) {
      toast.error("Intervyu sana va vaqtini kiriting.");
      return;
    }

    const interviewAt = new Date(interviewDateTime);
    if (Number.isNaN(interviewAt.getTime())) {
      toast.error("Intervyu sanasi noto'g'ri.");
      return;
    }

    setIsUpdating(true);
    try {
      const normalizedMeetingLink = meetingLink.trim();
      const payload = {
        status: "interview" as const,
        interview_at: interviewAt.toISOString(),
        interview_type: interviewFormat,
        meeting_link: interviewFormat === "video" && normalizedMeetingLink ? normalizedMeetingLink : undefined,
        notes: interviewNotes.trim() || undefined,
      };

      const response = await applicationApi.updateStatus(appId, payload);
      const updatedApplication = response.data?.data || response.data;
      setApplication((prev) =>
        updatedApplication
          ? { ...prev, ...updatedApplication }
          : prev
      );
      setInterviewDateTime(toDatetimeLocalValue(updatedApplication?.interview_at || payload.interview_at));
      setInterviewFormat((updatedApplication?.interview_type as InterviewFormat) || interviewFormat);
      setMeetingLink(updatedApplication?.meeting_link || payload.meeting_link || "");
      setInterviewNotes(updatedApplication?.notes || payload.notes || "");
      toast.success("Intervyu muvaffaqiyatli belgilandi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Intervyuni belgilashda xatolik.");
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
  const status = statusConfig[application.status as KnownApplicationStatus] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isVideoInterview = interviewFormat === "video";

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
              {statusActions.map((key) => {
                const cfg = statusConfig[key];
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
          {/* Interview scheduling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-surface-900">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Intervyu jadvali
                </h3>
                <p className="mt-1 text-sm text-surface-500">
                  Intervyu statusi faqat sana, vaqt va ixtiyoriy izoh bilan belgilanishi kerak.
                </p>
              </div>
              {application.status === "interview" && (
                <Badge className="bg-purple-100 text-purple-700">Intervyu faol</Badge>
              )}
            </div>

            {application.interview_at && (
              <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm text-surface-700">
                <p className="font-medium text-surface-900">Joriy intervyu vaqti</p>
                <p className="mt-1">{formatDate(application.interview_at)}</p>
                <p className="mt-1">
                  Format: {application.interview_type ? interviewFormatLabels[application.interview_type as InterviewFormat]?.label || application.interview_type : "Belgilanmagan"}
                </p>
                {application.meeting_link && (
                  <p className="mt-1 break-all">
                    Havola:{" "}
                    <a
                      href={application.meeting_link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-purple-700 hover:underline"
                    >
                      {application.meeting_link}
                    </a>
                  </p>
                )}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleInterviewSchedule}>
              <div className="space-y-2">
                <Label htmlFor="interview-at">Sana va vaqt</Label>
                <Input
                  id="interview-at"
                  type="datetime-local"
                  step="60"
                  value={interviewDateTime}
                  onChange={(event) => setInterviewDateTime(event.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interview-format">Intervyu formati</Label>
                <select
                  id="interview-format"
                  value={interviewFormat}
                  onChange={(event) => {
                    const nextValue = event.target.value as InterviewFormat;
                    setInterviewFormat(nextValue);
                    if (nextValue !== "video") {
                      setMeetingLink("");
                    }
                  }}
                  disabled={isUpdating}
                  className={cn(
                    "flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm",
                    "focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  )}
                >
                  {Object.entries(interviewFormatLabels).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-surface-500">
                  {interviewFormatLabels[interviewFormat].helper}
                </p>
              </div>

              {isVideoInterview && (
                <div className="space-y-2">
                  <Label htmlFor="meeting-link">Meeting link</Label>
                  <Input
                    id="meeting-link"
                    type="url"
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                    placeholder="https://..."
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-surface-500">
                    Video intervyu uchun tavsiya etiladi.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="interview-notes">Izoh</Label>
                <Textarea
                  id="interview-notes"
                  value={interviewNotes}
                  onChange={(event) => setInterviewNotes(event.target.value)}
                  placeholder="Masalan: Zoom link, panel tarkibi yoki qo'shimcha ko'rsatmalar"
                  disabled={isUpdating}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={isUpdating || !interviewDateTime}
                  className="min-w-[180px]"
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="mr-2 h-4 w-4" />
                  )}
                  {application.status === "interview" ? "Intervyuni yangilash" : "Intervyuni belgilash"}
                </Button>
                <p className="text-sm text-surface-500">
                  Bu forma statusni avtomatik ravishda <span className="font-medium text-surface-700">interview</span> ga o'tkazadi va formatni saqlaydi.
                </p>
              </div>
            </form>
          </motion.div>

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
