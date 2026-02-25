/**
 * =============================================================================
 * useJobs Hook
 * =============================================================================
 *
 * Custom hook for job operations
 */

"use client";

import { useCallback, useState } from "react";
import type { Job } from "@/types/api";
import { jobApi, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface JobsState {
  jobs: Job[];
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface JobFilters {
  search?: string;
  location?: string;
  job_type?: string[];
  experience_level?: string[];
  salary_min?: number;
  salary_max?: number;
  sort_by?: "created_at" | "salary" | "relevance";
}

// =============================================================================
// HOOK
// =============================================================================

export function useJobs() {
  const [state, setState] = useState<JobsState>({
    jobs: [],
    currentJob: null,
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<JobFilters>({});

  // Fetch jobs
  const fetchJobs = useCallback(async (newFilters?: JobFilters, page: number = 1) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Update filters if provided
      if (newFilters) {
        setFilters(newFilters);
      }

      const params: any = {
        page,
        ...filters,
        ...newFilters,
      };

      const response = await jobApi.list(params);
      const data = response.data as {
        items?: Job[];
        total?: number;
        page?: number;
        limit?: number;
        pages?: number;
      };

      setState((prev) => ({
        ...prev,
        jobs: data.items || [],
        isLoading: false,
        totalCount: data.total ?? (data.items?.length || 0),
        currentPage: data.page ?? page,
        totalPages: data.pages ?? 1,
      }));
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      toast.error(message);
    }
  }, [filters]);

  // Fetch single job
  const fetchJob = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await jobApi.get(id);
      const job = response.data as Job;
      
      setState((prev) => ({
        ...prev,
        currentJob: job,
        isLoading: false,
      }));

      return job;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      toast.error(message);
    }
  }, []);

  // Search jobs
  const searchJobs = useCallback(async (query: string) => {
    return fetchJobs({ ...filters, search: query });
  }, [fetchJobs, filters]);

  // Apply filters
  const applyFilters = useCallback(async (newFilters: JobFilters) => {
    return fetchJobs({ ...filters, ...newFilters });
  }, [fetchJobs, filters]);

  // Clear filters
  const clearFilters = useCallback(async () => {
    setFilters({});
    return fetchJobs({});
  }, [fetchJobs]);

  // Match jobs to resume (AI)
  const matchJobs = useCallback(async (resumeId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await jobApi.match(resumeId);
      const data = response.data as { items?: (Job & { matchScore?: number })[] };
      const matchedJobs = data.items || [];

      setState((prev) => ({
        ...prev,
        jobs: matchedJobs,
        isLoading: false,
      }));

      return matchedJobs;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      toast.error(message);
      throw error;
    }
  }, []);

  // Save job
  const saveJob = useCallback(async (jobId: string) => {
    try {
      // In real app: await api.post(`/jobs/${jobId}/save`);
      console.log("Job saved:", jobId);
    } catch (error) {
      throw error;
    }
  }, []);

  // Unsave job
  const unsaveJob = useCallback(async (jobId: string) => {
    try {
      // In real app: await api.delete(`/jobs/${jobId}/save`);
      console.log("Job unsaved:", jobId);
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    ...state,
    filters,
    fetchJobs,
    fetchJob,
    searchJobs,
    applyFilters,
    clearFilters,
    matchJobs,
    saveJob,
    unsaveJob,
  };
}

export default useJobs;
