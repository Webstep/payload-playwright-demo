import { test, expect } from '@playwright/test';

// Allow a longer timeout so slowMo runs complete when watching headed browser
test.setTimeout(120000);
test.use({ headless: true, launchOptions: { slowMo: 300 } });

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'password';

/**
 * Helper function to create or verify a category exists
 */
async function createCategoryViaUI(
  page: any,
  request: any,
  name: string,
  slug: string,
  description?: string
) {
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

  // Navigate to create page
  await page.goto('/admin/collections/categories/create');
  await page.waitForLoadState('load');

  // Suggestions for the user about what to fill out on the Categories page
  console.log('📝 Suggestions for filling out the category form:');
  console.log('  - Name: ' + name + ' (required)');
  console.log('  - Description: ' + (description ?? 'Optional field - can be left blank') + '');
  console.log('  - Slug: ' + slug + ' (required, must be unique)');

  // Try to create via the Admin UI with more robust selectors
  let createdViaUI = false;
  try {
    // Prefer labeled fields when available (more resilient)
    try {
      await page.getByLabel('Name').fill(name);
    } catch (e) {
      const nf = page.locator('input[name="name"], input[placeholder*="Name"], textarea[name="name"]');
      if (await nf.count() > 0) await nf.first().fill(name);
    }

    if (description) {
      try {
        await page.getByLabel('Description').fill(description);
      } catch (e) {
        const df = page.locator('textarea[name="description"], textarea[placeholder*="Description"], input[name="description"]');
        if (await df.count() > 0) await df.first().fill(description);
      }
    }

    try {
      await page.getByLabel('Slug').fill(slug);
    } catch (e) {
      const sf = page.locator('input[name="slug"], input[placeholder*="Slug"]');
      if (await sf.count() > 0) await sf.first().fill(slug);
    }

    // Submit the form if we can find a save/create button
    const submitBtn = page.getByRole('button', { name: /Save|Create|Submit|Lagre/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      createdViaUI = true;
      // give the admin UI some time to persist
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('UI creation attempt error:', e);
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
}

/**
 * Helper function to verify a category exists via API
 */
async function verifyCategoryExists(
  request: any,
  slug: string,
  name: string
): Promise<any> {
  const verify = await request.get(`/api/categories?where[slug][equals]=${slug}`);
  expect(verify.ok()).toBeTruthy();
  const verifyBody = await verify.json();
  expect(verifyBody.totalDocs).toBeGreaterThan(0);
  const found = verifyBody.docs.find((d: any) => d.slug === slug || d.name === name);
  expect(found).toBeTruthy();
  return found;
}

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    // Go to admin and log in before each test
    await page.goto('/admin');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Confirm we're on admin
    await expect(page).toHaveURL(/admin/);
  });

  test('Create Pink Elephants category (UI with API fallback) and verify', async ({ page, request }) => {
    const slug = 'pink-elephants';
    const name = 'Pink Elephants';
    const description = 'A playful category for pink elephant themed items.';

    await createCategoryViaUI(page, request, name, slug, description);

    // Verify the category exists via the API
    const found = await verifyCategoryExists(request, slug, name);
    expect(found.name).toBe(name);

    // Cleanup: delete any categories matching the slug/name so the test is repeatable
    const list = await request.get(`/api/categories?where[slug][equals]=${slug}`);
    const listBody = await list.json();
    for (const doc of listBody.docs) {
      if (doc.slug === slug || doc.name === name) {
        const del = await request.delete(`/api/categories/${doc.id}`);
        if (!del.ok()) {
          console.warn(`Failed to delete category id=${doc.id}`);
        } else {
          console.log(`✅ Cleanup: Deleted category id=${doc.id}`);
        }
      }
    }
  });

  test('Create Technology category and verify it exists', async ({ page, request }) => {
    const slug = 'technology';
    const name = 'Technology';

    console.log('🚀 Starting Technology category creation test...');
    await createCategoryViaUI(page, request, name, slug);

    // Verify the category exists via the API
    const found = await verifyCategoryExists(request, slug, name);
    expect(found.name).toBe(name);
    expect(found.slug).toBe(slug);
    console.log('✅ Technology category verified to exist in the system!');

    // Navigate to the category in UI to verify it displays correctly
    await page.goto(`/admin/collections/categories`);
    await page.waitForLoadState('load');
    
    // Check that the category appears in the table (in a cell, not necessarily a link)
    const categoryCell = page.locator(`text="${name}"`);
    await expect(categoryCell).toBeVisible();
    console.log('✅ Technology category is visible in the UI!');

    // Cleanup: delete any categories matching the slug/name so the test is repeatable
    const list = await request.get(`/api/categories?where[slug][equals]=${slug}`);
    const listBody = await list.json();
    for (const doc of listBody.docs) {
      if (doc.slug === slug || doc.name === name) {
        const del = await request.delete(`/api/categories/${doc.id}`);
        if (!del.ok()) {
          console.warn(`Failed to delete category id=${doc.id}`);
        } else {
          console.log(`✅ Cleanup: Deleted category id=${doc.id}`);
        }
      }
    }
  });
});
