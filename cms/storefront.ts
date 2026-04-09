import { Router } from 'express';
import payload from 'payload';

const router = Router();

// ── Shared layout ──────────────────────────────────────────────────────────

const layout = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — PayloadShop</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; color: #222; }
    header { background: #111; color: #fff; padding: 1rem 2rem; display: flex; align-items: center; gap: 2rem; }
    header a { color: #fff; text-decoration: none; font-weight: 600; }
    header nav a { font-weight: normal; opacity: .75; }
    header nav a:hover { opacity: 1; }
    main { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.75rem; margin-bottom: 1.25rem; }
    h2 { font-size: 1.25rem; margin-bottom: .5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.25rem; }
    .card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); display: flex; flex-direction: column; }
    .card img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #e8e8e8; }
    .card-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: .4rem; }
    .card-body a { text-decoration: none; color: inherit; }
    .card-body a:hover h2 { text-decoration: underline; }
    .price { font-size: 1.1rem; font-weight: 700; color: #1a6e2e; }
    .badge { display: inline-block; padding: .2rem .6rem; border-radius: 99px; font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .badge.active { background: #d4edda; color: #1a6e2e; }
    .badge.out_of_stock { background: #fff3cd; color: #856404; }
    .badge.discontinued { background: #f8d7da; color: #842029; }
    .category-tag { font-size: .8rem; color: #555; }
    .filters { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .filters a { padding: .35rem .85rem; border-radius: 99px; background: #fff; border: 1px solid #ccc; text-decoration: none; color: #333; font-size: .875rem; }
    .filters a.active, .filters a:hover { background: #111; color: #fff; border-color: #111; }
    .detail { background: #fff; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,.1); display: flex; gap: 2rem; flex-wrap: wrap; }
    .detail img { width: 280px; border-radius: 8px; flex-shrink: 0; }
    .detail-info { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: .75rem; }
    .detail-price { font-size: 1.6rem; font-weight: 700; color: #1a6e2e; }
    .btn { display: inline-block; padding: .65rem 1.5rem; border-radius: 6px; background: #111; color: #fff; border: none; font-size: 1rem; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #333; }
    .btn:disabled, .btn.disabled { background: #aaa; cursor: not-allowed; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    th, td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; color: #666; }
    tr:last-child td { border-bottom: none; }
    .back { display: inline-block; margin-bottom: 1rem; color: #555; text-decoration: none; font-size: .9rem; }
    .back:hover { color: #111; }
    .empty { text-align: center; padding: 3rem; color: #888; }
  </style>
</head>
<body>
  <header>
    <a href="/shop" data-testid="site-logo">🛍 PayloadShop</a>
    <nav style="display:flex;gap:1.5rem">
      <a href="/shop" data-testid="nav-shop">Shop</a>
      <a href="/shop/orders" data-testid="nav-orders">Orders</a>
      <a href="/admin" data-testid="nav-admin">Admin</a>
    </nav>
  </header>
  <main>${body}</main>
</body>
</html>`;

// ── GET /shop ──────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const categorySlug = req.query.category as string | undefined;

  const [productsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'products',
      limit: 100,
      depth: 1,
      ...(categorySlug
        ? { where: { 'category.slug': { equals: categorySlug } } }
        : {}),
    }),
    payload.find({ collection: 'categories', limit: 50, depth: 0 }),
  ]);

  const filterLinks = [
    `<a href="/shop" class="${!categorySlug ? 'active' : ''}" data-testid="filter-all">All</a>`,
    ...categoriesResult.docs.map(
      (c: any) =>
        `<a href="/shop?category=${c.slug}" class="${categorySlug === c.slug ? 'active' : ''}" data-testid="filter-${c.slug}">${c.name}</a>`,
    ),
  ].join('');

  const cards = productsResult.docs.map(
    (p: any) => `
    <div class="card" data-testid="product-card">
      <img src="${p.imageUrl ?? `https://placehold.co/400x400?text=${encodeURIComponent(p.name)}`}" alt="${p.name}" />
      <div class="card-body">
        <a href="/shop/products/${p.id}" data-testid="product-link-${p.sku}">
          <h2>${p.name}</h2>
        </a>
        <span class="price" data-testid="product-price">$${p.price.toFixed(2)}</span>
        <span class="badge ${p.status}" data-testid="product-status">${p.status.replace('_', ' ')}</span>
        <span class="category-tag">${typeof p.category === 'object' ? p.category?.name : ''}</span>
      </div>
    </div>`,
  );

  const body = `
    <h1>All Products <small style="font-size:.9rem;color:#888">(${productsResult.totalDocs})</small></h1>
    <div class="filters" data-testid="category-filters">${filterLinks}</div>
    ${cards.length ? `<div class="grid" data-testid="product-grid">${cards.join('')}</div>` : '<p class="empty">No products found.</p>'}`;

  res.send(layout('Shop', body));
});

// ── GET /shop/products/:id ─────────────────────────────────────────────────

router.get('/products/:id', async (req, res) => {
  let product: any;
  try {
    product = await payload.findByID({ collection: 'products', id: req.params.id, depth: 1 });
  } catch {
    res.status(404).send(layout('Not Found', '<p class="empty">Product not found.</p>'));
    return;
  }

  const inStock = product.status === 'active' && product.stock > 0;
  const categoryName = typeof product.category === 'object' ? product.category?.name : '';

  const body = `
    <a href="/shop" class="back" data-testid="back-to-shop">← Back to shop</a>
    <div class="detail" data-testid="product-detail">
      <img src="${product.imageUrl ?? `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`}" alt="${product.name}" />
      <div class="detail-info">
        <h1 data-testid="product-name">${product.name}</h1>
        <span class="badge ${product.status}" data-testid="product-status">${product.status.replace('_', ' ')}</span>
        <span class="category-tag" data-testid="product-category">${categoryName}</span>
        <p data-testid="product-description">${product.description ?? ''}</p>
        <span class="detail-price" data-testid="product-price">$${product.price.toFixed(2)}</span>
        <p data-testid="product-stock">Stock: ${product.stock}</p>
        <p>SKU: <code data-testid="product-sku">${product.sku}</code></p>
        ${inStock
          ? `<button class="btn" data-testid="add-to-cart">Add to cart</button>`
          : `<button class="btn disabled" data-testid="add-to-cart" disabled>Out of stock</button>`}
      </div>
    </div>`;

  res.send(layout(product.name, body));
});

// ── GET /shop/orders ───────────────────────────────────────────────────────

router.get('/orders', async (_req, res) => {
  const result = await payload.find({
    collection: 'orders',
    limit: 100,
    depth: 0,
    sort: '-createdAt',
  });

  const statusColors: Record<string, string> = {
    pending: 'out_of_stock',
    confirmed: 'active',
    shipped: 'active',
    delivered: 'active',
    cancelled: 'discontinued',
  };

  const rows = result.docs.map(
    (o: any) => `
    <tr data-testid="order-row">
      <td data-testid="order-number">${o.orderNumber}</td>
      <td data-testid="order-customer">${o.customerName}</td>
      <td>${o.customerEmail}</td>
      <td><span class="badge ${statusColors[o.status] ?? ''}" data-testid="order-status">${o.status}</span></td>
      <td data-testid="order-total">$${o.totalAmount.toFixed(2)}</td>
    </tr>`,
  );

  const body = `
    <h1>Orders <small style="font-size:.9rem;color:#888">(${result.totalDocs})</small></h1>
    ${rows.length
      ? `<table data-testid="orders-table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Email</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>${rows.join('')}</tbody>
        </table>`
      : '<p class="empty">No orders yet.</p>'}`;

  res.send(layout('Orders', body));
});

export default router;
