import { request } from '@playwright/test';

type Json = Record<string, any>;

// In the app we commonly use NEXT_PUBLIC_API_URL as ".../api/v1".
// For seeding, we need the backend origin (no "/api/v1" suffix).
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = RAW_API_URL.replace(/\/api\/v1\/?$/, '');

async function postJson(ctx: any, path: string, body?: Json, headers?: Record<string, string>) {
  return await ctx.post(`${API_URL}${path}`, {
    data: body ?? {},
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
  });
}

async function ensureRegistered(ctx: any, payload: Json) {
  const res = await postJson(ctx, '/api/v1/auth/register', payload);
  // 201: created, 409: already exists
  if (![201, 409].includes(res.status())) {
    const text = await res.text();
    throw new Error(`Register failed (${res.status()}): ${text}`);
  }
}

async function login(ctx: any, email: string, password: string): Promise<string> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await postJson(ctx, '/api/v1/auth/login', { email, password });
    if (res.status() === 200) {
      const data = (await res.json()) as Json;
      const token = data?.access_token as string | undefined;
      if (!token) throw new Error('Login response missing access_token');
      return token;
    }

    // In local runs, the backend may have rate limiting enabled.
    // Retry politely on 429 to avoid flaky E2E setups.
    if (res.status() === 429 && attempt < maxAttempts) {
      const retryAfterHeader = res.headers()['retry-after'];
      let waitSeconds = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : NaN;

      if (!Number.isFinite(waitSeconds)) {
        const text = await res.text();
        const m = text.match(/try again in\\s+(\\d+)\\s+seconds/i);
        waitSeconds = m ? parseInt(m[1], 10) : 3;
      }

      await new Promise((r) => setTimeout(r, Math.max(1, waitSeconds) * 1000));
      continue;
    }

    const text = await res.text();
    throw new Error(`Login failed (${res.status()}): ${text}`);
  }

  throw new Error('Login failed: exceeded retry attempts');
}

async function createJob(ctx: any, token: string, job: Json): Promise<string> {
  const res = await postJson(ctx, '/api/v1/jobs', job, { authorization: `Bearer ${token}` });
  if (res.status() !== 201) {
    const text = await res.text();
    throw new Error(`Create job failed (${res.status()}): ${text}`);
  }
  const data = (await res.json()) as Json;
  const id = (data?.id ?? data?.job?.id) as string | undefined;
  if (!id) throw new Error('Create job response missing id');
  return id;
}

async function createResume(ctx: any, token: string, resume: Json): Promise<string> {
  const res = await postJson(ctx, '/api/v1/resumes/create', resume, { authorization: `Bearer ${token}` });
  if (res.status() !== 201) {
    const text = await res.text();
    throw new Error(`Create resume failed (${res.status()}): ${text}`);
  }
  const data = (await res.json()) as Json;
  const id = data?.id as string | undefined;
  if (!id) throw new Error('Create resume response missing id');
  return id;
}

async function publishResume(ctx: any, token: string, resumeId: string) {
  const res = await postJson(
    ctx,
    `/api/v1/resumes/${resumeId}/publish`,
    {},
    { authorization: `Bearer ${token}` }
  );
  // 200 OK is expected; 409/400 can happen if already published, tolerate.
  if (![200, 400, 409].includes(res.status())) {
    const text = await res.text();
    throw new Error(`Publish resume failed (${res.status()}): ${text}`);
  }
}

async function applyToJob(ctx: any, token: string, jobId: string, resumeId: string) {
  const res = await postJson(
    ctx,
    '/api/v1/applications/apply',
    { job_id: jobId, resume_id: resumeId, cover_letter: 'E2E seed application.' },
    { authorization: `Bearer ${token}` }
  );
  // 201 created, 409 already applied.
  if (![201, 409].includes(res.status())) {
    const text = await res.text();
    throw new Error(`Apply failed (${res.status()}): ${text}`);
  }
}

export default async function globalSetup() {
  const ctx = await request.newContext();

  // Fixed seed accounts used by Playwright specs.
  const studentEmail = 'john@example.com';
  const studentPassword = 'Student123!';
  const negativeStudentEmail = 'negative.student@example.com';
  const negativeStudentPassword = 'Student123!';
  const companyEmail = 'acme.hr@example.com';
  const companyPassword = 'Company123!';

  await ensureRegistered(ctx, {
    email: studentEmail,
    password: studentPassword,
    full_name: 'John Doe',
    phone: '+998901234567',
    role: 'student',
  });

  // Separate student account used for negative auth scenarios (wrong password attempts).
  await ensureRegistered(ctx, {
    email: negativeStudentEmail,
    password: negativeStudentPassword,
    full_name: 'Negative Student',
    phone: '+998901111999',
    role: 'student',
  });

  await ensureRegistered(ctx, {
    email: companyEmail,
    password: companyPassword,
    full_name: 'Acme HR',
    phone: '+998907654321',
    role: 'company',
    company_name: 'Acme Inc',
    company_website: 'https://acme.example',
  });

  const companyToken = await login(ctx, companyEmail, companyPassword);

  // Create one older job we pre-apply to, and one newer job for the "apply" test.
  const jobAId = await createJob(ctx, companyToken, {
    title: 'Senior Software Engineer',
    description:
      'We are looking for a Senior Software Engineer to build scalable services and APIs. ' +
      'You will collaborate with a cross-functional team and ship reliable features.',
    requirements: ['Python', 'FastAPI', 'PostgreSQL'],
    responsibilities: ['Build APIs', 'Write tests', 'Review code'],
    location: 'Tashkent',
    job_type: 'full_time',
    experience_level: 'senior',
    is_remote_allowed: true,
  });

  const jobBId = await createJob(ctx, companyToken, {
    title: 'Python Developer',
    description:
      'We are hiring a Python Developer to work on web services, data processing, and integrations. ' +
      'You will own features end-to-end and improve performance and reliability.',
    requirements: ['Python', 'SQL', 'Git'],
    responsibilities: ['Implement features', 'Fix bugs', 'Collaborate with product'],
    location: 'Tashkent',
    job_type: 'full_time',
    experience_level: 'mid',
    is_remote_allowed: false,
  });

  const studentToken = await login(ctx, studentEmail, studentPassword);

  const resumeId = await createResume(ctx, studentToken, {
    title: 'John Doe Resume',
    content: {
      personal_info: {
        name: 'John Doe',
        email: studentEmail,
      },
      skills: {
        technical: ['Python', 'FastAPI', 'SQL'],
      },
    },
  });

  await publishResume(ctx, studentToken, resumeId);
  await applyToJob(ctx, studentToken, jobAId, resumeId);

  // Keep jobBId unused so UI can apply successfully in tests.
  void jobBId;

  await ctx.dispose();
}
