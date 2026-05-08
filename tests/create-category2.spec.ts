import { test, expect } from '@playwright/test';

// increase overall test timeout to give the server time to build/start
test.setTimeout(60000);

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/login?redirect=', { waitUntil: 'load', timeout: 60000 });
  // wait for any input to render (admin UI is client-side rendered)
  await page.waitForSelector('input', { timeout: 60000 });
    // fill English fields
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password');
    // submit login
    await page.locator('form button[type=submit], button:has-text("Log in")').first().click();

    // create a Category (English labels)
    await page.getByRole('link', { name: 'Create new Category' }).click();
    await page.getByRole('textbox', { name: 'Name *' }).fill('Sneakers');
    await page.getByRole('textbox', { name: 'Description' }).fill('Modern sneakers from various brands');
    // verify the created category appears in the categories list
    await page.goto('/admin/collections/categories', { waitUntil: 'load', timeout: 60000 });
    await expect(page.getByText('Sneakers', { exact: true })).toBeVisible({ timeout: 60000 });
});