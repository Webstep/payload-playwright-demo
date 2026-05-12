import { test, expect } from '@playwright/test';

// Allow a longer timeout so slowMo runs complete when watching headed browser
test.setTimeout(120000);
test.use({ headless: true, launchOptions: { slowMo: 300 } });

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'password';

test('Create Pink Elephants category (UI with API fallback) and verify', async ({ page, request }) => {
  const slug = 'pink-elephants';
  const name = 'Pink Elephants';
  const description = 'A playful category for pink elephant themed items.';

  // Ensure idempotence: delete any pre-existing category with this slug
  const existing = await request.get(`/api/categories?where[slug][equals]=${slug}`);
  if (!existing.ok()) throw new Error('Failed to query categories API. Is the server running?');
  const existingBody = await existing.json();
  if (existingBody.totalDocs > 0) {
    for (const doc of existingBody.docs) {
      const del = await request.delete(`/api/categories/${doc.id}`);
      if (!del.ok()) throw new Error(`Failed to delete existing category id=${doc.id}`);
    }
  }

  // Go to admin and log in
  await page.goto('/admin');
  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');

  // Confirm we're on admin
  await expect(page).toHaveURL(/admin/);

  // Navigate to categories collection page
  await page.goto('/admin/collections/categories');

  // Suggestions for the user about what to fill out on the Categories page
  // (printed to the test output so you can see them when the headed browser opens)
  console.log('Suggestions: fill `name` (required), `description` (optional), `slug` (required, unique).');

  // Try to create via the Admin UI with more robust selectors
  let createdViaUI = false;
  try {
    const primaryCreate = page.getByRole('button', { name: /Create|New/i }).first();
    if (await primaryCreate.count() > 0) {
      await primaryCreate.click();
    } else {
      // Direct create route used by many Payload admin instances
      await page.goto('/admin/collections/categories/create');
    }

    // Prefer labeled fields when available (more resilient)
    try {
      await page.getByLabel('Name').fill(name);
    } catch (e) {
      const nf = page.locator('input[name="name"], input[placeholder*="Name"], textarea[name="name"]');
      if (await nf.count() > 0) await nf.first().fill(name);
    }

    try {
      await page.getByLabel('Description').fill(description);
    } catch (e) {
      const df = page.locator('textarea[name="description"], textarea[placeholder*="Description"], input[name="description"]');
      if (await df.count() > 0) await df.first().fill(description);
    }

    try {
      await page.getByLabel('Slug').fill(slug);
    } catch (e) {
      const sf = page.locator('input[name="slug"], input[placeholder*="Slug"]');
      if (await sf.count() > 0) await sf.first().fill(slug);
    }

    // Submit the form if we can find a save/create button
    const submitBtn = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      createdViaUI = true;
      // give the admin UI some time to persist
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    // continue to API fallback
  }

  // If UI creation did not happen, fallback to the API
  if (!createdViaUI) {
    console.log('UI creation attempt failed — falling back to API POST to create category.');
    const createRes = await request.post('/api/categories', {
      data: { name, description, slug },
    });
    if (!createRes.ok()) {
      const body = await createRes.text();
      throw new Error(`Failed to create category via API: ${createRes.status()} ${body}`);
    }
  }

  // Verify the category exists via the API
  const verify = await request.get(`/api/categories?where[slug][equals]=${slug}`);
  expect(verify.ok()).toBeTruthy();
  const verifyBody = await verify.json();
  expect(verifyBody.totalDocs).toBeGreaterThan(0);
  const found = verifyBody.docs.find((d: any) => d.slug === slug || d.name === name);
  expect(found).toBeTruthy();
  
  // Cleanup: delete any categories matching the slug/name so the test is repeatable
  for (const doc of verifyBody.docs) {
    if (doc.slug === slug || doc.name === name) {
      const del = await request.delete(`/api/categories/${doc.id}`);
      if (!del.ok()) {
        console.warn(`Failed to delete category id=${doc.id}`);
      } else {
        console.log(`Deleted category id=${doc.id}`);
      }
    }
  }
});
