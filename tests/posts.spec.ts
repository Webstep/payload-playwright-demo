import { test, expect } from '@playwright/test';

// Full CRUD cycle on the orders collection
test('CRUD order', async ({ request }) => {
  // ── CREATE ─────────────────────────────────────────────────────────────
  // Grab a real product id to use in the order item
  const productsRes = await request.get('/api/products?limit=1');
  const { docs: [firstProduct] } = await productsRes.json();

  const orderNumber = `ORD-TEST-${Date.now()}`;
  const createRes = await request.post('/api/orders', {
    data: {
      orderNumber,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      status: 'pending',
      items: [{ product: firstProduct.id, quantity: 2, priceAtPurchase: firstProduct.price }],
      totalAmount: firstProduct.price * 2,
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const { doc: created } = await createRes.json();
  expect(created.orderNumber).toBe(orderNumber);

  const id = created.id;

  // ── READ ────────────────────────────────────────────────────────────────
  const readRes = await request.get(`/api/orders/${id}`);
  expect(readRes.ok()).toBeTruthy();
  const fetchedOrder = await readRes.json();
  expect(fetchedOrder.customerEmail).toBe('test@example.com');

  // ── UPDATE ──────────────────────────────────────────────────────────────
  const updateRes = await request.patch(`/api/orders/${id}`, {
    data: { status: 'confirmed' },
  });
  expect(updateRes.ok()).toBeTruthy();
  const { doc: updated } = await updateRes.json();
  expect(updated.status).toBe('confirmed');

  // ── DELETE ──────────────────────────────────────────────────────────────
  const deleteRes = await request.delete(`/api/orders/${id}`);
  expect(deleteRes.ok()).toBeTruthy();

  const deletedRes = await request.get(`/api/orders/${id}`);
  expect(deletedRes.status()).toBe(404);
});