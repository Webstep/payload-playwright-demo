import { test, expect } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'password';

test('admin login', async ({ page }) => {
  await page.goto('/admin');

  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/admin/);
});