/**
 * =============================================================================
 * API TYPES
 * =============================================================================
 *
 * TypeScript interfaces for API request/response bodies
 */

// =============================================================================
// USER TYPES
// =============================================================================

export type UserRole = "student" | "company" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  company_name?: string;
  company_website?: string;
  bio?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface UserProfile extends User {
  resumes_count?: number;
  applications_count?: number;
  jobs_posted?: number;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: TokenResponse;
  };
  message?: string;
}

// =============================================================================
// RESUME TYPES
// =============================================================================

export type ResumeStatus = "draft" | "published" | "archived";

export interface ResumeContent {
  personal_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    portfolio_url?: string;
    professional_title?: string;
  };
  summary?: string;
  experience?: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    is_current?: boolean;
    description: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    year: string;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
  };
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    url?: string;
    technologies?: string[];
  }>;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  content: ResumeContent;
  ai_generated: boolean;
  pdf_url?: string;
  status: ResumeStatus;
  view_count: number;
  ats_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeCreateRequest {
  title: string;
  content: ResumeContent;
}

export interface ResumeGenerateRequest {
  user_data: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    professional_title?: string;
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
// JOB TYPES
// =============================================================================

export type JobType = "full_time" | "part_time" | "remote" | "hybrid" | "contract";
export type ExperienceLevel = "junior" | "mid" | "senior" | "lead" | "executive";
export type JobStatus = "draft" | "active" | "closed";

export interface JobRequirements {
  skills?: string[];
  experience?: string;
  education?: string;
  certifications?: string[];
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: JobRequirements;
  salary_min?: number;
  salary_max?: number;
  location: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  status: JobStatus;
  applications_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  company?: {
    name: string;
    logo_url?: string;
  };
  matchScore?: number;
}

export interface JobCreateRequest {
  title: string;
  description: string;
  requirements: JobRequirements;
  salary_min?: number;
  salary_max?: number;
  location: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  expires_at?: string;
}

export interface JobSearchParams {
  search?: string;
  location?: string;
  job_type?: JobType[];
  experience_level?: ExperienceLevel[];
  salary_min?: number;
  salary_max?: number;
  sort_by?: "created_at" | "salary" | "relevance";
  page?: number;
  limit?: number;
}

// =============================================================================
// APPLICATION TYPES
// =============================================================================

export type ApplicationStatus = "pending" | "reviewing" | "interview" | "rejected" | "accepted";

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  resume_id: string;
  cover_letter?: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at?: string;
  interview_at?: string;
  updated_at: string;
  job?: Job;
  resume?: Resume;
  applicant?: User;
}

export interface ApplicationCreateRequest {
  job_id: string;
  resume_id: string;
  cover_letter?: string;
}

export interface AutoApplyRequest {
  criteria: {
    job_types?: JobType[];
    locations?: string[];
    experience_levels?: ExperienceLevel[];
    salary_min?: number;
    max_applications?: number;
  };
  resume_id: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// =============================================================================
// UNIVERSITY TYPES
// =============================================================================

export interface University {
  id: string;
  name: string;
  short_name?: string;
  country: string;
  city: string;
  world_ranking?: number;
  country_ranking?: number;
  programs?: string[];
  description?: string;
  website_url?: string;
  logo_url?: string;
  requirements?: {
    ielts?: number;
    toefl?: number;
    gpa?: number;
    gre?: boolean;
  };
  acceptance_rate?: string;
  tuition_min?: number;
  tuition_max?: number;
  tuition_currency?: string;
  tuition_note?: string;
  application_deadline_fall?: string;
  application_deadline_spring?: string;
  application_deadline_summer?: string;
  created_at: string;
  updated_at: string;
}

export interface Scholarship {
  id: string;
  name: string;
  description?: string;
  country: string;
  amount_info?: {
    amount?: number;
    currency?: string;
    type?: string;
    monthly_stipend?: number;
  };
  coverage?: string[];
  requirements?: string[];
  eligibility_criteria?: string;
  application_deadline: string;
  website_url?: string;
  application_url?: string;
  university_id?: string;
  created_at: string;
  updated_at: string;
}

export type UniversityApplicationStatus = 
  | "draft"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

export interface UniversityApplication {
  id: string;
  user_id: string;
  university_id: string;
  program: string;
  intake_semester?: string;
  intake_year?: number;
  status: UniversityApplicationStatus;
  documents?: Record<string, any>;
  documents_completed: number;
  documents_total: number;
  submitted_at?: string;
  deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  university?: {
    id: string;
    name: string;
    country: string;
    city: string;
  };
}

export interface MotivationLetter {
  id: string;
  application_id: string;
  title?: string;
  content: string;
  ai_generated: boolean;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UniversitySearchParams {
  search?: string;
  country?: string;
  city?: string;
  min_ranking?: number;
  max_ranking?: number;
  programs?: string[];
  page?: number;
  limit?: number;
  sort_by?: "world_ranking" | "name" | "country";
  sort_order?: "asc" | "desc";
}

export interface UniversityAISearchRequest {
  student_profile: {
    gpa?: number;
    ielts?: number;
    toefl?: number;
    experience?: string[];
    interests?: string[];
    achievements?: string[];
  };
  preferred_countries?: string[];
  preferred_programs?: string[];
  budget_min?: number;
  budget_max?: number;
  max_results?: number;
}

export interface PaginatedUniversityResponse {
  items: University[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedScholarshipResponse {
  items: Scholarship[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedUniversityApplicationResponse {
  items: UniversityApplication[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
