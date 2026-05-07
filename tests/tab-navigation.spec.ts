import { test, expect } from '@playwright/test';

test('UU: shop landing is friendly to Tab navigation and products use semantic headings', async ({ page }) => {
  // try root first, fallback to /shop
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const gridCount = await page.getByTestId('product-grid').count();
  if (gridCount === 0) {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
  }

  // Ensure there are product cards available
  const cards = page.getByTestId('product-card');
  const totalCards = await cards.count();
  expect(totalCards).toBeGreaterThan(0);

  // Acceptance: product titles should be <h2>
  for (let i = 0; i < totalCards; i++) {
    const card = cards.nth(i);
    const h2Count = await card.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  }

  // Tab through the page and collect product card indices that receive focus
  const titles = (await page.locator('[data-testid="product-card"] h2').allTextContents()).map(t => t.trim());
  const focusedIndices: number[] = [];
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press('Tab');
    const idx = await page.evaluate((titles) => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return -1;
      const card = active.closest('[data-testid="product-card"], article, .product, .product-card');
      if (!card) return -1;
      const heading = (card.querySelector('h2')?.textContent || '').trim();
      return titles.indexOf(heading);
    }, titles);
    if (idx >= 0) focusedIndices.push(idx);
  }

  // Determine unique first-occurrence order of focused product indices
  const firstOrder: number[] = [];
  for (const n of focusedIndices) {
    if (!firstOrder.includes(n)) firstOrder.push(n);
  }

  const required = Math.min(5, totalCards);
  expect(firstOrder.length).toBeGreaterThanOrEqual(required);

  // Ensure the focus progressed in DOM order (non-decreasing indices)
  for (let i = 1; i < firstOrder.length; i++) {
    expect(firstOrder[i]).toBeGreaterThanOrEqual(firstOrder[i - 1]);
  }

  // Verify focusable controls exist inside the first few product cards
  const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const checkCount = Math.min(3, firstOrder.length, totalCards);
  for (let i = 0; i < checkCount; i++) {
    const idx = firstOrder[i];
    const card = page.locator('[data-testid="product-card"]').nth(idx);
    const focusableCount = await card.locator(focusableSelector).count();
    expect(focusableCount).toBeGreaterThan(0);
  }

  // Assert specific controls are reachable by Tab for each of the first checked products
  const specificCheckCount = checkCount;
  for (let j = 0; j < specificCheckCount; j++) {
    const idx = firstOrder[j];
    const card = page.locator('[data-testid="product-card"]').nth(idx);

    // Find product link href to identify the link when focused
    const linkHandle = card.locator('a[data-testid^="product-link"], a[href*="/shop/products/"]');
    const linkCount = await linkHandle.count();
    expect(linkCount).toBeGreaterThan(0);
    const linkHref = await linkHandle.first().getAttribute('href');
    if (!linkHref) throw new Error('Product link has no href');

    // Reset focus and Tab until we hit that product link (or timeout)
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); document.body.focus(); });
    let linkReached = false;
    for (let t = 0; t < 300; t++) {
      await page.keyboard.press('Tab');
      // Check whether the currently focused element is the link with the expected href
      linkReached = await page.evaluate((href) => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return false;
        const a = active.closest('a[href]') as HTMLAnchorElement | null;
        return !!(a && a.getAttribute('href') === href);
      }, linkHref);
      if (linkReached) break;
    }
    expect(linkReached).toBeTruthy();

    // Now open the product detail and ensure the Add to cart button (if present) is reachable by Tab
    await linkHandle.first().click();
    await page.waitForLoadState('networkidle');

    // Wait for product-detail then check add-to-cart focusability
    await expect(page.getByTestId('product-detail')).toBeVisible();

    const addBtn = page.getByTestId('add-to-cart');
    if ((await addBtn.count()) > 0) {
      // Reset focus and tab until addBtn is active
      await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); document.body.focus(); });
      let addReached = false;
      for (let t = 0; t < 200; t++) {
        await page.keyboard.press('Tab');
        addReached = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          if (!active) return false;
          const btn = active.closest('[data-testid="add-to-cart"]') as HTMLElement | null;
          return !!btn;
        });
        if (addReached) break;
      }
      const disabled = await addBtn.first().isDisabled();
      if (!disabled) {
        expect(addReached).toBeTruthy();
      }
    }

    // navigate back to shop for next iteration
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
  }

  // Open the first product and verify the product detail contains a description
  const firstCard = cards.first();
  const productLink = firstCard.locator('a[data-testid^="product-link"]');
  if ((await productLink.count()) === 0) {
    throw new Error('No product link found in the first product card');
  }

  await productLink.click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('product-detail')).toBeVisible();

  // Prefer an explicit `product-description` test id, otherwise look for a paragraph inside the detail
  if ((await page.getByTestId('product-description').count()) > 0) {
    await expect(page.getByTestId('product-description')).not.toBeEmpty();
  } else {
    const descCount = await page.locator('[data-testid="product-detail"] p').count();
    expect(descCount).toBeGreaterThan(0);
  }
});
