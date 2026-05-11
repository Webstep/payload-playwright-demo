import { test, expect } from '@playwright/test';

test('complete shopping workflow: select random product, add to cart, checkout and buy', async ({ page }) => {
  // ── Step 1: Navigate to shop and select a random product ──────────────────
  
  await page.goto('/shop');
  await expect(page).toHaveTitle(/PayloadShop/);
  
  // Get all product cards
  const productCards = await page.locator('[data-testid="product-card"]').all();
  expect(productCards.length).toBeGreaterThan(0);
  
  // Select a random product that is "active" (not discontinued or out of stock)
  let selectedCard = null;
  let selectedProductName = '';
  let selectedProductPrice = 0;
  
  for (const card of productCards) {
    const statusBadge = card.locator('[data-testid="product-status"]');
    const status = await statusBadge.textContent();
    
    if (status?.toLowerCase().includes('active')) {
      selectedCard = card;
      selectedProductName = await card.locator('h2').textContent() || '';
      const priceText = await card.locator('[data-testid="product-price"]').textContent() || '';
      selectedProductPrice = parseFloat(priceText.replace('$', ''));
      break;
    }
  }
  
  expect(selectedCard).not.toBeNull();
  expect(selectedProductName).toBeTruthy();
  expect(selectedProductPrice).toBeGreaterThan(0);
  
  // ── Step 2: Click on the selected product to view details ────────────────
  
  await selectedCard!.locator('a[data-testid*="product-link"]').click();
  
  await expect(page).toHaveURL(/\/shop\/products\/.+/);
  await expect(page.getByTestId('product-detail')).toBeVisible();
  await expect(page.getByTestId('product-name')).toContainText(selectedProductName);
  
  // ── Step 3: Add product to cart ─────────────────────────────────────────
  
  const addToCartBtn = page.getByTestId('add-to-cart');
  await expect(addToCartBtn).toBeVisible();
  await expect(addToCartBtn).not.toBeDisabled();
  
  // Click "Add to cart" button
  await addToCartBtn.click();
  
  // The page should redirect to cart automatically after adding
  await page.waitForURL(/\/shop\/cart/, { timeout: 5000 });
  
  // ── Step 4: Verify cart contents ───────────────────────────────────────
  
  await expect(page).toHaveURL(/\/shop\/cart/);
  await expect(page.getByTestId('cart-table')).toBeVisible();
  
  // Verify the product is in the cart
  const cartRows = await page.locator('tbody tr[data-testid^="cart-item-"]').all();
  expect(cartRows.length).toBe(1);
  
  // Check the cart table cells directly
  const cartTable = page.getByTestId('cart-table');
  await expect(cartTable).toContainText(selectedProductName);
  await expect(cartTable).toContainText('$' + selectedProductPrice.toFixed(2));
  await expect(cartTable).toContainText('1');
  
  // Verify total is correct
  await expect(page.getByTestId('cart-total')).toContainText('$' + selectedProductPrice.toFixed(2));
  
  // ── Step 5: Click checkout button ──────────────────────────────────────
  
  const checkoutBtn = page.getByTestId('checkout-button');
  await expect(checkoutBtn).toBeVisible();
  await checkoutBtn.click();
  
  // ── Step 6: Fill in checkout form ──────────────────────────────────────
  
  await expect(page).toHaveURL(/\/shop\/checkout/);
  await expect(page.getByTestId('checkout-form')).toBeVisible();
  
  // Verify order summary shows correct product
  await expect(page.getByTestId('checkout-items')).toContainText(selectedProductName);
  await expect(page.getByTestId('checkout-total')).toContainText('$' + selectedProductPrice.toFixed(2));
  
  // Fill in customer information
  await page.getByTestId('checkout-name').fill('John Doe');
  await page.getByTestId('checkout-email').fill('john@example.com');
  await page.getByTestId('checkout-address').fill('123 Main Street');
  await page.getByTestId('checkout-city').fill('Copenhagen');
  await page.getByTestId('checkout-zip').fill('2100');
  
  // Fill in payment information
  await page.getByTestId('checkout-cardholder').fill('John Doe');
  await page.getByTestId('checkout-cardnumber').fill('4111111111111111');
  await page.getByTestId('checkout-expiry').fill('12/25');
  await page.getByTestId('checkout-cvv').fill('123');
  
  // ── Step 7: Complete purchase ──────────────────────────────────────────
  
  // Submit the checkout form
  await page.locator('[data-testid="checkout-form"]').evaluate(form => (form as HTMLFormElement).submit());
  
  // ── Step 8: Verify order confirmation ──────────────────────────────────
  
  await page.waitForURL(/\/shop\/confirmation\?orderId=.+/, { timeout: 5000 });
  
  // Verify success message
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.getByTestId('confirmation-name')).toContainText('John Doe');
  await expect(page.getByTestId('confirmation-email')).toContainText('john@example.com');
  await expect(page.getByTestId('confirmation-address')).toContainText('123 Main Street, Copenhagen 2100');
  await expect(page.getByTestId('confirmation-total')).toContainText('$' + selectedProductPrice.toFixed(2));
  await expect(page.getByTestId('confirmation-status')).toContainText('confirmed');
  
  // Verify order number is displayed
  const orderNumber = await page.getByTestId('confirmation-order-number').textContent();
  expect(orderNumber).toMatch(/ORD-/);
});
