/**
 * =============================================================================
 * SMARTCAREER AI - Register Page (Multi-Step Form)
 * =============================================================================
 *
 * Features:
 * - Multi-step form (3 steps)
 * - Step 1: Email, Password, Confirm Password
 * - Step 2: Full Name, Phone
 * - Step 3: Role selection (Student/Company)
 * - Progress indicator
 * - Validation on each step
 * - Success animation on completion
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  GraduationCap,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { cn } from "@/lib/utils";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Step 1: Account credentials
const step1Schema = z
  .object({
    email: z
      .string()
      .min(1, "Email majburiy")
      .email("Iltimos, to'g'ri email manzilini kiriting"),
    password: z
      .string()
      .min(1, "Parol majburiy")
      .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
      .max(72, "Parol 72 ta belgidan oshmasligi kerak")
      .regex(/[a-z]/, "Parol kamida bitta kichik harfni o'z ichiga olishi kerak")
      .regex(/[A-Z]/, "Parol kamida bitta katta harfni o'z ichiga olishi kerak")
      .regex(/[0-9]/, "Parol kamida bitta raqamni o'z ichiga olishi kerak"),
    confirmPassword: z.string().min(1, "Iltimos, parolni tasdiqlang"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  });

// Step 2: Personal info
const step2Schema = z.object({
  fullName: z
    .string()
    .min(1, "To'liq ism majburiy")
    .min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak")
    .max(100, "Ism 100 ta belgidan oshmasligi kerak")
    .regex(/^[\p{L}\s'.'-]+$/u, "Ism faqat harflardan iborat bo'lishi kerak"),
  phone: z
    .string()
    .min(1, "Telefon raqam majburiy")
    .regex(/^\+?[0-9]{9,15}$/, "Iltimos, to'g'ri telefon raqamini kiriting"),
});

// Step 3: Role selection
const step3Schema = z.object({
  role: z.enum(["student", "company"], {
    required_error: "Iltimos, rolni tanlang",
  }),
  companyName: z.string().optional(),
});

// Combined schema
const registerSchema = z.intersection(
  z.intersection(step1Schema, step2Schema),
  step3Schema
);

type RegisterFormData = z.infer<typeof registerSchema>;

// =============================================================================
// STEP CONFIGURATION
// =============================================================================

const RegisterSteps = () => {
  const { t } = useTranslation();
  
  return [
    {
      id: 1,
      title: t("auth.register.steps.step1.title"),
      description: t("auth.register.steps.step1.description"),
      icon: Lock,
    },
    {
      id: 2,
      title: t("auth.register.steps.step2.title"),
      description: t("auth.register.steps.step2.description"),
      icon: User,
    },
    {
      id: 3,
      title: t("auth.register.steps.step3.title"),
      description: t("auth.register.steps.step3.description"),
      icon: Sparkles,
    },
  ];
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  }),
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// =============================================================================
// PASSWORD STRENGTH INDICATOR
// =============================================================================

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  
  const checks = [
    { label: t("auth.register.passwordChecks.characters"), test: password.length >= 8 },
    { label: t("auth.register.passwordChecks.lowercase"), test: /[a-z]/.test(password) },
    { label: t("auth.register.passwordChecks.uppercase"), test: /[A-Z]/.test(password) },
    { label: t("auth.register.passwordChecks.number"), test: /[0-9]/.test(password) },
  ];

  const strength = checks.filter((c) => c.test).length;
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = [
    t("auth.register.passwordStrength.weak"),
    t("auth.register.passwordStrength.fair"),
    t("auth.register.passwordStrength.good"),
    t("auth.register.passwordStrength.strong"),
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              i < strength ? strengthColors[strength - 1] : "bg-surface-200"
            )}
          />
        ))}
      </div>
      {/* Strength label */}
      {password && (
        <p className="text-xs text-surface-500">
          {t("auth.register.passwordStrength.label")}: <span className="font-medium">{strengthLabels[strength - 1] || t("auth.register.passwordStrength.tooWeak")}</span>
        </p>
      )}
      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              check.test ? "text-green-600" : "text-surface-400"
            )}
          >
            <CheckCircle className={cn("h-3 w-3", check.test ? "opacity-100" : "opacity-30")} />
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const { t } = useTranslation();

  const handleGoogleOAuth = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
    window.location.href = `${backendOrigin}/api/v1/auth/oauth/google?redirect=true`;
  };
  const steps = RegisterSteps();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      role: undefined,
      companyName: "",
    },
  });

  const password = watch("password");
  const selectedRole = watch("role");

  // Trigger confetti on success
  useEffect(() => {
    if (isSuccess) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#6366f1", "#06b6d4"],
      });
    }
  }, [isSuccess]);

  // Validate current step before proceeding
  const validateStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["email", "password", "confirmPassword"];
        break;
      case 2:
        fieldsToValidate = ["fullName", "phone"];
        break;
      case 3:
        fieldsToValidate = ["role"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 3) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        phone: data.phone,
        role: data.role,
        company_name: data.companyName,
      });
      setIsSuccess(true);
      // Redirect after success animation
      setTimeout(() => {
        // After register, backend already returns tokens + user (auto-login)
        // Redirect based on role
        const userRole = useAuthStore.getState().user?.role;
        const roleRoot = userRole === "company" ? "/company" : userRole === "admin" ? "/admin" : "/student";
        router.push(roleRoot);
      }, 2000);
    } catch {
      // Error is already stored in state
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-xl shadow-green-500/30"
        >
          <CheckCircle className="h-12 w-12 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-3xl font-bold text-surface-900"
        >
          {t("auth.register.success.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 text-surface-500"
        >
          {t("auth.register.success.message")}
          <br />
          {t("auth.register.success.redirecting")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <div className="h-1 w-32 mx-auto bg-surface-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-md"
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="minimal" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="font-display text-3xl font-bold text-surface-900">
          {t("auth.register.title")}
        </h1>
        <p className="mt-2 text-surface-500">
          {t("auth.register.subtitle")}
        </p>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    backgroundColor:
                      currentStep >= step.id
                        ? "rgb(139, 92, 246)"
                        : "rgb(226, 232, 240)",
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    currentStep >= step.id ? "text-white" : "text-surface-500"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </motion.div>
                {/* Step label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      currentStep >= step.id
                        ? "text-purple-600"
                        : "text-surface-400"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="mx-2 h-0.5 w-16 sm:w-24">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: currentStep > step.id ? "100%" : "0%",
                    }}
                    className="h-full bg-purple-500"
                  />
                  <div className="h-full -mt-0.5 bg-surface-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            {...fadeIn}
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Account Credentials */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.register.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={cn(
                        "flex h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm transition-all",
                        "placeholder:text-surface-400",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                        errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-surface-300 hover:border-surface-400"
                      )}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.register.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className={cn(
                        "flex h-12 w-full rounded-xl border bg-white pl-10 pr-12 text-sm transition-all",
                        "placeholder:text-surface-400",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                        errors.password
                          ? "border-red-300 focus:ring-red-500"
                          : "border-surface-300 hover:border-surface-400"
                      )}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={password || ""} />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.register.confirmPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      className={cn(
                        "flex h-12 w-full rounded-xl border bg-white pl-10 pr-12 text-sm transition-all",
                        "placeholder:text-surface-400",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-surface-300 hover:border-surface-400"
                      )}
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-surface-200" />
                  <span className="text-xs text-surface-400">Yoki davom eting</span>
                  <div className="h-px flex-1 bg-surface-200" />
                </div>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-surface-200 bg-white text-sm font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50 hover:shadow-md"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google bilan ro'yxatdan o'tish
                </button>
              </motion.div>
            )}

            {/* Step 2: Personal Info */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.register.fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      className={cn(
                        "flex h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm transition-all",
                        "placeholder:text-surface-400",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                        errors.fullName
                          ? "border-red-300 focus:ring-red-500"
                          : "border-surface-300 hover:border-surface-400"
                      )}
                      {...register("fullName")}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("auth.register.phone")}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+998 90 123 4567"
                      autoComplete="tel"
                      className={cn(
                        "flex h-12 w-full rounded-xl border bg-white pl-10 pr-4 text-sm transition-all",
                        "placeholder:text-surface-400",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0",
                        errors.phone
                          ? "border-red-300 focus:ring-red-500"
                          : "border-surface-300 hover:border-surface-400"
                      )}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                  <p className="text-xs text-surface-500">
                    {t("auth.register.phoneHelper")}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Role Selection */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5"
              >
                <div className="space-y-4">
                  <Label>{t("auth.register.howWillYouUse")}</Label>

                  {/* Student Option */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setValue("role", "student", { shouldValidate: true })}
                    className={cn(
                      "relative w-full rounded-2xl border-2 p-6 text-left transition-all",
                      selectedRole === "student"
                        ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/10"
                        : "border-surface-200 bg-white hover:border-surface-300"
                    )}
                  >
                    {selectedRole === "student" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-4"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-xl",
                          selectedRole === "student"
                            ? "bg-purple-500 text-white"
                            : "bg-surface-100 text-surface-600"
                        )}
                      >
                        <GraduationCap className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-surface-900">
                          {t("auth.register.studentRole")}
                        </h3>
                        <p className="mt-1 text-sm text-surface-500">
                          {t("auth.register.studentDescription")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            <Sparkles className="h-3 w-3" /> AI Resume
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                            Job Matching
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Auto Apply
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {/* Company Option */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setValue("role", "company", { shouldValidate: true })}
                    className={cn(
                      "relative w-full rounded-2xl border-2 p-6 text-left transition-all",
                      selectedRole === "company"
                        ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/10"
                        : "border-surface-200 bg-white hover:border-surface-300"
                    )}
                  >
                    {selectedRole === "company" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-4"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-xl",
                          selectedRole === "company"
                            ? "bg-purple-500 text-white"
                            : "bg-surface-100 text-surface-600"
                        )}
                      >
                        <Building2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-surface-900">
                          {t("auth.register.companyRole")}
                        </h3>
                        <p className="mt-1 text-sm text-surface-500">
                          {t("auth.register.companyDescription")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Post Jobs
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            AI Matching
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                            Analytics
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {errors.role && (
                    <p className="text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                {/* Company Name (shown when company role selected) */}
                <AnimatePresence>
                  {selectedRole === "company" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label htmlFor="companyName">Company name (optional)</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                        <input
                          id="companyName"
                          type="text"
                          placeholder="Acme Inc."
                          className="flex h-12 w-full rounded-xl border border-surface-300 bg-white pl-10 pr-4 text-sm transition-all placeholder:text-surface-400 hover:border-surface-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                          {...register("companyName")}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terms */}
                <p className="text-xs text-surface-500">
                  {t("auth.register.terms.text")}{" "}
                  <Link href="/terms" className="text-purple-600 hover:underline">
                    {t("auth.register.terms.termsLink")}
                  </Link>{" "}
                  {t("auth.register.terms.and")}{" "}
                  <Link href="/privacy" className="text-purple-600 hover:underline">
                    {t("auth.register.terms.privacyLink")}
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="h-12 flex-1 rounded-xl border-2"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {t("common.back")}
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {t("auth.register.continue")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading || !selectedRole}
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  {t("auth.register.createButton")}
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Social Login */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6"
      >
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-surface-500">yoki tezkor kirish</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
              const origin = apiBase.replace(/\/api\/v1\/?$/, "");
              window.location.href = `${origin}/api/v1/auth/oauth/google?redirect=true`;
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-surface-200 bg-white font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
              const origin = apiBase.replace(/\/api\/v1\/?$/, "");
              window.location.href = `${origin}/api/v1/auth/oauth/linkedin?redirect=true`;
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-surface-200 bg-white font-medium text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50"
          >
            <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            LinkedIn
          </button>
        </div>
      </motion.div>

      {/* Sign in link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center text-sm text-surface-500"
      >
        {t("auth.register.haveAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
        >
          {t("auth.register.signIn")}
        </Link>
      </motion.p>
    </motion.div>
  );
}
