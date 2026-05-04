import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

/**
 * Captures the 6 poster screenshots from the running app.
 *
 * Output: frontend/screenshots/*.png (full-page, 1440x900 viewport)
 *
 * Run (from /frontend):
 *   $env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000/api/v1"
 *   npx playwright test tests/e2e/screenshots.spec.ts --project=chromium
 *
 * Requires global-setup to have seeded: student (john@example.com),
 * company (acme.hr@example.com), admin (admin@smartcareer.uz).
 */

const OUT_DIR = path.resolve(process.cwd(), 'screenshots');

const STUDENT = { email: 'john@example.com', password: 'Student123!' };
const COMPANY = { email: 'acme.hr@example.com', password: 'Company123!' };
const ADMIN = { email: 'admin@smartcareer.uz', password: 'Admin123!' };

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  await page.waitForURL(/\/(student|company|admin)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  // Small settle delay so charts/animations finish painting.
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    fullPage: true,
  });
}

test.use({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

test.describe.configure({ mode: 'serial' });

test.describe('Poster screenshots', () => {
  test('06 - landing / login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    await shot(page, '06_landing');

    await page.goto('/login');
    await shot(page, '06_login');
  });

  test('01 - AI resume builder', async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await page.goto('/student/resumes/create-ai');
    await shot(page, '01_ai_resume_builder');
  });

  test('02 - job matching dashboard', async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await page.goto('/student/jobs');
    await shot(page, '02_job_matching_dashboard');
  });

  test('03 - application tracker', async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await page.goto('/student/applications');
    await shot(page, '03_application_tracker');
  });

  test('04 - company HR portal', async ({ page }) => {
    await login(page, COMPANY.email, COMPANY.password);
    await page.goto('/company/jobs');
    await shot(page, '04_company_hr_portal');
  });

  test('05 - admin dashboard', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto('/admin');
    await shot(page, '05_admin_dashboard');
    expect(true).toBeTruthy();
  });
});
