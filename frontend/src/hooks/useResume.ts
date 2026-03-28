/**
 * =============================================================================
 * useResume Hook
 * =============================================================================
 *
 * Custom hook for resume operations
 */

"use client";

import { useCallback, useState } from "react";
import type { Resume } from "@/types/api";
import { resumeApi, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

interface CreateResumeData {
  title: string;
  content: Record<string, any>;
}

interface GenerateResumeData {
  user_data: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: Array<{
      company: string;
      position: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field?: string;
      year: string;
    }>;
  };
  template?: "modern" | "classic" | "minimal" | "creative";
  tone?: "professional" | "confident" | "friendly" | "technical";
}

// =============================================================================
// HOOK
// =============================================================================

export function useResume() {
  const [state, setState] = useState<ResumeState>({
    resumes: [],
    currentResume: null,
    isLoading: false,
    isGenerating: false,
    error: null,
  });

  // Fetch all resumes
  const fetchResumes = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.list();
      const data = response.data as { resumes?: Resume[] };

      setState((prev) => ({
        ...prev,
        resumes: data.resumes || [],
        isLoading: false,
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
  }, []);

  // Fetch single resume
  const fetchResume = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.get(id);
      const resume = response.data as Resume;

      setState((prev) => ({
        ...prev,
        currentResume: resume,
        isLoading: false,
      }));
      return resume;
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

  // Create resume manually
  const createResume = useCallback(async (data: CreateResumeData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.create(data);
      const newResume = response.data as Resume;

      setState((prev) => ({
        ...prev,
        resumes: [newResume, ...prev.resumes],
        currentResume: newResume,
        isLoading: false,
      }));

      toast.success("Resume created successfully");
      return newResume;
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

  // Generate resume with AI
  const generateResume = useCallback(async (data: GenerateResumeData) => {
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await resumeApi.generateAI(data as any);
      const result = response.data as {
        success: boolean;
        message?: string;
        resume?: Resume;
      };

      if (!result.success || !result.resume) {
        throw new Error(result.message || "Failed to generate resume with AI");
      }

      const newResume = result.resume;

      setState((prev) => ({
        ...prev,
        resumes: [newResume, ...prev.resumes],
        currentResume: newResume,
        isGenerating: false,
      }));

      toast.success("AI resume generated successfully");
      return newResume;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: message,
      }));
      toast.error(message);
      throw error;
    }
  }, []);

  // Update resume
  const updateResume = useCallback(async (id: string, data: Partial<Resume>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.update(id, data);
      const updated = response.data as Resume;

      setState((prev) => ({
        ...prev,
        resumes: prev.resumes.map((r) =>
          r.id === id ? updated : r
        ),
        currentResume:
          prev.currentResume?.id === id
            ? updated
            : prev.currentResume,
        isLoading: false,
      }));
      toast.success("Resume updated");
      return updated;
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

  // Delete resume
  const deleteResume = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await resumeApi.delete(id);

      setState((prev) => ({
        ...prev,
        resumes: prev.resumes.filter((r) => r.id !== id),
        currentResume: prev.currentResume?.id === id ? null : prev.currentResume,
        isLoading: false,
      }));
      toast.success("Resume deleted");
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

  // Publish resume
  const publishResume = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.publish(id);
      const updated = response.data as Resume;

      setState((prev) => ({
        ...prev,
        resumes: prev.resumes.map((r) => (r.id === id ? updated : r)),
        currentResume: prev.currentResume?.id === id ? updated : prev.currentResume,
        isLoading: false,
      }));

      toast.success("Resume published");
      return updated;
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

  // Archive resume
  const archiveResume = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.archive(id);
      const updated = response.data as Resume;

      setState((prev) => ({
        ...prev,
        resumes: prev.resumes.map((r) => (r.id === id ? updated : r)),
        currentResume: prev.currentResume?.id === id ? updated : prev.currentResume,
        isLoading: false,
      }));

      toast.success("Resume archived");
      return updated;
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

  // Download resume as PDF
  const downloadResume = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await resumeApi.download(id);
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.click();
      window.URL.revokeObjectURL(url);

      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      toast.success("Resume PDF download started");
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

  return {
    ...state,
    fetchResumes,
    fetchResume,
    createResume,
    generateResume,
    updateResume,
    deleteResume,
    publishResume,
    archiveResume,
    downloadResume,
  };
}

export default useResume;
