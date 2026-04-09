import { test, expect } from '@playwright/test';

// ── Shop homepage ──────────────────────────────────────────────────────────

test('shop homepage shows product grid', async ({ page }) => {
  await page.goto('/shop');

  await expect(page).toHaveTitle(/PayloadShop/);
  await expect(page.getByTestId('product-grid')).toBeVisible();

  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(10); // 10 seeded products
});

test('shop homepage shows category filters', async ({ page }) => {
  await page.goto('/shop');

  await expect(page.getByTestId('filter-all')).toBeVisible();
  await expect(page.getByTestId('filter-electronics')).toBeVisible();
  await expect(page.getByTestId('filter-clothing')).toBeVisible();
  await expect(page.getByTestId('filter-books')).toBeVisible();
});

test('filter by category shows only matching products', async ({ page }) => {
  await page.goto('/shop');

  await page.getByTestId('filter-electronics').click();
  await expect(page).toHaveURL(/category=electronics/);

  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(4); // 4 seeded electronics products
});

// ── Product detail page ────────────────────────────────────────────────────

test('clicking a product opens detail page', async ({ page }) => {
  await page.goto('/shop');

  const firstCard = page.getByTestId('product-card').first();
  await firstCard.locator('a[data-testid^="product-link"]').click();

  await expect(page).toHaveURL(/\/shop\/products\/.+/);
  await expect(page.getByTestId('product-detail')).toBeVisible();
  await expect(page.getByTestId('product-name')).not.toBeEmpty();
  await expect(page.getByTestId('product-price')).toContainText('$');
  await expect(page.getByTestId('product-sku')).not.toBeEmpty();
});

test('active in-stock product shows Add to cart button', async ({ page }) => {
  // Wireless Headphones: active, stock 42
  await page.goto('/shop');
  await page.getByTestId('filter-electronics').click();
  await page.locator('[data-testid="product-link-ELEC-001"]').click();

  const btn = page.getByTestId('add-to-cart');
  await expect(btn).toBeVisible();
  await expect(btn).not.toBeDisabled();
  await expect(btn).toHaveText('Add to cart');
});

test('out-of-stock product shows disabled Add to cart button', async ({ page }) => {
  // Mechanical Keyboard: out_of_stock
  await page.goto('/shop');
  await page.getByTestId('filter-electronics').click();
  await page.locator('[data-testid="product-link-ELEC-003"]').click();

  const btn = page.getByTestId('add-to-cart');
  await expect(btn).toBeVisible();
  await expect(btn).toBeDisabled();
});

test('back to shop link navigates home', async ({ page }) => {
  await page.goto('/shop');
  await page.getByTestId('product-card').first()
    .locator('a[data-testid^="product-link"]').click();

  await page.getByTestId('back-to-shop').click();
  await expect(page).toHaveURL(/\/shop$/);
});

// ── Orders page ────────────────────────────────────────────────────────────

test('orders page shows seeded orders', async ({ page }) => {
  await page.goto('/shop/orders');

  await expect(page).toHaveTitle(/Orders.*PayloadShop/);
  await expect(page.getByTestId('orders-table')).toBeVisible();

  const rows = page.getByTestId('order-row');
  await expect(rows).toHaveCount(5); // 5 seeded orders
});

test('orders table shows expected order data', async ({ page }) => {
  await page.goto('/shop/orders');

  const firstRow = page.getByTestId('order-row').filter({
    hasText: 'ORD-2024-001',
  });

  await expect(firstRow.getByTestId('order-number')).toHaveText('ORD-2024-001');
  await expect(firstRow.getByTestId('order-customer')).toHaveText('Alice Jensen');
  await expect(firstRow.getByTestId('order-status')).toHaveText('delivered');
  await expect(firstRow.getByTestId('order-total')).toHaveText('$124.98');
});

// ── Navigation ─────────────────────────────────────────────────────────────

test('nav links are present and correct', async ({ page }) => {
  await page.goto('/shop');

  await expect(page.getByTestId('nav-shop')).toHaveAttribute('href', '/shop');
  await expect(page.getByTestId('nav-orders')).toHaveAttribute('href', '/shop/orders');
  await expect(page.getByTestId('nav-admin')).toHaveAttribute('href', '/admin');
});
