/**
 * =============================================================================
 * STUDENT DASHBOARD - Job Search Page (Enhanced)
 * =============================================================================
 *
 * Layout:
 * - Left sidebar: Filters
 * - Main area: Job listings
 * - Right sidebar: Job details (when selected)
 *
 * Features:
 * - Advanced filters (location, type, experience, salary, company, date)
 * - Job cards with quick apply, save/bookmark
 * - Job details panel
 * - Infinite scroll / pagination
 * - Search with autocomplete
 * - Sort options
 * - AI Match Score badges
 * - Loading skeletons
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building,
  Building2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Calendar,
  Share2,
  Send,
  CheckCircle,
  Star,
  ArrowUpRight,
  Loader2,
  RotateCcw,
  GraduationCap,
  Award,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatRelativeTime, formatSalaryRange, cn } from "@/lib/utils";
import { jobApi } from "@/lib/api";
import { toast } from "sonner";
import type { Job, JobType, ExperienceLevel } from "@/types/api";

// NOTE: Job data is loaded from backend via useJobs().

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const locationOptions = [
  { value: "tashkent", label: "Tashkent" },
  { value: "samarkand", label: "Samarkand" },
  { value: "bukhara", label: "Bukhara" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const jobTypeOptions = [
  { value: "full_time", label: "Full Time", icon: Briefcase },
  { value: "part_time", label: "Part Time", icon: Clock },
  { value: "remote", label: "Remote", icon: Globe },
  { value: "hybrid", label: "Hybrid", icon: Building2 },
  { value: "contract", label: "Contract", icon: Calendar },
];

const experienceLevelOptions = [
  { value: "junior", label: "Junior", sublabel: "0-2 years" },
  { value: "mid", label: "Mid-Level", sublabel: "2-5 years" },
  { value: "senior", label: "Senior", sublabel: "5+ years" },
  { value: "lead", label: "Lead/Manager", sublabel: "7+ years" },
];

const datePostedOptions = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "Any time" },
];

const companyOptions = [
  "EPAM Systems",
  "Uzum Market",
  "Click.uz",
  "Payme",
  "MyTaxi",
  "Korzinka",
];

// =============================================================================
// SALARY SLIDER COMPONENT
// =============================================================================

function SalarySlider({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-500">Min: ${value[0].toLocaleString()}</span>
        <span className="text-surface-500">Max: ${value[1].toLocaleString()}</span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-200">
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
          style={{
            left: `${(value[0] / 10000) * 100}%`,
            right: `${100 - (value[1] / 10000) * 100}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={10000}
          step={100}
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <input
          type="range"
          min={0}
          max={10000}
          step={100}
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value) || 0, value[1]])}
          className="text-center text-sm"
          placeholder="Min"
        />
        <span className="flex items-center text-surface-400">-</span>
        <Input
          type="number"
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value) || 10000])}
          className="text-center text-sm"
          placeholder="Max"
        />
      </div>
    </div>
  );
}

// =============================================================================
// FILTER SECTION COMPONENT
// =============================================================================

function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-surface-200 py-4 dark:border-surface-700">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-surface-900 dark:text-white">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-surface-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-surface-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// JOB CARD COMPONENT
// =============================================================================

function JobCard({
  job,
  isSelected,
  isSaved,
  onSelect,
  onToggleSave,
  onQuickApply,
}: {
  job: Job & { matchScore?: number };
  isSelected: boolean;
  isSaved: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
  onQuickApply: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-xl border-2 p-4 transition-all",
        isSelected
          ? "border-purple-500 bg-purple-50/50 shadow-lg dark:bg-purple-900/10"
          : "border-transparent bg-white hover:border-surface-200 hover:shadow-md dark:bg-surface-800 dark:hover:border-surface-600"
      )}
    >
      <div className="flex gap-4">
        {/* Company Logo */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xl font-bold text-purple-600 dark:from-purple-900/50 dark:to-indigo-900/50">
          {job.company?.name?.charAt(0) || "C"}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-surface-900 dark:text-white truncate">
                {job.title}
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {job.company?.name}
              </p>
            </div>

            {/* Match Score Badge */}
            {job.matchScore && (
              <Badge
                variant={job.matchScore >= 80 ? "success" : job.matchScore >= 60 ? "warning" : "secondary"}
                className="shrink-0 gap-1"
              >
                <Target className="h-3 w-3" />
                {job.matchScore}%
              </Badge>
            )}
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            {job.job_type === "remote" && (
              <Badge variant="remote" className="text-xs py-0">
                Remote
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatSalaryRange(job.salary_min, job.salary_max)}
            </span>
          </div>

          {/* Skills Tags */}
          <div className="mt-3 flex flex-wrap gap-1">
            {job.requirements.skills?.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {(job.requirements.skills?.length || 0) > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{(job.requirements.skills?.length || 0) - 4}
              </Badge>
            )}
          </div>

          {/* Bottom Row */}
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-surface-400">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(job.created_at)}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
                className={cn(
                  "rounded-lg p-1.5 transition-colors",
                  isSaved
                    ? "bg-purple-100 text-purple-600"
                    : "text-surface-400 hover:bg-surface-100 hover:text-surface-600"
                )}
              >
                {isSaved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickApply();
                }}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-xs"
              >
                <Zap className="mr-1 h-3 w-3" />
                Quick Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// JOB DETAILS PANEL COMPONENT
// =============================================================================

function JobDetailsPanel({
  job,
  isSaved,
  onClose,
  onToggleSave,
  onApply,
  onShare,
}: {
  job: Job & { matchScore?: number };
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onApply: () => void;
  onShare: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-surface-200 p-6 dark:border-surface-700">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-2xl font-bold text-purple-600">
            {job.company?.name?.charAt(0) || "C"}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-surface-900 dark:text-white">
              {job.title}
            </h2>
            <p className="text-surface-600">{job.company?.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {job.matchScore && (
                <Badge
                  variant={job.matchScore >= 80 ? "success" : "warning"}
                  className="gap-1"
                >
                  <Target className="h-3 w-3" />
                  {job.matchScore}% Match
                </Badge>
              )}
              <Badge variant={job.job_type as any}>{job.job_type.replace("_", " ")}</Badge>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-50 p-4 dark:bg-surface-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Location</p>
              <p className="font-medium text-surface-900 dark:text-white">{job.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Salary</p>
              <p className="font-medium text-surface-900 dark:text-white">
                {formatSalaryRange(job.salary_min, job.salary_max)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Experience</p>
              <p className="font-medium text-surface-900 dark:text-white">
                {job.experience_level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Applicants</p>
              <p className="font-medium text-surface-900 dark:text-white">
                {job.applications_count} applied
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
            Job Description
          </h3>
          <div className="mt-3 whitespace-pre-line text-sm text-surface-600 dark:text-surface-400">
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-6">
          <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
            Requirements
          </h3>
          <div className="mt-3 space-y-4">
            {/* Skills */}
            <div>
              <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                Required Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {job.requirements.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Experience */}
            {job.requirements.experience && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
                  <Clock className="h-4 w-4 text-surface-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Experience</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {job.requirements.experience}
                  </p>
                </div>
              </div>
            )}
            {/* Education */}
            {job.requirements.education && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
                  <GraduationCap className="h-4 w-4 text-surface-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Education</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {job.requirements.education}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Company */}
        <div className="mt-6">
          <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
            About {job.company?.name}
          </h3>
          <div className="mt-3 rounded-xl border border-surface-200 p-4 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xl font-bold text-purple-600">
                {job.company?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">
                  {job.company?.name}
                </p>
                <p className="text-sm text-surface-500">Technology Company</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
              A leading technology company in Uzbekistan, building innovative solutions
              for millions of users across Central Asia.
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-surface-500">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                500+ employees
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                epam.com
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-surface-200 p-4 dark:border-surface-700">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onToggleSave}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="mr-2 h-4 w-4" />
                Save for Later
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <Button
          className="mt-3 w-full bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25"
          onClick={onApply}
        >
          <Send className="mr-2 h-4 w-4" />
          Apply Now
        </Button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// SEARCH SUGGESTIONS
// =============================================================================

const searchSuggestions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Data Scientist",
  "Mobile Developer",
  "Python Developer",
  "React Developer",
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function JobsPage() {
  const { jobs, isLoading, fetchJobs } = useJobs();
  const [localJobs, setLocalJobs] = useState<(Job & { matchScore?: number })[]>([]);
  const [selectedJob, setSelectedJob] = useState<(Job & { matchScore?: number }) | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load jobs from backend
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchJobs();
    // Load saved jobs
    jobApi.savedJobs({ limit: 100 }).then((res) => {
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setSavedJobs(new Set(data.map((j: any) => j.id)));
      }
    }).catch(() => {});
  }, []);

  // Keep localJobs in sync (and allow adding matchScore client-side later)
  useEffect(() => {
    setLocalJobs(jobs as (Job & { matchScore?: number })[]);
  }, [jobs]);

  // Filter states
  const [filters, setFilters] = useState({
    locations: [] as string[],
    jobTypes: [] as string[],
    experienceLevels: [] as string[],
    salaryRange: [0, 10000] as [number, number],
    companies: [] as string[],
    datePosted: "all",
  });

  // Filter section open states
  const [openSections, setOpenSections] = useState({
    location: true,
    jobType: true,
    experience: true,
    salary: true,
    company: false,
    datePosted: false,
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Toggle filter section
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Toggle filter value
  const toggleFilterValue = (
    filterKey: "locations" | "jobTypes" | "experienceLevels" | "companies",
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[filterKey];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues };
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      locations: [],
      jobTypes: [],
      experienceLevels: [],
      salaryRange: [0, 10000],
      companies: [],
      datePosted: "all",
    });
  };

  // Count active filters
  const activeFiltersCount =
    filters.locations.length +
    filters.jobTypes.length +
    filters.experienceLevels.length +
    filters.companies.length +
    (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 10000 ? 1 : 0) +
    (filters.datePosted !== "all" ? 1 : 0);

  // Filter jobs
  const filteredJobs = localJobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.requirements.skills?.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesLocation =
      filters.locations.length === 0 ||
      filters.locations.some((loc) =>
        job.location.toLowerCase().includes(loc.toLowerCase())
      );

    const matchesJobType =
      filters.jobTypes.length === 0 || filters.jobTypes.includes(job.job_type);

    const matchesExperience =
      filters.experienceLevels.length === 0 ||
      filters.experienceLevels.includes(job.experience_level);

    const matchesSalary =
      (job.salary_max || 0) >= filters.salaryRange[0] &&
      (job.salary_min || 0) <= filters.salaryRange[1];

    const matchesCompany =
      filters.companies.length === 0 ||
      filters.companies.includes(job.company?.name || "");

    return (
      matchesSearch &&
      matchesLocation &&
      matchesJobType &&
      matchesExperience &&
      matchesSalary &&
      matchesCompany
    );
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "salary":
        return (b.salary_max || 0) - (a.salary_max || 0);
      case "date":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "relevance":
      default:
        return (b.matchScore || 0) - (a.matchScore || 0);
    }
  });

  // Toggle save job (connected to real API)
  const toggleSaveJob = async (jobId: string) => {
    const isSaved = savedJobs.has(jobId);
    // Optimistic update
    setSavedJobs((prev) => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
    try {
      if (isSaved) {
        await jobApi.unsaveJob(jobId);
        toast.success("Ish saqlanganlardan o'chirildi.");
      } else {
        await jobApi.saveJob(jobId);
        toast.success("Ish saqlandi!");
      }
    } catch {
      // Revert on error
      setSavedJobs((prev) => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(jobId);
        } else {
          newSet.delete(jobId);
        }
        return newSet;
      });
      toast.error("Xatolik yuz berdi.");
    }
  };

  // Handle apply
  const handleApply = (job: Job) => {
    setSelectedJob(job as any);
    setShowApplyDialog(true);
  };

  // Infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate loading more jobs
          setTimeout(() => {
            setIsLoadingMore(false);
          }, 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoadingMore]);

  // Select first job on desktop
  useEffect(() => {
    if (sortedJobs.length > 0 && !selectedJob && window.innerWidth >= 1280) {
      setSelectedJob(sortedJobs[0]);
    }
  }, [sortedJobs]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Sidebar - Filters */}
      <aside
        className={cn(
          "w-72 shrink-0 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm dark:bg-surface-800",
          "hidden lg:block"
        )}
      >
        <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            <span className="font-display font-semibold text-surface-900 dark:text-white">
              Filters
            </span>
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {/* Location Filter */}
        <FilterSection
          title="Location"
          isOpen={openSections.location}
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-2">
            {locationOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <input
                  type="checkbox"
                  checked={filters.locations.includes(option.value)}
                  onChange={() => toggleFilterValue("locations", option.value)}
                  className="h-4 w-4 rounded border-surface-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Job Type Filter */}
        <FilterSection
          title="Job Type"
          isOpen={openSections.jobType}
          onToggle={() => toggleSection("jobType")}
        >
          <div className="space-y-2">
            {jobTypeOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <input
                  type="checkbox"
                  checked={filters.jobTypes.includes(option.value)}
                  onChange={() => toggleFilterValue("jobTypes", option.value)}
                  className="h-4 w-4 rounded border-surface-300 text-purple-600 focus:ring-purple-500"
                />
                <option.icon className="h-4 w-4 text-surface-400" />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Experience Level Filter */}
        <FilterSection
          title="Experience Level"
          isOpen={openSections.experience}
          onToggle={() => toggleSection("experience")}
        >
          <div className="space-y-2">
            {experienceLevelOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <input
                  type="checkbox"
                  checked={filters.experienceLevels.includes(option.value)}
                  onChange={() => toggleFilterValue("experienceLevels", option.value)}
                  className="h-4 w-4 rounded border-surface-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm text-surface-700 dark:text-surface-300">
                    {option.label}
                  </span>
                  <span className="ml-1 text-xs text-surface-400">
                    ({option.sublabel})
                  </span>
                </div>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Salary Range Filter */}
        <FilterSection
          title="Salary Range"
          isOpen={openSections.salary}
          onToggle={() => toggleSection("salary")}
        >
          <SalarySlider
            value={filters.salaryRange}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, salaryRange: value }))
            }
          />
        </FilterSection>

        {/* Company Filter */}
        <FilterSection
          title="Company"
          isOpen={openSections.company}
          onToggle={() => toggleSection("company")}
        >
          <div className="space-y-2">
            {companyOptions.map((company) => (
              <label
                key={company}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <input
                  type="checkbox"
                  checked={filters.companies.includes(company)}
                  onChange={() => toggleFilterValue("companies", company)}
                  className="h-4 w-4 rounded border-surface-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {company}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Date Posted Filter */}
        <FilterSection
          title="Date Posted"
          isOpen={openSections.datePosted}
          onToggle={() => toggleSection("datePosted")}
        >
          <div className="space-y-2">
            {datePostedOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-50 dark:hover:bg-surface-700"
              >
                <input
                  type="radio"
                  name="datePosted"
                  checked={filters.datePosted === option.value}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, datePosted: option.value }))
                  }
                  className="h-4 w-4 border-surface-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </aside>

      {/* Main Content - Job Listings */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Search & Sort Bar */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full rounded-xl border border-surface-200 bg-white py-3 pl-12 pr-4 text-sm placeholder-surface-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-surface-700 dark:bg-surface-800"
            />

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
              {showSuggestions && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-surface-200 bg-white p-2 shadow-lg dark:border-surface-700 dark:bg-surface-800"
                >
                  {searchSuggestions
                    .filter((s) =>
                      s.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700"
                      >
                        <Search className="h-4 w-4 text-surface-400" />
                        {suggestion}
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Filters Button */}
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Relevance
                  </span>
                </SelectItem>
                <SelectItem value="date">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Most Recent
                  </span>
                </SelectItem>
                <SelectItem value="salary">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Highest Salary
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing{" "}
            <span className="font-medium text-surface-900 dark:text-white">
              {sortedJobs.length}
            </span>{" "}
            jobs
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-purple-600 hover:underline lg:hidden"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800"
                >
                  <div className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100">
                <Briefcase className="h-10 w-10 text-surface-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-surface-900 dark:text-white">
                No jobs found
              </h3>
              <p className="mt-2 max-w-sm text-surface-500">
                Try adjusting your search or filter criteria to find more opportunities.
              </p>
              <Button variant="outline" onClick={resetFilters} className="mt-6">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sortedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    isSaved={savedJobs.has(job.id)}
                    onSelect={() => setSelectedJob(job)}
                    onToggleSave={() => toggleSaveJob(job.id)}
                    onQuickApply={() => handleApply(job)}
                  />
                ))}
              </AnimatePresence>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="py-4 text-center">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2 text-sm text-surface-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more jobs...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Job Details */}
      <aside className="hidden w-[400px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-surface-800 xl:block">
        <AnimatePresence mode="wait">
          {selectedJob ? (
            <JobDetailsPanel
              key={selectedJob.id}
              job={selectedJob}
              isSaved={savedJobs.has(selectedJob.id)}
              onClose={() => setSelectedJob(null)}
              onToggleSave={() => toggleSaveJob(selectedJob.id)}
              onApply={() => handleApply(selectedJob)}
              onShare={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/jobs/${selectedJob.id}`
                );
              }}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center p-8 text-center"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700">
                <Briefcase className="h-10 w-10 text-surface-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
                Select a job
              </h3>
              <p className="mt-2 text-sm text-surface-500">
                Click on a job to view details
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Mobile Job Details Dialog */}
      <Dialog
        open={!!selectedJob && window.innerWidth < 1280}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0">
          {selectedJob && (
            <JobDetailsPanel
              job={selectedJob}
              isSaved={savedJobs.has(selectedJob.id)}
              onClose={() => setSelectedJob(null)}
              onToggleSave={() => toggleSaveJob(selectedJob.id)}
              onApply={() => handleApply(selectedJob)}
              onShare={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/jobs/${selectedJob.id}`
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              at {selectedJob?.company?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Select Resume
              </label>
              <Select defaultValue="resume-1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resume-1">
                    <span className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">95% match</Badge>
                      Senior Software Engineer Resume
                    </span>
                  </SelectItem>
                  <SelectItem value="resume-2">
                    <span className="flex items-center gap-2">
                      <Badge variant="warning" className="text-xs">78% match</Badge>
                      Full Stack Developer Resume
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Cover Letter (Optional)
              </label>
              <textarea
                className="w-full rounded-lg border border-surface-300 p-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                rows={4}
                placeholder="Write a brief cover letter or use AI to generate one..."
              />
              <div className="mt-2 flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Generate with AI
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-surface-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-surface-600">
                  Your resume matches <strong>95%</strong> of the job requirements
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowApplyDialog(false);
                  // Show success toast
                }}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Filters Dialog */}
      <Dialog open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          
          {/* Same filter content as sidebar */}
          <div className="space-y-4">
            {/* Location */}
            <div>
              <label className="mb-2 block text-sm font-medium">Location</label>
              <div className="space-y-2">
                {locationOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(option.value)}
                      onChange={() => toggleFilterValue("locations", option.value)}
                      className="h-4 w-4 rounded border-surface-300 text-purple-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div>
              <label className="mb-2 block text-sm font-medium">Job Type</label>
              <div className="space-y-2">
                {jobTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={filters.jobTypes.includes(option.value)}
                      onChange={() => toggleFilterValue("jobTypes", option.value)}
                      className="h-4 w-4 rounded border-surface-300 text-purple-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="mb-2 block text-sm font-medium">Experience</label>
              <div className="space-y-2">
                {experienceLevelOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={filters.experienceLevels.includes(option.value)}
                      onChange={() => toggleFilterValue("experienceLevels", option.value)}
                      className="h-4 w-4 rounded border-surface-300 text-purple-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div>
              <label className="mb-2 block text-sm font-medium">Salary Range</label>
              <SalarySlider
                value={filters.salaryRange}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, salaryRange: value }))
                }
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              Reset
            </Button>
            <Button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
