"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, CheckCircle2, Loader2, MapPin, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import { useResume } from "@/hooks/useResume";
import { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { AutoApplyResponse, ExperienceLevel, JobType, Resume } from "@/types/api";

const jobTypeOptions: Array<{ value: JobType; label: string }> = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "contract", label: "Contract" },
];

const experienceOptions: Array<{ value: ExperienceLevel; label: string }> = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function formatQuotaValue(value: number | "unlimited") {
  return value === "unlimited" ? "Unlimited" : value.toLocaleString();
}

function normalizeQuotaNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resolveQuotaSummary(result: AutoApplyResponse | null) {
  if (!result) {
    return null;
  }

  const quota = result.quota;
  const limitValue =
    quota?.monthly_limit ??
    quota?.limit ??
    result.monthly_limit ??
    result.quota_limit ??
    null;
  const unlimited = Boolean(
    quota?.is_unlimited ||
      quota?.unlimited ||
      result.quota_unlimited ||
      limitValue === "unlimited"
  );

  if (unlimited) {
    return {
      used:
        normalizeQuotaNumber(quota?.monthly_used) ??
        normalizeQuotaNumber(quota?.used) ??
        normalizeQuotaNumber(quota?.current) ??
        normalizeQuotaNumber(result.monthly_used) ??
        normalizeQuotaNumber(result.quota_used) ??
        normalizeQuotaNumber(result.quota_current) ??
        0,
      limit: "unlimited" as const,
      remaining: "unlimited" as const,
      percentUsed: 0,
      isUnlimited: true,
      tier: quota?.tier ?? result.quota_tier,
      feature: quota?.feature ?? result.quota_feature,
    };
  }

  const limit = normalizeQuotaNumber(limitValue);
  if (limit === null) {
    return null;
  }

  const used =
    normalizeQuotaNumber(quota?.monthly_used) ??
    normalizeQuotaNumber(quota?.used) ??
    normalizeQuotaNumber(quota?.current) ??
    normalizeQuotaNumber(result.monthly_used) ??
    normalizeQuotaNumber(result.quota_used) ??
    normalizeQuotaNumber(result.quota_current) ??
    Math.max(
      limit -
        (normalizeQuotaNumber(quota?.monthly_remaining) ??
          normalizeQuotaNumber(quota?.remaining) ??
          normalizeQuotaNumber(result.monthly_remaining) ??
          normalizeQuotaNumber(result.quota_remaining) ??
          0),
      0
    );

  const remaining =
    normalizeQuotaNumber(quota?.monthly_remaining) ??
    normalizeQuotaNumber(quota?.remaining) ??
    normalizeQuotaNumber(result.monthly_remaining) ??
    normalizeQuotaNumber(result.quota_remaining) ??
    Math.max(limit - used, 0);

  const percentUsed = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;

  return {
    used,
    limit,
    remaining,
    percentUsed,
    isUnlimited: false,
    tier: quota?.tier ?? result.quota_tier,
    feature: quota?.feature ?? result.quota_feature,
  };
}

export default function AutoApplyPage() {
  const { user } = useAuth();
  const { resumes, fetchResumes, isLoading: resumesLoading } = useResume();
  const { autoApply, isAutoApplying } = useApplications();

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobTypes, setJobTypes] = useState<JobType[]>(["full_time"]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [locations, setLocations] = useState("");
  const [keywords, setKeywords] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxApplications, setMaxApplications] = useState(10);
  const [dryRun, setDryRun] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [result, setResult] = useState<AutoApplyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const publishedResumes = useMemo(
    () => resumes.filter((resume) => resume.status === "published"),
    [resumes]
  );

  useEffect(() => {
    if (!selectedResumeId && publishedResumes[0]) {
      setSelectedResumeId(publishedResumes[0].id);
    }
  }, [publishedResumes, selectedResumeId]);

  const selectedResume = useMemo(
    () => publishedResumes.find((resume) => resume.id === selectedResumeId) || null,
    [publishedResumes, selectedResumeId]
  );

  const quotaSummary = useMemo(() => resolveQuotaSummary(result), [result]);

  const handleStart = async () => {
    if (!selectedResumeId) {
      setError("Please select a published resume first.");
      return;
    }

    setError(null);
    setResult(null);

    try {
      const response = await autoApply({
        resume_id: selectedResumeId,
        dry_run: dryRun,
        criteria: {
          job_types: jobTypes,
          locations: locations
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          experience_levels: experienceLevels,
          min_salary: minSalary ? Number(minSalary) : undefined,
          keywords: keywords
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          max_applications: maxApplications,
          include_cover_letter: includeCoverLetter,
        },
      });

      setResult(response);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const isBusy = resumesLoading || isAutoApplying;
  const showUpgradeLink = !!error && /premium|enterprise|upgrade/i.test(error);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/student/applications"
          className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Auto-apply
        </Badge>
      </div>

      <Card className="border-surface-200">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              Auto-apply to matching jobs
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Pick a published resume, set your filters, and let the backend submit matching applications.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/pricing">
              <Button variant="outline">Upgrade plan</Button>
            </Link>
            <Badge className="h-10 items-center rounded-md px-3">
              {user?.subscription_tier || "free"} tier
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Select a resume and matching rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="space-y-2">
                    <p>{error}</p>
                    {showUpgradeLink && (
                      <Link href="/pricing">
                        <Button size="sm" variant="outline">
                          Upgrade to Premium
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-surface-700">Published resume</label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a published resume" />
                </SelectTrigger>
                <SelectContent>
                  {publishedResumes.map((resume: Resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title} - {formatDate(resume.updated_at)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {publishedResumes.length === 0 && !resumesLoading && (
                <p className="text-sm text-amber-700">
                  You need at least one published resume before using auto-apply.
                  <Link href="/student/resumes" className="ml-1 underline">
                    Manage resumes
                  </Link>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700">Job types</label>
                <span className="text-xs text-surface-500">Choose one or more</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobTypeOptions.map((option) => {
                  const active = jobTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setJobTypes((prev) => toggleValue(prev, option.value))}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        active
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700">Experience levels</label>
                <span className="text-xs text-surface-500">Optional</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {experienceOptions.map((option) => {
                  const active = experienceLevels.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setExperienceLevels((prev) => toggleValue(prev, option.value))
                      }
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        active
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">Locations</label>
                <Input
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="Tashkent, Remote"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">Keywords</label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="python, backend, api"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">Minimum salary</label>
                <Input
                  type="number"
                  min="0"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="5000000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">Max applications</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={maxApplications}
                  onChange={(e) => setMaxApplications(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-700">Mode</label>
                <Button
                  type="button"
                  variant={dryRun ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setDryRun((prev) => !prev)}
                >
                  {dryRun ? "Dry run preview" : "Submit applications"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
              <div>
                <p className="text-sm font-medium text-surface-900">
                  Include cover letters
                </p>
                <p className="text-xs text-surface-500">
                  The backend can add a short cover letter when applying.
                </p>
              </div>
              <Button
                type="button"
                variant={includeCoverLetter ? "default" : "outline"}
                onClick={() => setIncludeCoverLetter((prev) => !prev)}
              >
                {includeCoverLetter ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <Button
              onClick={handleStart}
              disabled={isBusy || !selectedResumeId || publishedResumes.length === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
            >
              {isAutoApplying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {dryRun ? "Preview matching jobs" : "Start auto-apply"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-4 w-4 text-surface-400" />
                <div>
                  <p className="font-medium text-surface-900">Resume</p>
                  <p className="text-surface-500">
                    {selectedResume ? selectedResume.title : "No published resume selected"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-surface-400" />
                <div>
                  <p className="font-medium text-surface-900">Locations</p>
                  <p className="text-surface-500">{locations || "Any location"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-surface-400" />
                <div>
                  <p className="font-medium text-surface-900">Applications per run</p>
                  <p className="text-surface-500">{maxApplications}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-surface-400" />
                <div>
                  <p className="font-medium text-surface-900">Mode</p>
                  <p className="text-surface-500">{dryRun ? "Preview only" : "Real submissions"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Run summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotaSummary && (
                  <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-surface-900">Quota progress</p>
                        <p className="text-xs text-surface-500">
                          {quotaSummary.feature || "Auto-apply"} {result.dry_run ? "preview" : "usage"} for{" "}
                          {quotaSummary.tier || user?.subscription_tier || "current"} plan
                        </p>
                      </div>
                      <Badge variant={quotaSummary.isUnlimited ? "info" : "secondary"}>
                        {quotaSummary.isUnlimited ? "Unlimited" : "Monthly cap"}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                      <p className="font-medium text-surface-900">
                        {formatQuotaValue(quotaSummary.used)} / {formatQuotaValue(quotaSummary.limit)}
                      </p>
                      <p className="text-surface-500">
                        {quotaSummary.remaining === "unlimited"
                          ? "No monthly cap"
                          : `${formatQuotaValue(quotaSummary.remaining)} remaining`}
                      </p>
                    </div>

                    {quotaSummary.isUnlimited ? (
                      <div className="mt-3 rounded-full border border-dashed border-surface-300 bg-white px-3 py-2 text-xs text-surface-500">
                        This plan does not impose a monthly auto-apply limit.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <Progress
                          value={quotaSummary.percentUsed}
                          size="sm"
                          variant={quotaSummary.percentUsed >= 100 ? "warning" : "default"}
                        />
                        {result.dry_run && (
                          <p className="text-xs text-surface-500">
                            Preview mode shows the current quota state and does not consume quota.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-surface-50 p-3">
                    <p className="text-2xl font-bold text-surface-900">
                      {result.total_jobs_matched}
                    </p>
                    <p className="text-xs text-surface-500">Matched</p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-2xl font-bold text-green-700">
                      {result.applications_submitted}
                    </p>
                    <p className="text-xs text-green-600">Submitted</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-2xl font-bold text-amber-700">
                      {result.applications_skipped}
                    </p>
                    <p className="text-xs text-amber-600">Skipped</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.results.slice(0, 5).map((item) => (
                    <div
                      key={`${item.job_id}-${item.message}`}
                      className="rounded-xl border border-surface-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-surface-900">{item.job_title}</p>
                          <p className="text-sm text-surface-500">{item.company_name}</p>
                        </div>
                        <Badge variant={item.applied ? "default" : "secondary"}>
                          {item.applied ? "Applied" : "Skipped"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-surface-600">{item.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-dashed">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-medium text-surface-900">
                Before you start
              </p>
              <p className="text-sm text-surface-500">
                Auto-apply works best with a published resume and a narrow set of filters. You can use dry run first to review matches before submitting.
              </p>
              <Link href="/student/resumes">
                <Button variant="outline" className="w-full">
                  Manage resumes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
