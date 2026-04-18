/**
 * =============================================================================
 * AI RESUME BUILDER - MOST IMPORTANT PAGE
 * =============================================================================
 *
 * Features:
 * - Split screen: Left 40% Form, Right 60% Live Preview
 * - Multi-step form (Personal Info, Experience, Education, Skills, Additional)
 * - AI generation with template/tone selection
 * - Real-time preview with template switcher
 * - Auto-save, progress bar, validation
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Loader2,
  CheckCircle,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  Wand2,
  Palette,
  Type,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useResume } from "@/hooks/useResume";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { resumeApi } from "@/lib/api";
import type { Resume, ResumeContent } from "@/types/api";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { getSkillSuggestions } from "@/lib/resume/skillProfiles";

// =============================================================================
// TYPES & SCHEMAS
// =============================================================================

const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(9, "Phone is required"),
  location: z.string().optional(),
  professionalTitle: z.string().min(2, "Professional title is required"),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
});

const experienceSchema = z.object({
  experiences: z.array(
    z.object({
      company: z.string().min(1, "Company name is required"),
      position: z.string().min(1, "Position is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional(),
      description: z.string().min(10, "Description is required"),
    })
  ),
});

const educationSchema = z.object({
  education: z.array(
    z.object({
      institution: z.string().min(1, "Institution is required"),
      degree: z.string().min(1, "Degree is required"),
      field: z.string().min(1, "Field is required"),
      year: z.string().min(1, "Year is required"),
    })
  ),
});

const skillsSchema = z.object({
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  languages: z.array(
    z.object({
      name: z.string(),
      proficiency: z.string(),
    })
  ),
});

const additionalSchema = z.object({
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      year: z.string(),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      url: z.string().optional(),
    })
  ),
});

// Combined schema
const resumeSchema = personalInfoSchema
  .merge(experienceSchema)
  .merge(educationSchema)
  .merge(skillsSchema)
  .merge(additionalSchema);

type ResumeFormData = z.infer<typeof resumeSchema>;

// =============================================================================
// STEP CONFIGURATION
// =============================================================================

const steps = [
  { id: 1, title: "Shaxsiy ma'lumot", icon: User, description: "Asosiy aloqa ma'lumotlari" },
  { id: 2, title: "Tajriba", icon: Briefcase, description: "Ish tarixi" },
  { id: 3, title: "Ta'lim", icon: GraduationCap, description: "O'quv ma'lumotlari" },
  { id: 4, title: "Ko'nikmalar", icon: Code, description: "Sizning mutaxassisligingiz" },
  { id: 5, title: "Qo'shimcha", icon: Award, description: "Qo'shimcha bo'limlar" },
];

const templates = [
  { id: "modern", name: "Zamonaviy", description: "Toza, zamonaviy dizayn" },
  { id: "classic", name: "Klassik", description: "An'anaviy professional" },
  { id: "minimal", name: "Minimal", description: "Oddiy va elegant" },
  { id: "creative", name: "Kreativ", description: "Boshqalardan ajralib turing" },
];

const tones = [
  { id: "professional", name: "Professional", description: "Rasmiy va korporativ" },
  { id: "confident", name: "Ishonchli", description: "Qat'iy va dadil" },
  { id: "friendly", name: "Do'stona", description: "Iliq va ochiq" },
  { id: "technical", name: "Texnik", description: "Tafsilotlarga e'tibor beruvchi" },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIResumeBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { generateResume, isGenerating } = useResume();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [isGenerated, setIsGenerated] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<Resume | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [skillInput, setSkillInput] = useState({ technical: "", soft: "" });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      professionalTitle: "",
      linkedinUrl: "",
      portfolioUrl: "",
      experiences: [
        {
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
        },
      ],
      education: [
        { institution: "", degree: "", field: "", year: "" },
      ],
      technicalSkills: [],
      softSkills: [],
      languages: [{ name: "", proficiency: "" }],
      certifications: [],
      projects: [],
    },
  });

  const formData = watch();
  const roleSignal = useMemo(() => {
    const title = formData.professionalTitle || "";
    const positions = (formData.experiences || []).map((exp) => exp.position || "").join(" ");
    const fields = (formData.education || []).map((edu) => edu.field || "").join(" ");
    return `${title} ${positions} ${fields}`.trim();
  }, [formData.professionalTitle, formData.experiences, formData.education]);

  const { profile: activeSkillProfile, technical: technicalSkillSuggestions, soft: softSkillSuggestions } =
    useMemo(
      () =>
        getSkillSuggestions(
          roleSignal,
          formData.technicalSkills || [],
          formData.softSkills || []
        ),
      [formData.softSkills, formData.technicalSkills, roleSignal]
    );

  // Field arrays
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control, name: "experiences" });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control, name: "education" });

  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({ control, name: "languages" });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({ control, name: "certifications" });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({ control, name: "projects" });

  // Auto-save effect
  useEffect(() => {
    const autoSave = setInterval(() => {
      localStorage.setItem("resume_draft", JSON.stringify(formData));
      setLastSaved(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(autoSave);
  }, [formData]);

  // Load saved draft
  useEffect(() => {
    const saved = localStorage.getItem("resume_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((key) => {
          setValue(key as any, parsed[key]);
        });
      } catch (e) {
        console.error("Failed to load draft");
      }
    }
  }, []);

  // Step validation
  const validateCurrentStep = async () => {
    let fieldsToValidate: string[] = [];
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["fullName", "email", "phone", "professionalTitle"];
        break;
      case 2:
        fieldsToValidate = ["experiences"];
        break;
      case 3:
        fieldsToValidate = ["education"];
        break;
      case 4:
        fieldsToValidate = ["technicalSkills", "softSkills"];
        break;
      case 5:
        return true;
    }
    return await trigger(fieldsToValidate as any);
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Add skill
  const addSkill = (type: "technical" | "soft") => {
    const value = skillInput[type].trim();
    if (value) {
      const currentSkills = formData[type === "technical" ? "technicalSkills" : "softSkills"] || [];
      if (!currentSkills.includes(value)) {
        setValue(
          type === "technical" ? "technicalSkills" : "softSkills",
          [...currentSkills, value]
        );
      }
      setSkillInput((prev) => ({ ...prev, [type]: "" }));
    }
  };

  // Remove skill
  const removeSkill = (type: "technical" | "soft", skill: string) => {
    const field = type === "technical" ? "technicalSkills" : "softSkills";
    const currentSkills = formData[field] || [];
    setValue(field, currentSkills.filter((s) => s !== skill));
  };

  // Generate Resume using AI API
  const handleGenerate = async () => {
    try {
      type GenerateResumePayload = Parameters<typeof generateResume>[0];

      const payload: GenerateResumePayload = {
        user_data: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          location: formData.location || undefined,
          professional_title: formData.professionalTitle,
          linkedin_url: formData.linkedinUrl || undefined,
          portfolio_url: formData.portfolioUrl || undefined,
          skills: [...formData.technicalSkills, ...formData.softSkills].filter(Boolean),
          experience: formData.experiences.map((exp) => ({
            company: exp.company,
            position: exp.position,
            duration: exp.isCurrent
              ? `${exp.startDate} - Present`
              : `${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ""}`,
            description: exp.description,
          })),
          education: formData.education.map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            year: edu.year,
          })),
        },
        template: selectedTemplate as GenerateResumePayload["template"],
        tone: selectedTone as GenerateResumePayload["tone"],
      };

      const result = await generateResume(payload);
      if (result) {
        setGeneratedResume(result);
        setIsGenerated(true);
        localStorage.removeItem("resume_draft");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#a855f7", "#6366f1", "#06b6d4"],
        });
      }
    } catch (error) {
      // error already shown by hook
    }
  };

  const handleDownloadGenerated = async () => {
    if (!generatedResume) {
      toast.info("Avval resumeni AI orqali yarating.");
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const response = await resumeApi.download(generatedResume.id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${generatedResume.title || "resume"}`.replace(/[\\/:*?"<>|]+/g, "_");
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Resume PDF yuklab olindi.");
    } catch {
      toast.error("PDF yuklab olishda xatolik yuz berdi.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const previewContent: ResumeContent = {
    personal_info: {
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      professional_title: formData.professionalTitle,
      linkedin_url: formData.linkedinUrl,
      portfolio_url: formData.portfolioUrl,
    },
    experience: formData.experiences
      .filter((exp) => exp.company || exp.position || exp.description)
      .map((exp) => ({
        company: exp.company,
        position: exp.position,
        start_date: exp.startDate,
        end_date: exp.endDate,
        is_current: exp.isCurrent,
        description: exp.description,
      })),
    education: formData.education
      .filter((edu) => edu.institution || edu.degree || edu.field)
      .map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        year: edu.year,
      })),
    skills: {
      technical: formData.technicalSkills,
      soft: formData.softSkills,
    },
    languages: formData.languages.filter((language) => language.name),
    certifications: formData.certifications.filter((cert) => cert.name),
    projects: formData.projects.filter((project) => project.name),
  };

  // Progress calculation
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT SIDE - Form (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col border-r border-surface-200 dark:border-surface-700 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-surface-900 dark:text-white">
                AI Resume Yaratuvchi
              </h1>
              <p className="text-sm text-surface-500">
                {steps[currentStep - 1].description}
              </p>
            </div>
            {lastSaved && (
              <span className="flex items-center gap-1 text-xs text-surface-400">
                <Save className="h-3 w-3" />
                Saqlandi {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs">
              <span>{currentStep}-qadam, jami {steps.length}</span>
              <span>{Math.round(progress)}% bajarildi</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="mt-4 flex gap-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all",
                  currentStep === step.id
                    ? "bg-purple-100 text-purple-700"
                    : currentStep > step.id
                    ? "bg-green-100 text-green-700"
                    : "bg-surface-100 text-surface-500"
                )}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:block">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="fullName">To'liq ism *</Label>
                    <Input
                      id="fullName"
                      placeholder="Ism Familiya"
                      icon={<User className="h-4 w-4" />}
                      error={errors.fullName?.message}
                      {...register("fullName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@misol.com"
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      placeholder="+998 90 123 4567"
                      icon={<Phone className="h-4 w-4" />}
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Joylashuv</Label>
                    <Input
                      id="location"
                      placeholder="Tashkent, Uzbekistan"
                      icon={<MapPin className="h-4 w-4" />}
                      {...register("location")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="professionalTitle">Professional unvon *</Label>
                    <Input
                      id="professionalTitle"
                      placeholder="masalan: Senior Software Engineer"
                      icon={<Briefcase className="h-4 w-4" />}
                      error={errors.professionalTitle?.message}
                      {...register("professionalTitle")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      placeholder="https://linkedin.com/in/..."
                      icon={<Linkedin className="h-4 w-4" />}
                      {...register("linkedinUrl")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolioUrl">Portfolio / Veb-sayt</Label>
                    <Input
                      id="portfolioUrl"
                      placeholder="https://yoursite.com"
                      icon={<Globe className="h-4 w-4" />}
                      {...register("portfolioUrl")}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Experience */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {experienceFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative rounded-xl border border-surface-200 p-4 dark:border-surface-700"
                  >
                    {experienceFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="absolute right-2 top-2 rounded-lg p-1 text-surface-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Kompaniya nomi *</Label>
                        <Input
                          placeholder="Kompaniya nomi"
                          {...register(`experiences.${index}.company`)}
                        />
                      </div>
                      <div>
                        <Label>Lavozim *</Label>
                        <Input
                          placeholder="Lavozim nomi"
                          {...register(`experiences.${index}.position`)}
                        />
                      </div>
                      <div>
                        <Label>Boshlanish sanasi *</Label>
                        <Input
                          type="month"
                          {...register(`experiences.${index}.startDate`)}
                        />
                      </div>
                      <div>
                        <Label>Tugash sanasi</Label>
                        <Input
                          type="month"
                          placeholder="Hozirgi vaqtgacha"
                          disabled={formData.experiences?.[index]?.isCurrent}
                          {...register(`experiences.${index}.endDate`)}
                        />
                        <label className="mt-2 flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            {...register(`experiences.${index}.isCurrent`)}
                            className="rounded border-surface-300"
                          />
                          Hozirda ishlayapman
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Tavsif *</Label>
                        <Textarea
                          placeholder="Vazifalaringiz va yutuqlaringizni tasvirlab bering..."
                          rows={4}
                          {...register(`experiences.${index}.description`)}
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
                    appendExperience({
                      company: "",
                      position: "",
                      startDate: "",
                      endDate: "",
                      isCurrent: false,
                      description: "",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tajriba qo'shish
                </Button>
              </motion.div>
            )}

            {/* Step 3: Education */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {educationFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative rounded-xl border border-surface-200 p-4 dark:border-surface-700"
                  >
                    {educationFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="absolute right-2 top-2 rounded-lg p-1 text-surface-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label>O'quv yurti *</Label>
                        <Input
                          placeholder="O'quv yurt nomi"
                          {...register(`education.${index}.institution`)}
                        />
                      </div>
                      <div>
                        <Label>Daraja *</Label>
                        <Input
                          placeholder="Bakalavriat"
                          {...register(`education.${index}.degree`)}
                        />
                      </div>
                      <div>
                        <Label>Yo'nalish *</Label>
                        <Input
                          placeholder="Kompyuter fanlari"
                          {...register(`education.${index}.field`)}
                        />
                      </div>
                      <div>
                        <Label>Bitirish yili *</Label>
                        <Input
                          placeholder="2024"
                          {...register(`education.${index}.year`)}
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
                    appendEducation({
                      institution: "",
                      degree: "",
                      field: "",
                      year: "",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ta'lim qo'shish
                </Button>
              </motion.div>
            )}

            {/* Step 4: Skills */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Technical Skills */}
                <div>
                  <Label>Texnik ko'nikmalar</Label>
                  {activeSkillProfile && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Kasbga mos tavsiyalar: {activeSkillProfile.label}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Ko'nikma qo'shing..."
                      value={skillInput.technical}
                      onChange={(e) =>
                        setSkillInput((prev) => ({ ...prev, technical: e.target.value }))
                      }
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("technical"))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addSkill("technical")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.technicalSkills?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        onClick={() => removeSkill("technical", skill)}
                      >
                        {skill} x
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-surface-500 mb-2">Tavsiya etilgan ko'nikmalar:</p>
                    <div className="flex flex-wrap gap-1">
                      {technicalSkillSuggestions.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() =>
                              setValue("technicalSkills", [
                                ...(formData.technicalSkills || []),
                                skill,
                              ])
                            }
                            className="rounded-full border border-surface-200 px-2 py-0.5 text-xs text-surface-600 hover:border-purple-300 hover:bg-purple-50"
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Soft Skills */}
                <div>
                  <Label>Ijtimoiy ko'nikmalar</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Ko'nikma qo'shing..."
                      value={skillInput.soft}
                      onChange={(e) =>
                        setSkillInput((prev) => ({ ...prev, soft: e.target.value }))
                      }
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("soft"))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addSkill("soft")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.softSkills?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        onClick={() => removeSkill("soft", skill)}
                      >
                        {skill} x
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-surface-500 mb-2">Tavsiya etilgan ko'nikmalar:</p>
                    <div className="flex flex-wrap gap-1">
                      {softSkillSuggestions.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() =>
                              setValue("softSkills", [
                                ...(formData.softSkills || []),
                                skill,
                              ])
                            }
                            className="rounded-full border border-surface-200 px-2 py-0.5 text-xs text-surface-600 hover:border-purple-300 hover:bg-purple-50"
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <Label>Tillar</Label>
                  <div className="mt-2 space-y-2">
                    {languageFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          placeholder="Til (masalan: O'zbek)"
                          {...register(`languages.${index}.name`)}
                        />
                        <Select
                          value={formData.languages?.[index]?.proficiency}
                          onValueChange={(v) =>
                            setValue(`languages.${index}.proficiency`, v)
                          }
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Daraja" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="native">Ona tili</SelectItem>
                            <SelectItem value="fluent">Ravon</SelectItem>
                            <SelectItem value="advanced">Yuqori daraja</SelectItem>
                            <SelectItem value="intermediate">O'rta daraja</SelectItem>
                            <SelectItem value="basic">Boshlang'ich</SelectItem>
                          </SelectContent>
                        </Select>
                        {languageFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLanguage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendLanguage({ name: "", proficiency: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Til qo'shish
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Additional */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Template Selection */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Resume shabloni
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "rounded-xl border-2 p-3 text-left transition-all",
                          selectedTemplate === template.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-surface-200 hover:border-surface-300"
                        )}
                      >
                        <p className="font-medium text-surface-900">{template.name}</p>
                        <p className="text-xs text-surface-500">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Selection */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Yozish uslubi
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {tones.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setSelectedTone(tone.id)}
                        className={cn(
                          "rounded-xl border-2 p-3 text-left transition-all",
                          selectedTone === tone.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-surface-200 hover:border-surface-300"
                        )}
                      >
                        <p className="font-medium text-surface-900">{tone.name}</p>
                        <p className="text-xs text-surface-500">{tone.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <Label>Sertifikatlar (ixtiyoriy)</Label>
                  <div className="mt-2 space-y-2">
                    {certificationFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          placeholder="Sertifikat nomi"
                          {...register(`certifications.${index}.name`)}
                        />
                        <Input
                          placeholder="Berilgan tashkilot"
                          className="w-32"
                          {...register(`certifications.${index}.issuer`)}
                        />
                        <Input
                          placeholder="Yil"
                          className="w-20"
                          {...register(`certifications.${index}.year`)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCertification(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendCertification({ name: "", issuer: "", year: "" })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Sertifikat qo'shish
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Orqaga
              </Button>
            )}

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                Keyingi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI bilan yaratish
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Preview (60%) */}
      <div className="hidden lg:flex lg:w-[60%] flex-col bg-surface-100 dark:bg-surface-800">
        {/* Preview Header */}
        <div className="flex items-center justify-between border-b border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-surface-500" />
            <span className="font-medium text-surface-900 dark:text-white">Jonli ko'rinish</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-surface-500 w-12 text-center">{previewZoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewZoom((z) => Math.min(150, z + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-6 w-px bg-surface-200" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadGenerated}
              disabled={!generatedResume || isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF yuklash
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-8">
          <div
            className="mx-auto bg-white shadow-2xl transition-transform"
            style={{
              transform: `scale(${previewZoom / 100})`,
              transformOrigin: "top center",
              width: "210mm",
              minHeight: "297mm",
            }}
          >
            <ResumePreview
              content={previewContent}
              title={formData.fullName || "SmartCareer Resume"}
              isPlaceholder={!formData.fullName}
            />
          </div>
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {isGenerated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl bg-white p-8 text-center shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
                >
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold text-surface-900">
                  Resume yaratildi!
                </h2>
                <p className="mt-2 text-surface-500">
                  AI yordamida resume tayyor
                </p>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={() => setIsGenerated(false)}>
                    Tahrirlash
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generatedResume && router.push(`/student/resumes/${generatedResume.id}`)}
                    disabled={!generatedResume}
                  >
                    Ko&apos;rish
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-emerald-500 to-cyan-600"
                    onClick={handleDownloadGenerated}
                    disabled={!generatedResume || isDownloadingPdf}
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    PDF yuklash
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
















