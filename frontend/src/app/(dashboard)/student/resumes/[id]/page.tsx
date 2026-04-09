"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Download,
  Globe,
  Archive,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Languages,
  FolderOpen,
  Sparkles,
  Eye,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { resumeApi } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { Resume } from "@/types/api";
import { toast } from "sonner";

const statusConfig = {
  draft: { label: "Qoralama", color: "bg-surface-100 text-surface-600" },
  published: { label: "Nashr etilgan", color: "bg-green-100 text-green-700" },
  archived: { label: "Arxivlangan", color: "bg-surface-200 text-surface-500" },
};

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
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${resume.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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

  const c = resume.content;
  const pi = c?.personal_info;
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
        className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm"
      >
        {/* Resume Header */}
        <div className="border-b-4 border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 p-8">
          <h2 className="text-3xl font-bold text-surface-900">
            {pi?.name || resume.title}
          </h2>
          {pi?.professional_title && (
            <p className="mt-1 text-xl text-purple-600">{pi.professional_title}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-surface-600">
            {pi?.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" /> {pi.email}
              </span>
            )}
            {pi?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> {pi.phone}
              </span>
            )}
            {pi?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {pi.location}
              </span>
            )}
            {pi?.linkedin_url && (
              <a
                href={pi.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {pi?.portfolio_url && (
              <a
                href={pi.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> Portfolio
              </a>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Summary */}
          {c?.summary && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
                <div className="h-6 w-1 rounded-full bg-purple-500" />
                Qisqacha ma'lumot
              </h3>
              <p className="text-surface-600 leading-relaxed">{c.summary}</p>
            </section>
          )}

          {/* Experience */}
          {c?.experience && c.experience.length > 0 && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900">
                <Briefcase className="h-5 w-5 text-purple-500" />
                Ish tajribasi
              </h3>
              <div className="space-y-5">
                {c.experience.map((exp, i) => (
                  <div key={i} className="border-l-2 border-purple-200 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-surface-900">{exp.position}</h4>
                        <p className="text-purple-600">{exp.company}</p>
                      </div>
                      <p className="text-sm text-surface-500 whitespace-nowrap">
                        {exp.start_date} — {exp.is_current ? "Hozirgi vaqt" : exp.end_date}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-surface-600">{exp.description}</p>
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((a, ai) => (
                          <li key={ai} className="flex items-start gap-2 text-sm text-surface-600">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {c?.education && c.education.length > 0 && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                Ta'lim
              </h3>
              <div className="space-y-4">
                {c.education.map((edu, i) => (
                  <div key={i} className="border-l-2 border-purple-200 pl-4">
                    <h4 className="font-semibold text-surface-900">
                      {edu.degree} — {edu.field}
                    </h4>
                    <p className="text-purple-600">{edu.institution}</p>
                    <p className="text-sm text-surface-500">{edu.year}</p>
                    {edu.gpa && (
                      <p className="text-sm text-surface-500">GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {c?.skills && (c.skills.technical?.length || c.skills.soft?.length) ? (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900">
                <Code className="h-5 w-5 text-purple-500" />
                Ko'nikmalar
              </h3>
              <div className="space-y-3">
                {c.skills.technical && c.skills.technical.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-surface-600">Texnik</p>
                    <div className="flex flex-wrap gap-2">
                      {c.skills.technical.map((s) => (
                        <span key={s} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {c.skills.soft && c.skills.soft.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-surface-600">Ijtimoiy</p>
                    <div className="flex flex-wrap gap-2">
                      {c.skills.soft.map((s) => (
                        <span key={s} className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Languages */}
          {c?.languages && c.languages.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
                <Languages className="h-5 w-5 text-purple-500" />
                Tillar
              </h3>
              <div className="flex flex-wrap gap-3">
                {c.languages.map((lang, i) => (
                  <div key={i} className="rounded-xl border border-surface-200 px-4 py-2 text-sm">
                    <span className="font-medium text-surface-900">{lang.name}</span>
                    <span className="ml-2 text-surface-500">— {lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {c?.certifications && c.certifications.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-surface-900">
                <Award className="h-5 w-5 text-purple-500" />
                Sertifikatlar
              </h3>
              <div className="space-y-2">
                {c.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-surface-200 p-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <div>
                      <p className="font-medium text-surface-900">{cert.name}</p>
                      <p className="text-sm text-surface-500">{cert.issuer} · {cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {c?.projects && c.projects.length > 0 && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900">
                <FolderOpen className="h-5 w-5 text-purple-500" />
                Loyihalar
              </h3>
              <div className="space-y-4">
                {c.projects.map((proj, i) => (
                  <div key={i} className="rounded-xl border border-surface-200 p-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-surface-900">{proj.name}</h4>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-surface-600">{proj.description}</p>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {proj.technologies.map((t) => (
                          <span key={t} className="rounded bg-surface-100 px-2 py-0.5 text-xs text-surface-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  );
}
