import payload from 'payload';

// ── Seed data definitions ──────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Electronics',  slug: 'electronics',  description: 'Gadgets, devices and accessories.' },
  { name: 'Clothing',     slug: 'clothing',     description: 'Apparel for all occasions.' },
  { name: 'Books',        slug: 'books',        description: 'Fiction, non-fiction and technical titles.' },
];

const PRODUCTS = [
  // Electronics
  { name: 'Wireless Headphones',  sku: 'ELEC-001', price: 89.99,  stock: 42,  status: 'active',        category: 'electronics', description: 'Over-ear noise-cancelling headphones with 30hr battery.',   imageUrl: 'https://placehold.co/400x400?text=Headphones' },
  { name: 'USB-C Hub 7-in-1',     sku: 'ELEC-002', price: 39.99,  stock: 120, status: 'active',        category: 'electronics', description: '4K HDMI, 3× USB-A, SD/microSD, 100W PD passthrough.',       imageUrl: 'https://placehold.co/400x400?text=USB+Hub' },
  { name: 'Mechanical Keyboard',  sku: 'ELEC-003', price: 129.00, stock: 0,   status: 'out_of_stock',  category: 'electronics', description: 'TKL layout, Cherry MX Brown switches, RGB backlight.',       imageUrl: 'https://placehold.co/400x400?text=Keyboard' },
  { name: 'Webcam 1080p',         sku: 'ELEC-004', price: 59.99,  stock: 75,  status: 'active',        category: 'electronics', description: 'Full HD webcam with built-in microphone and privacy shutter.', imageUrl: 'https://placehold.co/400x400?text=Webcam' },
  // Clothing
  { name: 'Classic Hoodie',       sku: 'CLTH-001', price: 49.99,  stock: 200, status: 'active',        category: 'clothing',    description: 'Unisex pullover hoodie in heavyweight cotton blend.',         imageUrl: 'https://placehold.co/400x400?text=Hoodie' },
  { name: 'Slim Chino Trousers',  sku: 'CLTH-002', price: 64.95,  stock: 88,  status: 'active',        category: 'clothing',    description: 'Stretch cotton chinos, available in navy and khaki.',         imageUrl: 'https://placehold.co/400x400?text=Chinos' },
  { name: 'Retro Sneakers',       sku: 'CLTH-003', price: 95.00,  stock: 34,  status: 'active',        category: 'clothing',    description: 'Vulcanised sole low-top sneakers with suede toe cap.',         imageUrl: 'https://placehold.co/400x400?text=Sneakers' },
  // Books
  { name: 'Clean Code',           sku: 'BOOK-001', price: 34.99,  stock: 55,  status: 'active',        category: 'books',       description: 'Robert C. Martin — A handbook of agile software craftsmanship.', imageUrl: 'https://placehold.co/400x400?text=Clean+Code' },
  { name: 'The Pragmatic Programmer', sku: 'BOOK-002', price: 39.99, stock: 40, status: 'active',      category: 'books',       description: 'Hunt & Thomas — Your journey to mastery, 20th anniversary edition.', imageUrl: 'https://placehold.co/400x400?text=Pragmatic' },
  { name: 'JavaScript: The Good Parts', sku: 'BOOK-003', price: 24.99, stock: 0, status: 'discontinued', category: 'books',    description: 'Douglas Crockford — A classic guide to the JavaScript language.',  imageUrl: 'https://placehold.co/400x400?text=JS+Good+Parts' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const alreadySeeded = async (collection: string): Promise<boolean> => {
  const result = await payload.find({ collection, limit: 1, depth: 0 });
  return result.totalDocs > 0;
};

// ── Seed functions ─────────────────────────────────────────────────────────

const seedCategories = async (): Promise<Record<string, string>> => {
  if (await alreadySeeded('categories')) {
    payload.logger.info('Categories already seeded — skipping.');
    const existing = await payload.find({ collection: 'categories', limit: 100, depth: 0 });
    return Object.fromEntries(existing.docs.map((c: any) => [c.slug, c.id]));
  }

  payload.logger.info('Seeding categories...');
  const ids: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await payload.create({ collection: 'categories', data: cat });
    ids[cat.slug] = created.id;
    payload.logger.info(`  ✓ Category: ${cat.name}`);
  }
  return ids;
};

const seedProducts = async (categoryIds: Record<string, string>): Promise<Record<string, string>> => {
  if (await alreadySeeded('products')) {
    payload.logger.info('Products already seeded — skipping.');
    const existing = await payload.find({ collection: 'products', limit: 100, depth: 0 });
    return Object.fromEntries(existing.docs.map((p: any) => [p.sku, p.id]));
  }

  payload.logger.info('Seeding products...');
  const ids: Record<string, string> = {};
  for (const product of PRODUCTS) {
    const { category, ...data } = product;
    const created = await payload.create({
      collection: 'products',
      data: { ...data, category: categoryIds[category] },
    });
    ids[product.sku] = created.id;
    payload.logger.info(`  ✓ Product: ${product.name} (${product.sku})`);
  }
  return ids;
};

const seedOrders = async (productIds: Record<string, string>): Promise<void> => {
  if (await alreadySeeded('orders')) {
    payload.logger.info('Orders already seeded — skipping.');
    return;
  }

  payload.logger.info('Seeding orders...');

  const orders = [
    {
      orderNumber: 'ORD-2024-001',
      customerName: 'Alice Jensen',
      customerEmail: 'alice@example.com',
      status: 'delivered',
      notes: 'Please gift wrap.',
      items: [
        { product: productIds['ELEC-001'], quantity: 1, priceAtPurchase: 89.99 },
        { product: productIds['BOOK-001'], quantity: 1, priceAtPurchase: 34.99 },
      ],
      totalAmount: 124.98,
    },
    {
      orderNumber: 'ORD-2024-002',
      customerName: 'Bob Andersen',
      customerEmail: 'bob@example.com',
      status: 'shipped',
      notes: '',
      items: [
        { product: productIds['CLTH-001'], quantity: 2, priceAtPurchase: 49.99 },
        { product: productIds['CLTH-003'], quantity: 1, priceAtPurchase: 95.00 },
      ],
      totalAmount: 194.98,
    },
    {
      orderNumber: 'ORD-2024-003',
      customerName: 'Carol Eriksen',
      customerEmail: 'carol@example.com',
      status: 'confirmed',
      notes: 'Leave at door.',
      items: [
        { product: productIds['ELEC-002'], quantity: 1, priceAtPurchase: 39.99 },
        { product: productIds['ELEC-004'], quantity: 1, priceAtPurchase: 59.99 },
        { product: productIds['BOOK-002'], quantity: 1, priceAtPurchase: 39.99 },
      ],
      totalAmount: 139.97,
    },
    {
      orderNumber: 'ORD-2024-004',
      customerName: 'David Nguyen',
      customerEmail: 'david@example.com',
      status: 'pending',
      notes: '',
      items: [
        { product: productIds['CLTH-002'], quantity: 1, priceAtPurchase: 64.95 },
      ],
      totalAmount: 64.95,
    },
    {
      orderNumber: 'ORD-2024-005',
      customerName: 'Eva Larsen',
      customerEmail: 'eva@example.com',
      status: 'cancelled',
      notes: 'Customer changed mind.',
      items: [
        { product: productIds['ELEC-001'], quantity: 2, priceAtPurchase: 89.99 },
      ],
      totalAmount: 179.98,
    },
  ];

  for (const order of orders) {
    await payload.create({ collection: 'orders', data: order });
    payload.logger.info(`  ✓ Order: ${order.orderNumber} (${order.customerName})`);
  }
};

// ── Main entry ─────────────────────────────────────────────────────────────

export const seed = async (): Promise<void> => {
  payload.logger.info('Running seed...');
  const categoryIds = await seedCategories();
  const productIds  = await seedProducts(categoryIds);
  await seedOrders(productIds);
  payload.logger.info('Seed complete.');
};
