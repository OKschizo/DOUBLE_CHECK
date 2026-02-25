import { test, expect } from '@playwright/test';

test.describe('DOUBLEcheck App', () => {
  test('landing page loads and shows branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DoubleCheck/i);
    await expect(page.getByText('Get Started')).toBeVisible();
  });

  test('login page loads with form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('signup page loads with form elements', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Join DoubleCheck/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test('navigating from landing to login', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Get Started').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('navigating from login to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Authentication Flow', () => {
  test('signup form requires email and password', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('login form requires email and password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
