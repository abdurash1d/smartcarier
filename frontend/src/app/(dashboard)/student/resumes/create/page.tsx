"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Globe,
  Award,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resumeApi } from "@/lib/api";
import type { ResumeContent } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "personal", label: "Shaxsiy", icon: User },
  { id: "experience", label: "Tajriba", icon: Briefcase },
  { id: "education", label: "Ta'lim", icon: GraduationCap },
  { id: "skills", label: "Ko'nikmalar", icon: Code },
  { id: "languages", label: "Tillar", icon: Globe },
  { id: "certifications", label: "Sertifikatlar", icon: Award },
];

export default function CreateResumePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("Mening Resume");
  const [content, setContent] = useState<ResumeContent>({
    personal_info: {},
    experience: [],
    education: [],
    skills: { technical: [], soft: [] },
    languages: [],
    certifications: [],
  });

  const updatePersonal = (field: string, value: string) => {
    setContent((p) => ({ ...p, personal_info: { ...p.personal_info, [field]: value } }));
  };

  const addExperience = () => {
    setContent((p) => ({
      ...p,
      experience: [...(p.experience || []), { company: "", position: "", start_date: "", description: "" }],
    }));
  };

  const updateExperience = (i: number, field: string, value: any) => {
    const arr = [...(content.experience || [])];
    arr[i] = { ...arr[i], [field]: value };
    setContent((p) => ({ ...p, experience: arr }));
  };

  const removeExperience = (i: number) => {
    setContent((p) => ({ ...p, experience: (p.experience || []).filter((_, idx) => idx !== i) }));
  };

  const addEducation = () => {
    setContent((p) => ({
      ...p,
      education: [...(p.education || []), { institution: "", degree: "", field: "", year: "" }],
    }));
  };

  const updateEducation = (i: number, field: string, value: string) => {
    const arr = [...(content.education || [])];
    arr[i] = { ...arr[i], [field]: value };
    setContent((p) => ({ ...p, education: arr }));
  };

  const removeEducation = (i: number) => {
    setContent((p) => ({ ...p, education: (p.education || []).filter((_, idx) => idx !== i) }));
  };

  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      toast.error("Resume nomi kiritilishi kerak");
      return;
    }
    setIsSaving(true);
    try {
      const res = await resumeApi.create({ title, content });
      const newId = res.data?.data?.id || res.data?.id;
      if (publish && newId) {
        await resumeApi.publish(newId);
      }
      toast.success(publish ? "Resume nashr etildi!" : "Resume saqlandi!");
      router.push(`/student/resumes/${newId}`);
    } catch {
      toast.error("Saqlashda xatolik yuz berdi.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-surface-600">
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Button>
        <h1 className="font-bold text-surface-900">Yangi Resume</h1>
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Saqlash
        </Button>
      </div>

      {/* Resume Title */}
      <div>
        <Label>Resume nomi</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resume nomi"
          className="mt-1 text-lg font-medium"
        />
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={cn(
                "flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                i === step
                  ? "bg-purple-100 text-purple-700"
                  : i < step
                  ? "bg-green-100 text-green-700"
                  : "bg-surface-100 text-surface-500 hover:bg-surface-200"
              )}
            >
              {i < step ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm"
      >
        {/* PERSONAL INFO */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-surface-900">Shaxsiy ma'lumotlar</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>To'liq ism *</Label>
                <Input value={content.personal_info?.name || ""} onChange={(e) => updatePersonal("name", e.target.value)} placeholder="Ism Familiya" className="mt-1" />
              </div>
              <div>
                <Label>Professional unvon</Label>
                <Input value={content.personal_info?.professional_title || ""} onChange={(e) => updatePersonal("professional_title", e.target.value)} placeholder="Software Engineer" className="mt-1" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input value={content.personal_info?.email || ""} onChange={(e) => updatePersonal("email", e.target.value)} placeholder="email@misol.com" className="mt-1" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={content.personal_info?.phone || ""} onChange={(e) => updatePersonal("phone", e.target.value)} placeholder="+998 90 123 4567" className="mt-1" />
              </div>
              <div>
                <Label>Joylashuv</Label>
                <Input value={content.personal_info?.location || ""} onChange={(e) => updatePersonal("location", e.target.value)} placeholder="Toshkent, O'zbekiston" className="mt-1" />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input value={content.personal_info?.linkedin_url || ""} onChange={(e) => updatePersonal("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Portfolio</Label>
                <Input value={content.personal_info?.portfolio_url || ""} onChange={(e) => updatePersonal("portfolio_url", e.target.value)} placeholder="https://saytingiz.com" className="mt-1" />
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
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-surface-900">Ish tajribasi</h2>
            {(content.experience || []).map((exp, i) => (
              <div key={i} className="relative rounded-xl border border-surface-200 p-4">
                <button onClick={() => removeExperience(i)} className="absolute right-3 top-3 text-surface-400 hover:text-red-500">
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
                    <Label>Boshlanish</Label>
                    <Input type="month" value={exp.start_date} onChange={(e) => updateExperience(i, "start_date", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Tugash</Label>
                    <Input type="month" value={exp.end_date || ""} disabled={exp.is_current} onChange={(e) => updateExperience(i, "end_date", e.target.value)} className="mt-1" />
                    <label className="mt-1 flex items-center gap-2 text-sm text-surface-600">
                      <input type="checkbox" checked={!!exp.is_current} onChange={(e) => updateExperience(i, "is_current", e.target.checked)} />
                      Hozirda ishlayapman
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Tavsif</Label>
                    <textarea value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} placeholder="Vazifalar va yutuqlar..." rows={3} className="mt-1 w-full rounded-xl border border-surface-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
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
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-surface-900">Ta'lim</h2>
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
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-surface-900">Ko'nikmalar</h2>
            <div>
              <Label>Texnik ko'nikmalar (vergul bilan)</Label>
              <textarea
                value={(content.skills?.technical || []).join(", ")}
                onChange={(e) => setContent((p) => ({ ...p, skills: { ...p.skills, technical: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } }))}
                placeholder="JavaScript, React, Python, TypeScript..."
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
              <Label>Ijtimoiy ko'nikmalar (vergul bilan)</Label>
              <textarea
                value={(content.skills?.soft || []).join(", ")}
                onChange={(e) => setContent((p) => ({ ...p, skills: { ...p.skills, soft: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } }))}
                placeholder="Muloqot, Jamoaviy ish, Rahbarlik..."
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
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-bold text-surface-900">Tillar</h2>
            {(content.languages || []).map((lang, i) => (
              <div key={i} className="flex gap-3">
                <Input
                  value={lang.name}
                  onChange={(e) => { const arr = [...(content.languages || [])]; arr[i] = { ...arr[i], name: e.target.value }; setContent((p) => ({ ...p, languages: arr })); }}
                  placeholder="Til nomi"
                />
                <select
                  value={lang.proficiency}
                  onChange={(e) => { const arr = [...(content.languages || [])]; arr[i] = { ...arr[i], proficiency: e.target.value }; setContent((p) => ({ ...p, languages: arr })); }}
                  className="w-44 rounded-xl border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Daraja</option>
                  <option value="native">Ona tili</option>
                  <option value="fluent">Ravon</option>
                  <option value="advanced">Yuqori</option>
                  <option value="intermediate">O'rta</option>
                  <option value="basic">Boshlang'ich</option>
                </select>
                <button onClick={() => setContent((p) => ({ ...p, languages: (p.languages || []).filter((_, li) => li !== i) }))} className="text-surface-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={() => setContent((p) => ({ ...p, languages: [...(p.languages || []), { name: "", proficiency: "" }] }))}>
              <Plus className="mr-2 h-4 w-4" /> Til qo'shish
            </Button>
          </div>
        )}

        {/* CERTIFICATIONS */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-bold text-surface-900">Sertifikatlar</h2>
            {(content.certifications || []).map((cert, i) => (
              <div key={i} className="relative rounded-xl border border-surface-200 p-4">
                <button onClick={() => setContent((p) => ({ ...p, certifications: (p.certifications || []).filter((_, ci) => ci !== i) }))} className="absolute right-3 top-3 text-surface-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label>Sertifikat nomi</Label>
                    <Input value={cert.name} onChange={(e) => { const arr = [...(content.certifications || [])]; arr[i] = { ...arr[i], name: e.target.value }; setContent((p) => ({ ...p, certifications: arr })); }} placeholder="AWS Certified" className="mt-1" />
                  </div>
                  <div>
                    <Label>Yil</Label>
                    <Input value={cert.year} onChange={(e) => { const arr = [...(content.certifications || [])]; arr[i] = { ...arr[i], year: e.target.value }; setContent((p) => ({ ...p, certifications: arr })); }} placeholder="2024" className="mt-1" />
                  </div>
                  <div className="sm:col-span-3">
                    <Label>Berilgan tashkilot</Label>
                    <Input value={cert.issuer} onChange={(e) => { const arr = [...(content.certifications || [])]; arr[i] = { ...arr[i], issuer: e.target.value }; setContent((p) => ({ ...p, certifications: arr })); }} placeholder="Amazon Web Services" className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={() => setContent((p) => ({ ...p, certifications: [...(p.certifications || []), { name: "", issuer: "", year: "" }] }))}>
              <Plus className="mr-2 h-4 w-4" /> Sertifikat qo'shish
            </Button>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep(step - 1) : router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "Oldingi" : "Bekor qilish"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600"
          >
            Keyingi
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Qoralama saqlash
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Nashr etish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
