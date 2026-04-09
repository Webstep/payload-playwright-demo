import { test, expect } from '@playwright/test';

test('GET /api/products returns a list', async ({ request }) => {
  const res = await request.get('/api/products');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.docs)).toBeTruthy();
  expect(body.totalDocs).toBeGreaterThan(0);
});

test('GET /api/categories returns seeded categories', async ({ request }) => {
  const res = await request.get('/api/categories');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const slugs = body.docs.map((c: { slug: string }) => c.slug);
  expect(slugs).toContain('electronics');
  expect(slugs).toContain('clothing');
  expect(slugs).toContain('books');
});

test('GET /api/orders returns seeded orders', async ({ request }) => {
  const res = await request.get('/api/orders');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.totalDocs).toBeGreaterThan(0);
});

test('GET /api/products with where filter returns matching products', async ({ request }) => {
  const res = await request.get('/api/products?where[status][equals]=active');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.docs.every((p: { status: string }) => p.status === 'active')).toBeTruthy();
});