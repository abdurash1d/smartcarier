/**
 * =============================================================================
 * NEW JOB POSTING PAGE
 * =============================================================================
 *
 * Features:
 * - Multi-step form for job creation
 * - AI-assisted job description generation
 * - Preview before publishing
 * - Salary range calculator
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Eye,
  Save,
  Send,
  Loader2,
  Building2,
  GraduationCap,
  Code,
  FileText,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { jobApi, getErrorMessage } from "@/lib/api";

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const jobSchema = z.object({
  title: z.string().min(3, "Lavozim nomi kamida 3 ta belgi bo'lishi kerak"),
  department: z.string().optional(),
  location: z.string().min(2, "Joylashuv kiritilishi shart"),
  jobType: z.enum(["full_time", "part_time", "contract", "internship", "remote"]),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior", "lead", "executive"]),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  isSalaryVisible: z.boolean().default(true),
  description: z.string().min(100, "Tavsif kamida 100 ta belgi bo'lishi kerak"),
  requirements: z.string().min(50, "Talablar kamida 50 ta belgi bo'lishi kerak"),
  benefits: z.string().optional(),
  skills: z.array(z.string()).min(1, "Kamida 1 ta ko'nikma kiriting"),
  deadline: z.string().optional(),
  vacancies: z.number().min(1).default(1),
});

type JobFormData = z.infer<typeof jobSchema>;

// =============================================================================
// CONSTANTS
// =============================================================================

const steps = [
  { id: 1, title: "Asosiy ma'lumotlar", icon: Briefcase },
  { id: 2, title: "Tavsif", icon: FileText },
  { id: 3, title: "Talablar", icon: Code },
  { id: 4, title: "Ko'rib chiqish", icon: Eye },
];

const jobTypes = [
  { value: "full_time", label: "To'liq vaqtli" },
  { value: "part_time", label: "Yarim vaqtli" },
  { value: "contract", label: "Shartnoma" },
  { value: "internship", label: "Amaliyot" },
  { value: "remote", label: "Masofaviy" },
];

const experienceLevels = [
  { value: "entry", label: "Boshlang'ich" },
  { value: "junior", label: "Junior (1-2 yil)" },
  { value: "mid", label: "Middle (3-5 yil)" },
  { value: "senior", label: "Senior (5+ yil)" },
  { value: "lead", label: "Lead/Manager" },
  { value: "executive", label: "Director+" },
];

const suggestedSkills = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js", "PostgreSQL",
  "Docker", "AWS", "Git", "Agile", "Communication", "Leadership",
  "Problem Solving", "Project Management", "Data Analysis"
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NewJobPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      location: "Toshkent, O'zbekiston",
      jobType: "full_time",
      experienceLevel: "mid",
      isSalaryVisible: true,
      skills: [],
      vacancies: 1,
    },
  });

  const formData = watch();

  // Step validation
  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof JobFormData)[] = [];
    switch (step) {
      case 1:
        fieldsToValidate = ["title", "location", "jobType", "experienceLevel"];
        break;
      case 2:
        fieldsToValidate = ["description"];
        break;
      case 3:
        fieldsToValidate = ["requirements", "skills"];
        break;
    }
    return await trigger(fieldsToValidate);
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Add skill
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setValue("skills", [...formData.skills, trimmed]);
    }
    setSkillInput("");
  };

  // Remove skill
  const removeSkill = (skill: string) => {
    setValue("skills", formData.skills.filter((s) => s !== skill));
  };

  // AI Generate Description
  const generateDescription = async () => {
    if (!formData.title) {
      toast.error("Avval lavozim nomini kiriting");
      return;
    }

    setIsGenerating(true);
    try {
      // Fallback template — real AI endpoint can be wired later
      const generatedDescription = `Biz ${formData.title} lavozimiga tajribali mutaxassisni qidiryapmiz.

O'z sohasida chuqur bilim va ko'nikmalarga ega bo'lgan nomzodlarni kutib qolamiz. Sizning vazifalaringiz:

• Loyihalarni rejalashtirish va amalga oshirish
• Jamoa bilan hamkorlik qilish
• Texnik qarorlar qabul qilish
• Kod sifatini ta'minlash
• Yangi texnologiyalarni o'rganish

Ish muhiti:
• Zamonaviy ofis yoki masofaviy ishlash imkoniyati
• Professional rivojlanish uchun imkoniyatlar
• Do'stona va qo'llab-quvvatlovchi jamoa`;

      setValue("description", generatedDescription);
      toast.success("Tavsif muvaffaqiyatli yaratildi!");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit form - create job via API then publish
  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        location: data.location,
        job_type: data.jobType,
        experience_level: data.experienceLevel,
        description: data.description,
        requirements: { text: data.requirements, skills: data.skills },
        benefits: data.benefits,
        salary_min: data.salaryMin,
        salary_max: data.salaryMax,
        is_salary_visible: data.isSalaryVisible,
        vacancies: data.vacancies,
        deadline: data.deadline || null,
        department: data.department,
      };

      const res = await jobApi.create(payload);
      const created = res.data as { id: string };

      // Publish the newly created job
      await jobApi.publish(created.id);

      toast.success("Vakansiya muvaffaqiyatli e'lon qilindi!");
      router.push("/company/jobs");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as draft
  const saveDraft = async () => {
    try {
      const payload = {
        title: formData.title,
        location: formData.location,
        job_type: formData.jobType,
        experience_level: formData.experienceLevel,
        description: formData.description,
        requirements: { text: formData.requirements, skills: formData.skills },
        benefits: formData.benefits,
        salary_min: formData.salaryMin,
        salary_max: formData.salaryMax,
        is_salary_visible: formData.isSalaryVisible,
        vacancies: formData.vacancies,
        deadline: formData.deadline || null,
        department: formData.department,
      };
      await jobApi.create(payload);
      toast.success("Qoralama saqlandi");
      router.push("/company/jobs");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
          Yangi vakansiya yaratish
        </h1>
        <p className="mt-1 text-surface-500">
          {steps[currentStep - 1].title}
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
        <div className="mb-4 flex justify-between">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                currentStep === step.id
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20"
                  : currentStep > step.id
                  ? "text-green-600"
                  : "text-surface-400"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  currentStep === step.id
                    ? "bg-purple-500 text-white"
                    : currentStep > step.id
                    ? "bg-green-500 text-white"
                    : "bg-surface-200 dark:bg-surface-700"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="title">Lavozim nomi *</Label>
                      <Input
                        id="title"
                        placeholder="masalan: Senior Software Engineer"
                        {...register("title")}
                        error={errors.title?.message}
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Bo'lim</Label>
                      <Input
                        id="department"
                        placeholder="masalan: Texnologiya"
                        {...register("department")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Joylashuv *</Label>
                      <Input
                        id="location"
                        placeholder="masalan: Toshkent"
                        {...register("location")}
                        error={errors.location?.message}
                      />
                    </div>

                    <div>
                      <Label>Ish turi *</Label>
                      <Select
                        value={formData.jobType}
                        onValueChange={(v) => setValue("jobType", v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tajriba darajasi *</Label>
                      <Select
                        value={formData.experienceLevel}
                        onValueChange={(v) => setValue("experienceLevel", v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="salaryMin">Minimal maosh (UZS)</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        placeholder="5,000,000"
                        {...register("salaryMin", { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="salaryMax">Maksimal maosh (UZS)</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        placeholder="15,000,000"
                        {...register("salaryMax", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Maoshni ko'rsatish</Label>
                          <p className="text-sm text-surface-500">
                            Nomzodlarga maosh oralig'ini ko'rsatish
                          </p>
                        </div>
                        <Switch
                          checked={formData.isSalaryVisible}
                          onCheckedChange={(v: boolean) => setValue("isSalaryVisible", v)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="vacancies">Bo'sh o'rinlar soni</Label>
                      <Input
                        id="vacancies"
                        type="number"
                        min={1}
                        {...register("vacancies", { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="deadline">Ariza berish muddati</Label>
                      <Input
                        id="deadline"
                        type="date"
                        {...register("deadline")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Description */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ish tavsifi *</Label>
                      <p className="text-sm text-surface-500">
                        Lavozim va mas'uliyatlar haqida batafsil yozing
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateDescription}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      AI bilan yaratish
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Lavozim haqida batafsil ma'lumot..."
                    rows={12}
                    {...register("description")}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}

                  <div>
                    <Label>Imtiyozlar va bonuslar</Label>
                    <Textarea
                      placeholder="masalan: Tibbiy sug'urta, bepul tushlik, masofaviy ishlash..."
                      rows={4}
                      {...register("benefits")}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Requirements */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <Label>Talablar *</Label>
                    <Textarea
                      placeholder="Nomzodga qo'yiladigan talablar..."
                      rows={8}
                      {...register("requirements")}
                      className={errors.requirements ? "border-red-500" : ""}
                    />
                    {errors.requirements && (
                      <p className="text-sm text-red-500">{errors.requirements.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Kerakli ko'nikmalar *</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        placeholder="Ko'nikma qo'shish..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill(skillInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addSkill(skillInput)}
                      >
                        Qo'shish
                      </Button>
                    </div>

                    {/* Selected Skills */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                    {errors.skills && (
                      <p className="mt-2 text-sm text-red-500">{errors.skills.message}</p>
                    )}

                    {/* Suggested Skills */}
                    <div className="mt-4">
                      <p className="text-xs text-surface-500 mb-2">Tavsiya etilgan ko'nikmalar:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedSkills
                          .filter((s) => !formData.skills.includes(s))
                          .slice(0, 10)
                          .map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className="rounded-full border border-surface-200 px-3 py-1 text-xs text-surface-600 hover:border-purple-300 hover:bg-purple-50"
                            >
                              + {skill}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardContent className="pt-6">
                  {/* Job Preview */}
                  <div className="rounded-xl border border-surface-200 p-6 dark:border-surface-700">
                    <div className="mb-6 border-b border-surface-200 pb-6 dark:border-surface-700">
                      <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
                        {formData.title || "Lavozim nomi"}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-surface-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {formData.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {jobTypes.find((t) => t.value === formData.jobType)?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {experienceLevels.find((l) => l.value === formData.experienceLevel)?.label}
                        </span>
                        {formData.isSalaryVisible && formData.salaryMin && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formData.salaryMin?.toLocaleString()} - {formData.salaryMax?.toLocaleString()} UZS
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">
                          Ish tavsifi
                        </h3>
                        <p className="whitespace-pre-wrap text-surface-600 dark:text-surface-400">
                          {formData.description || "Tavsif kiritilmagan"}
                        </p>
                      </div>

                      <div>
                        <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">
                          Talablar
                        </h3>
                        <p className="whitespace-pre-wrap text-surface-600 dark:text-surface-400">
                          {formData.requirements || "Talablar kiritilmagan"}
                        </p>
                      </div>

                      {formData.benefits && (
                        <div>
                          <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">
                            Imtiyozlar
                          </h3>
                          <p className="whitespace-pre-wrap text-surface-600 dark:text-surface-400">
                            {formData.benefits}
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">
                          Kerakli ko'nikmalar
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orqaga
          </Button>

          <Button type="button" variant="ghost" onClick={saveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Qoralama saqlash
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Keyingi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              E'lon qilish
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}













