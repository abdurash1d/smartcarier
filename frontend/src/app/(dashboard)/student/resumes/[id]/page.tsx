"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Download,
  FolderOpen,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { resumeApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Resume } from "@/types/api";
import { toast } from "sonner";
import { ResumePreview } from "@/components/resume/ResumePreview";

const statusConfig = {
  draft: { label: "Qoralama", color: "bg-surface-100 text-surface-600" },
  published: { label: "Nashr etilgan", color: "bg-green-100 text-green-700" },
  archived: { label: "Arxivlangan", color: "bg-surface-200 text-surface-500" },
};

function sanitizeFilename(value: string) {
  return (value || "resume").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params!.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true);
        const res = await resumeApi.get(resumeId);
        setResume(res.data?.data || res.data);
      } catch {
        setError("Resume topilmadi yoki xatolik yuz berdi.");
      } finally {
        setIsLoading(false);
      }
    };
    if (resumeId) fetchResume();
  }, [resumeId]);

  const handleDownload = async () => {
    if (!resume) return;
    setIsDownloading(true);
    try {
      const res = await resumeApi.download(resumeId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${sanitizeFilename(resume.title)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Resume yuklab olindi!");
    } catch {
      toast.error("PDF yuklab olishda xatolik yuz berdi.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="rounded-2xl border p-8">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="mt-2 h-5 w-1/3" />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <h2 className="mt-4 text-xl font-bold">{error || "Resume topilmadi"}</h2>
        <Button className="mt-6" onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>
      </div>
    );
  }

  const status = statusConfig[resume.status] || statusConfig.draft;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Back + Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-surface-600">
          <ArrowLeft className="h-4 w-4" />
          Resumelarga qaytish
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF yuklash
          </Button>
          <Link href={`/student/resumes/${resumeId}/edit`}>
            <Button className="bg-gradient-to-r from-purple-500 to-indigo-600">
              <Edit className="mr-2 h-4 w-4" />
              Tahrirlash
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Resume Meta */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            {resume.ai_generated ? (
              <Sparkles className="h-5 w-5 text-purple-600" />
            ) : (
              <FolderOpen className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-surface-900">{resume.title}</h1>
            <p className="text-xs text-surface-500">
              {resume.ai_generated ? "AI bilan yaratilgan" : "Qo'lda yaratilgan"} ·{" "}
              {formatRelativeTime(resume.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {resume.ats_score && (
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{resume.ats_score}%</div>
              <div className="text-xs text-surface-500">ATS ball</div>
            </div>
          )}
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </motion.div>

      {/* Resume Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-[28px] border border-surface-200 bg-white shadow-xl"
      >
        <ResumePreview content={resume.content} title={resume.title} />
      </motion.div>
    </div>
  );
}
