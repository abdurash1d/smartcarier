"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Globe,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { resumeApi } from "@/lib/api";
import type { Resume, ResumeContent } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "personal", label: "Shaxsiy", icon: User },
  { id: "experience", label: "Tajriba", icon: Briefcase },
  { id: "education", label: "Ta'lim", icon: GraduationCap },
  { id: "skills", label: "Ko'nikmalar", icon: Code },
  { id: "languages", label: "Tillar", icon: Globe },
  { id: "certifications", label: "Sertifikatlar", icon: Award },
];

export default function ResumeEditPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params!.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true);
        const res = await resumeApi.get(resumeId);
        const data: Resume = res.data?.data || res.data;
        setResume(data);
        setTitle(data.title);
        setContent(data.content || {});
      } catch {
        setError("Resume topilmadi.");
      } finally {
        setIsLoading(false);
      }
    };
    if (resumeId) fetchResume();
  }, [resumeId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await resumeApi.update(resumeId, { title, content });
      toast.success("Resume saqlandi!");
    } catch {
      toast.error("Saqlashda xatolik yuz berdi.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...(content.experience || [])];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, experience: updated }));
  };

  const addExperience = () => {
    setContent((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { company: "", position: "", start_date: "", description: "" },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    const updated = (content.experience || []).filter((_, i) => i !== index);
    setContent((prev) => ({ ...prev, experience: updated }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...(content.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, education: updated }));
  };

  const addEducation = () => {
    setContent((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { institution: "", degree: "", field: "", year: "" },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    const updated = (content.education || []).filter((_, i) => i !== index);
    setContent((prev) => ({ ...prev, education: updated }));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-surface-600">
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Saqlash
        </Button>
      </motion.div>

      {/* Title */}
      <div>
        <Label>Resume nomi</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 text-lg font-medium"
          placeholder="Resume nomi"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-surface-200 bg-surface-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-surface-600 hover:text-surface-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm"
      >
        {/* PERSONAL INFO */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            <h3 className="font-bold text-surface-900">Shaxsiy ma'lumotlar</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>To'liq ism</Label>
                <Input
                  value={content.personal_info?.name || ""}
                  onChange={(e) => updatePersonalInfo("name", e.target.value)}
                  placeholder="Ism Familiya"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Professional unvon</Label>
                <Input
                  value={content.personal_info?.professional_title || ""}
                  onChange={(e) => updatePersonalInfo("professional_title", e.target.value)}
                  placeholder="masalan: Software Engineer"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={content.personal_info?.email || ""}
                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                  placeholder="email@misol.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={content.personal_info?.phone || ""}
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                  placeholder="+998 90 123 4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Joylashuv</Label>
                <Input
                  value={content.personal_info?.location || ""}
                  onChange={(e) => updatePersonalInfo("location", e.target.value)}
                  placeholder="Toshkent, O'zbekiston"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input
                  value={content.personal_info?.linkedin_url || ""}
                  onChange={(e) => updatePersonalInfo("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Portfolio / Veb-sayt</Label>
                <Input
                  value={content.personal_info?.portfolio_url || ""}
                  onChange={(e) => updatePersonalInfo("portfolio_url", e.target.value)}
                  placeholder="https://saytingiz.com"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Qisqacha ma'lumot</Label>
              <textarea
                value={content.summary || ""}
                onChange={(e) => setContent((p) => ({ ...p, summary: e.target.value }))}
                placeholder="O'zingiz haqingizda qisqacha..."
                rows={4}
                className="mt-1 w-full rounded-xl border border-surface-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* EXPERIENCE */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            <h3 className="font-bold text-surface-900">Ish tajribasi</h3>
            {(content.experience || []).map((exp, i) => (
              <div key={i} className="relative rounded-xl border border-surface-200 p-4">
                <button
                  onClick={() => removeExperience(i)}
                  className="absolute right-3 top-3 text-surface-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Kompaniya</Label>
                    <Input value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} placeholder="Kompaniya nomi" className="mt-1" />
                  </div>
                  <div>
                    <Label>Lavozim</Label>
                    <Input value={exp.position} onChange={(e) => updateExperience(i, "position", e.target.value)} placeholder="Lavozim nomi" className="mt-1" />
                  </div>
                  <div>
                    <Label>Boshlanish sanasi</Label>
                    <Input type="month" value={exp.start_date} onChange={(e) => updateExperience(i, "start_date", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Tugash sanasi</Label>
                    <Input type="month" value={exp.end_date || ""} disabled={exp.is_current} onChange={(e) => updateExperience(i, "end_date", e.target.value)} className="mt-1" />
                    <label className="mt-1 flex items-center gap-2 text-sm text-surface-600">
                      <input type="checkbox" checked={!!exp.is_current} onChange={(e) => updateExperience(i, "is_current", e.target.checked)} />
                      Hozirda ishlayapman
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Tavsif</Label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(i, "description", e.target.value)}
                      placeholder="Vazifalar va yutuqlar..."
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-surface-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={addExperience}>
              <Plus className="mr-2 h-4 w-4" /> Tajriba qo'shish
            </Button>
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === "education" && (
          <div className="space-y-6">
            <h3 className="font-bold text-surface-900">Ta'lim</h3>
            {(content.education || []).map((edu, i) => (
              <div key={i} className="relative rounded-xl border border-surface-200 p-4">
                <button onClick={() => removeEducation(i)} className="absolute right-3 top-3 text-surface-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>O'quv yurti</Label>
                    <Input value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} placeholder="O'quv yurt nomi" className="mt-1" />
                  </div>
                  <div>
                    <Label>Daraja</Label>
                    <Input value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder="Bakalavriat" className="mt-1" />
                  </div>
                  <div>
                    <Label>Yo'nalish</Label>
                    <Input value={edu.field || ""} onChange={(e) => updateEducation(i, "field", e.target.value)} placeholder="Kompyuter fanlari" className="mt-1" />
                  </div>
                  <div>
                    <Label>Bitirish yili</Label>
                    <Input value={edu.year} onChange={(e) => updateEducation(i, "year", e.target.value)} placeholder="2024" className="mt-1" />
                  </div>
                  <div>
                    <Label>GPA (ixtiyoriy)</Label>
                    <Input value={edu.gpa || ""} onChange={(e) => updateEducation(i, "gpa", e.target.value)} placeholder="3.8" className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={addEducation}>
              <Plus className="mr-2 h-4 w-4" /> Ta'lim qo'shish
            </Button>
          </div>
        )}

        {/* SKILLS */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <h3 className="font-bold text-surface-900">Ko'nikmalar</h3>
            <div>
              <Label>Texnik ko'nikmalar (vergul bilan ajrating)</Label>
              <textarea
                value={(content.skills?.technical || []).join(", ")}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    skills: {
                      ...p.skills,
                      technical: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  }))
                }
                placeholder="JavaScript, React, Python, ..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-surface-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {(content.skills?.technical || []).map((s) => (
                  <span key={s} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <Label>Ijtimoiy ko'nikmalar (vergul bilan ajrating)</Label>
              <textarea
                value={(content.skills?.soft || []).join(", ")}
                onChange={(e) =>
                  setContent((p) => ({
                    ...p,
                    skills: {
                      ...p.skills,
                      soft: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  }))
                }
                placeholder="Muloqot, Jamoaviy ish, ..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-surface-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {(content.skills?.soft || []).map((s) => (
                  <span key={s} className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LANGUAGES */}
        {activeTab === "languages" && (
          <div className="space-y-4">
            <h3 className="font-bold text-surface-900">Tillar</h3>
            {(content.languages || []).map((lang, i) => (
              <div key={i} className="flex gap-3">
                <Input
                  value={lang.name}
                  onChange={(e) => {
                    const updated = [...(content.languages || [])];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setContent((p) => ({ ...p, languages: updated }));
                  }}
                  placeholder="Til nomi"
                />
                <select
                  value={lang.proficiency}
                  onChange={(e) => {
                    const updated = [...(content.languages || [])];
                    updated[i] = { ...updated[i], proficiency: e.target.value };
                    setContent((p) => ({ ...p, languages: updated }));
                  }}
                  className="w-44 rounded-xl border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Daraja</option>
                  <option value="native">Ona tili</option>
                  <option value="fluent">Ravon</option>
                  <option value="advanced">Yuqori daraja</option>
                  <option value="intermediate">O'rta daraja</option>
                  <option value="basic">Boshlang'ich</option>
                </select>
                <button
                  onClick={() => {
                    const updated = (content.languages || []).filter((_, li) => li !== i);
                    setContent((p) => ({ ...p, languages: updated }));
                  }}
                  className="text-surface-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                setContent((p) => ({
                  ...p,
                  languages: [...(p.languages || []), { name: "", proficiency: "" }],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Til qo'shish
            </Button>
          </div>
        )}

        {/* CERTIFICATIONS */}
        {activeTab === "certifications" && (
          <div className="space-y-4">
            <h3 className="font-bold text-surface-900">Sertifikatlar</h3>
            {(content.certifications || []).map((cert, i) => (
              <div key={i} className="relative rounded-xl border border-surface-200 p-4">
                <button
                  onClick={() => {
                    const updated = (content.certifications || []).filter((_, ci) => ci !== i);
                    setContent((p) => ({ ...p, certifications: updated }));
                  }}
                  className="absolute right-3 top-3 text-surface-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label>Sertifikat nomi</Label>
                    <Input
                      value={cert.name}
                      onChange={(e) => {
                        const updated = [...(content.certifications || [])];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setContent((p) => ({ ...p, certifications: updated }));
                      }}
                      placeholder="AWS Certified Developer"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Yil</Label>
                    <Input
                      value={cert.year}
                      onChange={(e) => {
                        const updated = [...(content.certifications || [])];
                        updated[i] = { ...updated[i], year: e.target.value };
                        setContent((p) => ({ ...p, certifications: updated }));
                      }}
                      placeholder="2024"
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label>Berilgan tashkilot</Label>
                    <Input
                      value={cert.issuer}
                      onChange={(e) => {
                        const updated = [...(content.certifications || [])];
                        updated[i] = { ...updated[i], issuer: e.target.value };
                        setContent((p) => ({ ...p, certifications: updated }));
                      }}
                      placeholder="Amazon Web Services"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                setContent((p) => ({
                  ...p,
                  certifications: [...(p.certifications || []), { name: "", issuer: "", year: "" }],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Sertifikat qo'shish
            </Button>
          </div>
        )}
      </motion.div>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          O'zgarishlarni saqlash
        </Button>
      </div>
    </div>
  );
}
