# SmartCareer AI — Poster Content (Concise Version)

> Shortened, poster-friendly text. Each section ~30–60% shorter than the original.

---

## Header

**Project Title:** `SmartCareer AI`

**Subtitle:** `An AI-Powered Career Platform for Students and Employers`

**Student:** `Djumabaev Abdurashid`

**Student ID:** `210004 - BSc in Computer Science`

---

## INTRODUCTION

The transition from education to employment is a major challenge for students and recent graduates. Many struggle to build ATS-friendly resumes and find jobs that match their skills, while employers spend excessive time filtering large applicant pools.

SmartCareer AI bridges this gap by combining **Google Gemini** and **OpenAI GPT-4** to automate resume generation, score resume-job compatibility, produce tailored cover letters, and deliver intelligent job matching — helping students compete effectively and helping employers screen candidates faster.

---

## PROJECT OBJECTIVES

1. Build an **AI resume builder** (GPT-4 + Gemini) that produces ATS-optimized resumes and reduces manual effort by ~70%.
2. Develop an **intelligent job-matching algorithm** that scores candidate–job compatibility (0–100) with skill-gap insights.
3. Deliver a **three-role web platform** (Student, Company, Admin) with secure auth, application tracking, and notifications.
4. Integrate an **AI cover letter generator** that personalizes content per resume and job.
5. Design a **scalable, production-ready architecture** (FastAPI + Next.js) with full CI/CD and monitoring.

---

## METHODOLOGY

Agile development with two-week sprints, organized into four layers:

- **Backend** — FastAPI + SQLAlchemy + PostgreSQL; JWT and OAuth2 (Google) authentication.
- **AI Service** — Dual provider (Gemini primary, GPT-4 fallback) with structured prompts and JSON validation.
- **Frontend** — Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Radix UI.
- **Quality & DevOps** — Pytest, Playwright, GitHub Actions CI/CD, Docker, deployed on Render and Vercel.

---

## RESULTS

- **AI Resume Builder** generates ATS-optimized resumes via Gemini/GPT-4, cutting manual effort by ~70%.
- **Job Matching** returns 0–100 compatibility scores with matched skills, missing skills, and reasons.
- **Three-role platform** delivered: Students apply and track jobs; Companies post and screen candidates; Admins monitor health and users.
- **Cover Letter Generator** produces personalized, job-specific letters.
- Architecture validated under testing with Sentry monitoring, Redis rate limiting, and GZip compression for production-grade performance.

---

## CONCLUSION

The project successfully met all five objectives, producing a fully functional AI-powered career platform that connects job seekers with employers. The dual-provider AI design (Gemini + OpenAI) balances reliability and cost, while modular code and automated tests support long-term growth.

Three key lessons: (1) **modular architecture** is essential for solo full-stack development; (2) **iterative prompt engineering** with JSON validation is needed for consistent AI output; and (3) **automated testing and CI/CD** are critical for reliability in complex systems.

---

## RECOMMENDATION AND FUTURE WORK

1. **Mobile App** — React Native client for on-the-go use.
2. **AI Interview Coach** — Mock interviews with real-time feedback.
3. **ML Recommendations** — Personalized jobs from user behavior data.
4. **University Integration** — Career-center grant and motivation-letter tools.
5. **Localization** — Uzbek and Russian for the Central Asian market.
6. **Local Payments** — Click.uz and Payme alongside Stripe.

---

## PROJECT OUTPUT

Screenshots showcase the SmartCareer AI interface — AI Resume Builder, Job Matching, Application Tracker, Company HR Portal, and Admin Dashboard — across all three user roles.

---

## SUPERVISOR

**Supervisor:** `Mr. Farhod Mahmudxo'jayev`

**Professor:** `Eugene Castro` — `e.castro@centralasian.uz`

---

## ACKNOWLEDGMENT

I sincerely thank my supervisor, **Mr. Farhod Mahmudxo'jayev**, and Professor **Eugene Castro** for their guidance, feedback, and support throughout this project. I also thank the **Engineering School** and the **Central Asian University** community for fostering an academic environment that shaped my skills and passion for technology.

---

## Recommended Screenshots (Project Output area)

1. **AI Resume Builder** — form + generated resume preview
2. **Job Matching Dashboard** — jobs ranked by match score
3. **Application Tracker** — student status pipeline
4. **Company HR Portal** — job posting management
5. **Admin Dashboard** — system health metrics
6. **Landing / Login page** — branded hero
