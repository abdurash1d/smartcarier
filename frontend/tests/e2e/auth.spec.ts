import { test, expect } from '@playwright/test';

/**
 * =============================================================================
 * Authentication E2E Tests
 * =============================================================================
 * 
 * Tests for user authentication flows:
 * - Landing page
 * - Registration
 * - Login
 * - Logout
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to landing page
    await page.goto('/');
  });

  // ===========================================================================
  // LANDING PAGE
  // ===========================================================================

  test('should display landing page correctly', async ({ page }) => {
    // Brand should be visible in the navbar (hero title is translated and may differ).
    await expect(page.locator('nav').getByText(/SmartCareer/i).first()).toBeVisible();
    
    // Check navigation
    await expect(page.locator('a[href=\"/login\"]').first()).toBeVisible();
    await expect(page.locator('a[href=\"/register\"]').first()).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('a[href=\"/register\"]').first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.locator('a[href=\"/login\"]').first().click();
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[name=\"email\"]').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.locator('a[href=\"/register\"]').first().click();
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('input[name=\"email\"]').first()).toBeVisible();
  });

  // ===========================================================================
  // REGISTRATION
  // ===========================================================================

  test('should register new student successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Generate unique email
    const timestamp = Date.now();
    const email = `test.student.${timestamp}@example.com`;
    
    // Step 1: credentials
    await page.locator('input[name=\"email\"]').fill(email);
    await page.locator('input[name=\"password\"]').fill('TestPassword123!');
    await page.locator('input[name=\"confirmPassword\"]').fill('TestPassword123!');
    await page.getByRole('button', { name: /continue|davom|next/i }).click();

    // Step 2: profile
    await page.locator('input[name=\"fullName\"]').fill('Test Student');
    await page.locator('input[name=\"phone\"]').fill('+998901234567');
    await page.getByRole('button', { name: /continue|davom|next/i }).click();

    // Step 3: role selection (pick student)
    await page.getByRole('button', { name: /AI Resume/i }).click();
    await page.getByRole('button', { name: /create|hisob|account/i }).click();
    
    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/\/student/, { timeout: 15000 });
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/register');
    
    await page.locator('input[name=\"email\"]').fill('invalid-email');
    await page.locator('input[name=\"password\"]').fill('TestPassword123!');
    await page.locator('input[name=\"confirmPassword\"]').fill('TestPassword123!');
    await page.getByRole('button', { name: /continue|davom|next/i }).click();

    // Should not advance to step 2
    await expect(page.locator('input[name=\"fullName\"]')).toHaveCount(0);
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/register');
    
    await page.locator('input[name=\"email\"]').fill('test@example.com');
    await page.locator('input[name=\"password\"]').fill('weak');
    await page.locator('input[name=\"confirmPassword\"]').fill('weak');
    await page.getByRole('button', { name: /continue|davom|next/i }).click();

    // Should not advance to step 2
    await expect(page.locator('input[name=\"fullName\"]')).toHaveCount(0);
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register');
    
    // Use known existing email (from seed data)
    await page.locator('input[name=\"email\"]').fill('john@example.com');
    await page.locator('input[name=\"password\"]').fill('Student123!');
    await page.locator('input[name=\"confirmPassword\"]').fill('Student123!');
    await page.getByRole('button', { name: /continue|davom|next/i }).click();

    await page.locator('input[name=\"fullName\"]').fill('Test User');
    await page.locator('input[name=\"phone\"]').fill('+998901234567');
    await page.getByRole('button', { name: /continue|davom|next/i }).click();

    await page.getByRole('button', { name: /AI Resume/i }).click();
    await page.getByRole('button', { name: /create|hisob|account/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 10000 });
  });

  // ===========================================================================
  // LOGIN
  // ===========================================================================

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Use test account from seed data
    await page.locator('input[name=\"email\"]').fill('john@example.com');
    await page.locator('input[name=\"password\"]').fill('Student123!');
    
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/(student|dashboard)/, { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Use a separate seeded account so we don't lock the main E2E user.
    await page.locator('input[name=\"email\"]').fill('negative.student@example.com');
    await page.locator('input[name=\"password\"]').fill('WrongPassword123!');
    
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid.*password|incorrect/i)).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/login');
    
    await page.locator('input[name=\"email\"]').fill('nonexistent@example.com');
    await page.locator('input[name=\"password\"]').fill('SomePassword123!');
    
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should show error
    await expect(page.getByText(/invalid|not found/i)).toBeVisible();
  });

  // ===========================================================================
  // LOGOUT
  // ===========================================================================

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.locator('input[name=\"email\"]').fill('john@example.com');
    await page.locator('input[name=\"password\"]').fill('Student123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page).toHaveURL(/\/(student|dashboard)/);
    
    // Logout
    // Open user menu (button contains user full name)
    await page.getByRole('button', { name: /john|user/i }).click();
    await page.getByRole('button', { name: /sign out|logout/i }).click();
    
    // Should redirect to home or login
    await expect(page).toHaveURL(/\/(|login)/);
  });

  // ===========================================================================
  // LANGUAGE SWITCHING
  // ===========================================================================

  test('should switch between languages', async ({ page }) => {
    await page.goto('/');
    
    // Find language switcher
    const languageSwitcher = page.getByRole('button', { name: /uz|ru|language/i }).first();
    
    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click();
      
      // Click Russian option
      await page.getByRole('menuitem', { name: /russian|ru|русский/i }).click();
      
      // Check if content changed to Russian
      await expect(page.getByText(/войти|регистрация/i)).toBeVisible();
      
      // Switch back to Uzbek
      await languageSwitcher.click();
      await page.getByRole('menuitem', { name: /uzbek|uz|o'zbek/i }).click();
      
      await expect(page.getByText(/kirish|ro'yxatdan/i)).toBeVisible();
    }
  });
});









