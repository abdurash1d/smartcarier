/**
 * =============================================================================
 * JOB APPLICATION FLOW
 * =============================================================================
 *
 * Multi-step application process:
 * 1. Select Resume
 * 2. Cover Letter (optional, AI can generate)
 * 3. Additional Questions (if any)
 * 4. Review and Submit
 * 5. Success with confetti animation
 *
 * Application Status Tracking:
 * - Submitted ✓
 * - Under Review
 * - Interview Scheduled
 * - Offer Received
 * - Rejected
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  PenLine,
  HelpCircle,
  CheckSquare,
  Sparkles,
  Loader2,
  CheckCircle,
  Target,
  Building,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  AlertCircle,
  Upload,
  RefreshCw,
  Send,
  PartyPopper,
  Calendar,
  Eye,
  Download,
  Star,
  ChevronRight,
  XCircle,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatSalaryRange } from "@/lib/utils";
import type { Job, Resume } from "@/types/api";
import { useJobs } from "@/hooks/useJobs";
import { useResume } from "@/hooks/useResume";
import { useApplications } from "@/hooks/useApplications";

const additionalQuestions = [
  {
    id: "q1",
    question: "Why are you interested in this position?",
    type: "textarea",
    required: true,
  },
  {
    id: "q2",
    question: "What is your expected salary range?",
    type: "text",
    required: false,
  },
  {
    id: "q3",
    question: "When can you start?",
    type: "select",
    options: ["Immediately", "2 weeks", "1 month", "Other"],
    required: true,
  },
];

// =============================================================================
// STEP CONFIGURATION
// =============================================================================

const steps: { id: number; title: string; icon: React.ComponentType<any> }[] = [
  { id: 1, title: "Select Resume", icon: FileText },
  { id: 2, title: "Cover Letter", icon: PenLine },
  { id: 3, title: "Questions", icon: HelpCircle },
  { id: 4, title: "Review", icon: CheckSquare },
];

// =============================================================================
// STEP INDICATOR COMPONENT
// =============================================================================

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: { id: number; title: string; icon: React.ComponentType<any> }[];
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isCompleted && onStepClick(step.id)}
              disabled={!isCompleted}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                isCurrent && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                isCompleted && "cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300",
                !isCurrent && !isCompleted && "bg-surface-100 text-surface-400 dark:bg-surface-800"
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <StepIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className="mx-1 h-4 w-4 text-surface-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// RESUME SELECTOR COMPONENT
// =============================================================================

function ResumeSelector({
  resumes,
  selectedId,
  onSelect,
  jobRequirements,
}: {
  resumes: (Resume & { matchScore?: number })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  jobRequirements?: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
          Select a Resume
        </h3>
        <Link href="/student/resumes/create-ai">
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {resumes.map((resume) => {
          const isSelected = selectedId === resume.id;
          const matchingSkills = jobRequirements?.filter((skill) =>
            resume.content.skills?.technical?.some(
              (s) => s.toLowerCase() === skill.toLowerCase()
            )
          );

          return (
            <motion.div
              key={resume.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(resume.id)}
              className={cn(
                "cursor-pointer rounded-xl border-2 p-4 transition-all",
                isSelected
                  ? "border-purple-500 bg-purple-50/50 shadow-lg dark:bg-purple-900/10"
                  : "border-surface-200 hover:border-surface-300 dark:border-surface-700"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Selection Indicator */}
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isSelected
                      ? "border-purple-500 bg-purple-500"
                      : "border-surface-300 dark:border-surface-600"
                  )}
                >
                  {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                </div>

                {/* Resume Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white">
                        {resume.title}
                      </h4>
                      <p className="text-sm text-surface-500">
                        {resume.content.personal_info?.professional_title}
                      </p>
                    </div>

                    {/* Match Score */}
                    {resume.matchScore && (
                      <Badge
                        variant={
                          resume.matchScore >= 80
                            ? "success"
                            : resume.matchScore >= 60
                            ? "warning"
                            : "secondary"
                        }
                        className="gap-1 shrink-0"
                      >
                        <Target className="h-3 w-3" />
                        {resume.matchScore}% match
                      </Badge>
                    )}
                  </div>

                  {/* Skills Match */}
                  {jobRequirements && matchingSkills && matchingSkills.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs text-surface-500">
                        Matching skills ({matchingSkills.length}/{jobRequirements.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {jobRequirements.map((skill) => {
                          const hasSkill = matchingSkills.includes(skill);
                          return (
                            <Badge
                              key={skill}
                              variant={hasSkill ? "success" : "secondary"}
                              className={cn(
                                "text-xs",
                                !hasSkill && "opacity-50"
                              )}
                            >
                              {hasSkill && <CheckCircle className="mr-1 h-3 w-3" />}
                              {skill}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-surface-400">
                    {resume.ai_generated && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Generated
                      </span>
                    )}
                    {resume.ats_score && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {resume.ats_score}% ATS Score
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {resumes.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-surface-200 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-surface-300" />
          <h4 className="mt-4 font-semibold text-surface-900">No resumes yet</h4>
          <p className="mt-2 text-sm text-surface-500">
            Create a resume to apply for this job
          </p>
          <Link href="/student/resumes/create-ai">
            <Button className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600">
              <Sparkles className="mr-2 h-4 w-4" />
              Create AI Resume
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COVER LETTER EDITOR COMPONENT
// =============================================================================

function CoverLetterEditor({
  value,
  onChange,
  onGenerateAI,
  isGenerating,
  jobTitle,
  companyName,
}: {
  value: string;
  onChange: (value: string) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  jobTitle: string;
  companyName: string;
}) {
  const [tone, setTone] = useState("professional");

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "enthusiastic", label: "Enthusiastic" },
    { value: "confident", label: "Confident" },
    { value: "creative", label: "Creative" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
            Cover Letter
          </h3>
          <p className="text-sm text-surface-500">Optional but recommended</p>
        </div>
        <Badge variant="secondary">Optional</Badge>
      </div>

      {/* AI Generation Card */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900 dark:text-white">
                  Generate with AI
                </p>
                <p className="text-sm text-surface-500">
                  Create a personalized cover letter instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
              >
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={onGenerateAI}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Editor */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Dear Hiring Manager at ${companyName},\n\nI am writing to express my interest in the ${jobTitle} position...`}
          className="min-h-[300px] resize-none"
        />
        <div className="absolute bottom-3 right-3 text-xs text-surface-400">
          {value.length} / 2000 characters
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800/50">
        <h4 className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
          💡 Tips for a great cover letter:
        </h4>
        <ul className="space-y-1 text-sm text-surface-500">
          <li>• Mention specific skills that match the job requirements</li>
          <li>• Share a relevant achievement or project</li>
          <li>• Show enthusiasm for the company and role</li>
          <li>• Keep it concise (250-400 words)</li>
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// QUESTIONS FORM COMPONENT
// =============================================================================

function QuestionsForm({
  questions,
  answers,
  onChange,
}: {
  questions: typeof additionalQuestions;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h3 className="mt-4 font-display text-lg font-semibold text-surface-900 dark:text-white">
          No additional questions
        </h3>
        <p className="mt-2 text-surface-500">
          This employer hasn't added any screening questions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
          Additional Questions
        </h3>
        <p className="text-sm text-surface-500">
          Please answer the following questions from the employer
        </p>
      </div>

      {questions.map((q, index) => (
        <div key={q.id} className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
              {index + 1}
            </span>
            {q.question}
            {q.required && <span className="text-red-500">*</span>}
          </Label>

          {q.type === "textarea" ? (
            <Textarea
              value={answers[q.id] || ""}
              onChange={(e) => onChange(q.id, e.target.value)}
              placeholder="Type your answer..."
              rows={4}
            />
          ) : q.type === "select" ? (
            <select
              value={answers[q.id] || ""}
              onChange={(e) => onChange(q.id, e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 dark:border-surface-700 dark:bg-surface-800"
            >
              <option value="">Select an option</option>
              {q.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={answers[q.id] || ""}
              onChange={(e) => onChange(q.id, e.target.value)}
              placeholder="Type your answer..."
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// REVIEW SECTION COMPONENT
// =============================================================================

function ReviewSection({
  job,
  resume,
  coverLetter,
  answers,
  questions,
}: {
  job: Job;
  resume: Resume | null;
  coverLetter: string;
  answers: Record<string, string>;
  questions: typeof additionalQuestions;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
          Review Your Application
        </h3>
        <p className="text-sm text-surface-500">
          Please review your application before submitting
        </p>
      </div>

      {/* Job Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xl font-bold text-purple-600">
              {job.company?.name?.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white">
                {job.title}
              </h4>
              <p className="text-surface-500">{job.company?.name}</p>
              <div className="mt-1 flex items-center gap-3 text-sm text-surface-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatSalaryRange(job.salary_min, job.salary_max)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Resume */}
      <div className="rounded-xl border border-surface-200 p-4 dark:border-surface-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Resume</p>
              <p className="font-semibold text-surface-900 dark:text-white">
                {resume?.title || "No resume selected"}
              </p>
            </div>
          </div>
          {resume && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Cover Letter */}
      <div className="rounded-xl border border-surface-200 p-4 dark:border-surface-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <PenLine className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">Cover Letter</p>
              <p className="font-semibold text-surface-900 dark:text-white">
                {coverLetter ? `${coverLetter.length} characters` : "Not provided"}
              </p>
            </div>
          </div>
          {coverLetter ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Included
            </Badge>
          ) : (
            <Badge variant="secondary">Optional</Badge>
          )}
        </div>
        {coverLetter && (
          <div className="mt-3 max-h-32 overflow-hidden rounded-lg bg-surface-50 p-3 text-sm text-surface-600 dark:bg-surface-800/50">
            <p className="line-clamp-4">{coverLetter}</p>
          </div>
        )}
      </div>

      {/* Answers */}
      {questions.length > 0 && (
        <div className="rounded-xl border border-surface-200 p-4 dark:border-surface-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <HelpCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-500">
                Additional Questions
              </p>
              <p className="font-semibold text-surface-900 dark:text-white">
                {Object.keys(answers).length}/{questions.length} answered
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="rounded-lg bg-surface-50 p-3 dark:bg-surface-800/50">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {q.question}
                </p>
                <p className="mt-1 text-sm text-surface-600">
                  {answers[q.id] || (
                    <span className="italic text-surface-400">Not answered</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation */}
      <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">
              Ready to submit
            </p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
              By submitting, you confirm that the information provided is accurate
              and you agree to the company's application terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUCCESS SCREEN COMPONENT
// =============================================================================

function SuccessScreen({ job, onViewApplications }: { job: Job; onViewApplications: () => void }) {
  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366F1", "#8B5CF6", "#10B981"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366F1", "#8B5CF6", "#10B981"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative mb-6"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 rounded-full border-2 border-dashed border-green-300"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
          Application Submitted! 🎉
        </h2>
        <p className="mt-2 text-surface-500">
          Your application for <strong>{job.title}</strong> at{" "}
          <strong>{job.company?.name}</strong> has been sent successfully.
        </p>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 w-full max-w-md"
      >
        <h3 className="mb-4 font-semibold text-surface-900 dark:text-white">
          What happens next?
        </h3>
        <div className="space-y-3 text-left">
          {[
            {
              step: 1,
              title: "Application Received",
              desc: "The employer has been notified",
              status: "completed",
            },
            {
              step: 2,
              title: "Under Review",
              desc: "Your application is being reviewed",
              status: "current",
            },
            {
              step: 3,
              title: "Interview",
              desc: "You may be invited for an interview",
              status: "pending",
            },
            {
              step: 4,
              title: "Decision",
              desc: "You'll receive a response",
              status: "pending",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                "flex items-center gap-4 rounded-xl p-3",
                item.status === "completed" && "bg-green-50 dark:bg-green-900/20",
                item.status === "current" && "bg-blue-50 dark:bg-blue-900/20",
                item.status === "pending" && "bg-surface-50 dark:bg-surface-800/50"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  item.status === "completed" && "bg-green-500 text-white",
                  item.status === "current" && "bg-blue-500 text-white",
                  item.status === "pending" && "bg-surface-200 text-surface-500"
                )}
              >
                {item.status === "completed" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  item.step
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "font-medium",
                    item.status === "completed" && "text-green-700 dark:text-green-300",
                    item.status === "current" && "text-blue-700 dark:text-blue-300",
                    item.status === "pending" && "text-surface-500"
                  )}
                >
                  {item.title}
                </p>
                <p className="text-sm text-surface-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex gap-3"
      >
        <Link href="/student/jobs">
          <Button variant="outline">Browse More Jobs</Button>
        </Link>
        <Button
          onClick={onViewApplications}
          className="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          View My Applications
        </Button>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const { fetchJob, currentJob, isLoading: jobLoading } = useJobs();
  const { resumes, fetchResumes, isLoading: resumesLoading } = useResume();
  const { applyToJob } = useApplications();

  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<(Job & { matchScore?: number }) | null>(null);
  const [resumesState, setResumesState] = useState<(Resume & { matchScore?: number })[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Form state
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Load job and resumes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchJob(jobId), fetchResumes()]);

      // Sync local copies
      if (currentJob) {
        setJob(currentJob as Job & { matchScore?: number });
      }
      if (resumes.length > 0) {
        setResumesState(resumes as (Resume & { matchScore?: number })[]);
        const bestMatch = (resumes as (Resume & { matchScore?: number })[]).reduce(
          (best, current) =>
            (current.matchScore || 0) > (best.matchScore || 0) ? current : best
        );
        setSelectedResumeId(bestMatch.id);
      }
      setIsLoading(false);
    };
    loadData();
  }, [jobId, fetchJob, fetchResumes, currentJob, resumes]);

  // Get selected resume
  const selectedResume = resumesState.find((r) => r.id === selectedResumeId) || null;

  // Validate current step
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!selectedResumeId;
      case 2:
        return true; // Cover letter is optional
      case 3:
        // Check required questions
        return additionalQuestions
          .filter((q) => q.required)
          .every((q) => answers[q.id]?.trim());
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Generate AI cover letter
  const handleGenerateCoverLetter = async () => {
    if (!job || !selectedResume) return;

    setIsGeneratingCover(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const generatedLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company?.name}. With my background in ${selectedResume.content.skills?.technical?.slice(0, 3).join(", ")}, I am confident that I would be a valuable addition to your team.

Throughout my career, I have developed expertise in building scalable applications and leading development teams. My experience aligns well with the requirements outlined in your job posting, particularly in ${job.requirements.skills?.slice(0, 2).join(" and ")}.

I am particularly excited about this opportunity because of ${job.company?.name}'s reputation for innovation and commitment to excellence. I am eager to contribute my skills and grow with your team.

Thank you for considering my application. I look forward to the opportunity to discuss how my experience and enthusiasm can contribute to your team's success.

Best regards,
${selectedResume.content.personal_info?.name || "John Doe"}`;

    setCoverLetter(generatedLetter);
    setIsGeneratingCover(false);
  };

  // Submit application
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!job || !selectedResumeId) {
        throw new Error("Please select a resume before submitting.");
      }
      await applyToJob({
        job_id: job.id,
        resume_id: selectedResumeId,
        cover_letter: coverLetter || undefined,
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep < 4 && isStepValid()) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 4) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Skeleton className="mb-8 h-12 w-full" />
        <Skeleton className="mb-4 h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-surface-900">Job not found</h2>
        <p className="mt-2 text-surface-500">
          This job posting may have been removed or is no longer available.
        </p>
        <Link href="/student/jobs">
          <Button className="mt-6">Browse Other Jobs</Button>
        </Link>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <SuccessScreen
          job={job}
          onViewApplications={() => router.push("/student/applications")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Back Button */}
      <Link
        href={`/student/jobs`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Job
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
          Apply for {job.title}
        </h1>
        <p className="mt-1 text-surface-500">at {job.company?.name}</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
        <Progress
          value={(currentStep / steps.length) * 100}
          className="mt-4 h-1"
        />
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ResumeSelector
                  resumes={resumes}
                  selectedId={selectedResumeId}
                  onSelect={setSelectedResumeId}
                  jobRequirements={job.requirements.skills}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CoverLetterEditor
                  value={coverLetter}
                  onChange={setCoverLetter}
                  onGenerateAI={handleGenerateCoverLetter}
                  isGenerating={isGeneratingCover}
                  jobTitle={job.title}
                  companyName={job.company?.name || ""}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <QuestionsForm
                  questions={additionalQuestions}
                  answers={answers}
                  onChange={(id, value) =>
                    setAnswers((prev) => ({ ...prev, [id]: value }))
                  }
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ReviewSection
                  job={job}
                  resume={selectedResume}
                  coverLetter={coverLetter}
                  answers={answers}
                  questions={additionalQuestions}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isStepValid() || isSubmitting}
          className="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : currentStep === 4 ? (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
















