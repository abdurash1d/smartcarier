/**
 * Company Applicants Page
 * View and manage all applicants
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  FileText,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { formatRelativeTime, cn } from "@/lib/utils";
import { jobApi, applicationApi, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/types/api";

export default function CompanyApplicantsPage() {
  const { jobs, fetchMyJobs } = useJobs();
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchMyJobs();
  }, []);

  // When jobs load, fetch applications for each job
  useEffect(() => {
    if (jobs.length === 0) return;
    const loadApplications = async () => {
      setIsLoading(true);
      try {
        const jobsToFetch = selectedJob === "all" ? jobs : jobs.filter(j => j.id === selectedJob);
        const allApps: any[] = [];
        for (const job of jobsToFetch) {
          try {
            const res = await jobApi.applications(job.id);
            const data = res.data as { items?: any[] };
            const apps = data.items || [];
            allApps.push(...apps.map((a: any) => ({ ...a, job })));
          } catch {
            // skip jobs with no application access
          }
        }
        setApplications(allApps);
      } finally {
        setIsLoading(false);
      }
    };
    loadApplications();
  }, [jobs, selectedJob]);

  // Filter applications
  const filteredApplications = applications.filter((app: any) => {
    const matchesSearch =
      !searchQuery ||
      app.applicant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await applicationApi.updateStatus(applicationId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
      toast.success("Holat yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-white">
          Applicants
        </h1>
        <p className="mt-1 text-surface-500">
          Review and manage candidates for your job postings
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Job filter */}
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applicants List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                <Users className="h-8 w-8 text-surface-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white">
                No applicants found
              </h3>
              <p className="mt-2 max-w-sm text-surface-500">
                {selectedJob === "all"
                  ? "You haven't received any applications yet."
                  : "No applicants match your current filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-200 dark:divide-surface-700">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                >
                  {/* Applicant info */}
                  <div className="flex items-center gap-4 flex-1">
                    <UserAvatar
                      name={application.applicant?.full_name || "Applicant"}
                      imageUrl={application.applicant?.avatar_url}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-surface-900 dark:text-white">
                        {application.applicant?.full_name || "Unknown"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-surface-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.applicant?.email}
                        </span>
                        {application.applicant?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {application.applicant.location}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-surface-500">
                        Applied for <strong>{application.job?.title}</strong>{" "}
                        {formatRelativeTime(application.applied_at)}
                      </p>
                    </div>
                  </div>

                  {/* Match score */}
                  {application.match_score && (
                    <div className="text-center sm:text-right">
                      <p className="text-2xl font-bold text-brand-600">
                        {application.match_score}
                      </p>
                      <p className="text-xs text-surface-500">Match Score</p>
                    </div>
                  )}

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <Select
                      value={application.status}
                      onValueChange={(value) =>
                        handleStatusChange(application.id, value)
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Link href={`/company/applicants/${application.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
















