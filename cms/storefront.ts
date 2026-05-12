import { Router } from 'express';
import payload from 'payload';
import crypto from 'crypto';

const router = Router();

// ── Simple in-memory cart storage ──────────────────────────────────────────

const carts = new Map<string, CartItem[]>();

// ── Helper to manage cart in memory ────────────────────────────────────────

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

function getSessionId(req: any): string {
  let sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
  }
  return sessionId;
}

function getCart(req: any): CartItem[] {
  const sessionId = getSessionId(req);
  if (!carts.has(sessionId)) {
    carts.set(sessionId, []);
  }
  return carts.get(sessionId) || [];
}

function saveCart(req: any, cart: CartItem[]): string {
  const sessionId = getSessionId(req);
  carts.set(sessionId, cart);
  return sessionId;
}

const layout = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — PayloadShop</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; color: #222; }
    header { background: #111; color: #fff; padding: 1rem 2rem; display: flex; align-items: center; gap: 2rem; justify-content: space-between; }
    header .logo-nav { display: flex; align-items: center; gap: 2rem; }
    header a { color: #fff; text-decoration: none; font-weight: 600; }
    header nav a { font-weight: normal; opacity: .75; }
    header nav a:hover { opacity: 1; }
    .cart-badge { background: #ff6b6b; color: #fff; padding: .2rem .5rem; border-radius: 99px; font-size: .75rem; font-weight: 700; }
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
    .btn.success { background: #1a6e2e; }
    .btn.success:hover { background: #145d24; }
    .cart-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    .cart-table th, .cart-table td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
    .cart-table th { background: #f9f9f9; font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; color: #666; }
    .cart-table tr:last-child td { border-bottom: none; }
    .cart-summary { background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.1); margin-top: 2rem; }
    .summary-row { display: flex; justify-content: space-between; padding: .5rem 0; font-size: 1rem; }
    .summary-row.total { font-size: 1.3rem; font-weight: 700; color: #1a6e2e; border-top: 2px solid #eee; padding-top: 1rem; margin-top: 1rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: .5rem; font-weight: 600; }
    .form-group input, .form-group select { width: 100%; padding: .65rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    th, td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; color: #666; }
    tr:last-child td { border-bottom: none; }
    .back { display: inline-block; margin-bottom: 1rem; color: #555; text-decoration: none; font-size: .9rem; }
    .back:hover { color: #111; }
    .empty { text-align: center; padding: 3rem; color: #888; }
    .success-message { background: #d4edda; border: 1px solid #b1dfbb; color: #155724; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; }
  </style>
  <script>
    async function addToCart(productId, productName, productPrice) {
      const response = await fetch('/shop/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, productPrice, quantity: 1 })
      });
      if (response.ok) {
        alert(productName + ' added to cart!');
        window.location.href = '/shop/cart';
      } else {
        alert('Failed to add to cart');
      }
    }
  </script>
</head>
<body>
  <header>
    <div class="logo-nav">
      <a href="/shop" data-testid="site-logo">🛍 PayloadShop</a>
      <nav style="display:flex;gap:1.5rem">
        <a href="/shop" data-testid="nav-shop">Shop</a>
        <a href="/shop/orders" data-testid="nav-orders">Orders</a>
        <a href="/admin" data-testid="nav-admin">Admin</a>
      </nav>
    </div>
    <a href="/shop/cart" style="color: #fff; text-decoration: none; opacity: .75; hover: opacity: 1;" data-testid="nav-cart">🛒 Cart</a>
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
          ? `<button class="btn" data-testid="add-to-cart" onclick="addToCart('${product.id}', '${product.name}', ${product.price})">Add to cart</button>`
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

// ── POST /shop/cart/add ────────────────────────────────────────────────────

router.post('/cart/add', (req, res) => {
  const { productId, productName, productPrice, quantity } = req.body;
  const cart = getCart(req);
  
  const existingItem = cart.find((item: CartItem) => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity || 1;
  } else {
    cart.push({
      productId,
      name: productName,
      price: productPrice,
      quantity: quantity || 1
    });
  }
  
  saveCart(req, cart);
  res.json({ success: true, cartSize: cart.length });
});

// ── GET /shop/cart ────────────────────────────────────────────────────────

router.get('/cart', (req, res) => {
  const cart = getCart(req);
  
  if (cart.length === 0) {
    const body = `
      <h1>Shopping Cart</h1>
      <p class="empty">Your cart is empty.</p>
      <a href="/shop" class="btn">Continue Shopping</a>`;
    return res.send(layout('Cart', body));
  }
  
  const cartTotal = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  
  const cartRows = cart.map((item: CartItem, index: number) => `
    <tr data-testid="cart-item-${index}">
      <td data-testid="cart-item-name">${item.name}</td>
      <td data-testid="cart-item-price">$${item.price.toFixed(2)}</td>
      <td data-testid="cart-item-quantity">${item.quantity}</td>
      <td data-testid="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`).join('');
  
  const body = `
    <h1>Shopping Cart</h1>
    <table class="cart-table" data-testid="cart-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${cartRows}
      </tbody>
    </table>
    <div class="cart-summary">
      <div class="summary-row total" data-testid="cart-total">
        <span>Total:</span>
        <span>$${cartTotal.toFixed(2)}</span>
      </div>
      <div style="margin-top: 2rem; display: flex; gap: 1rem;">
        <a href="/shop" class="btn">Continue Shopping</a>
        <a href="/shop/checkout" class="btn success" data-testid="checkout-button">Proceed to Checkout</a>
      </div>
    </div>`;
  
  res.send(layout('Cart', body));
});

// ── GET /shop/checkout ────────────────────────────────────────────────────

router.get('/checkout', (req, res) => {
  const cart = getCart(req);
  
  if (cart.length === 0) {
    return res.redirect('/shop/cart');
  }
  
  const cartTotal = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  const cartRows = cart.map((item: CartItem) => `
    <li data-testid="checkout-item">${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('');
  
  const body = `
    <h1>Checkout</h1>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
      <div>
        <h2>Order Summary</h2>
        <ul style="list-style: none; padding: 0;" data-testid="checkout-items">
          ${cartRows}
        </ul>
        <div class="cart-summary" style="margin-top: 1rem;">
          <div class="summary-row total">
            <span>Total:</span>
            <span data-testid="checkout-total">$${cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div>
        <h2>Billing Information</h2>
        <form method="POST" action="/shop/checkout" data-testid="checkout-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="customerName" required data-testid="checkout-name">
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="customerEmail" required data-testid="checkout-email">
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <input type="text" id="address" name="address" required data-testid="checkout-address">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="city">City</label>
              <input type="text" id="city" name="city" required data-testid="checkout-city">
            </div>
            <div class="form-group">
              <label for="zip">ZIP Code</label>
              <input type="text" id="zip" name="zip" required data-testid="checkout-zip">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="cardname">Card Holder Name</label>
              <input type="text" id="cardname" name="cardholderName" required data-testid="checkout-cardholder">
            </div>
            <div class="form-group">
              <label for="cardnumber">Card Number</label>
              <input type="text" id="cardnumber" name="cardNumber" placeholder="4111111111111111" required data-testid="checkout-cardnumber">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="expiry">Expiry (MM/YY)</label>
              <input type="text" id="expiry" name="expiry" placeholder="12/25" required data-testid="checkout-expiry">
            </div>
            <div class="form-group">
              <label for="cvv">CVV</label>
              <input type="text" id="cvv" name="cvv" placeholder="123" required data-testid="checkout-cvv">
            </div>
          </div>
          <button type="submit" class="btn success" style="width: 100%; padding: 1rem;" data-testid="purchase-button">Complete Purchase - $${cartTotal.toFixed(2)}</button>
        </form>
      </div>
    </div>`;
  
  res.send(layout('Checkout', body));
});

// ── POST /shop/checkout (Process checkout) ────────────────────────────────

router.post('/checkout', async (req, res) => {
  const cart = getCart(req);
  
  if (cart.length === 0) {
    return res.redirect('/shop/cart');
  }
  
  const { customerName, customerEmail, address, city, zip, cardholderName, cardNumber, expiry, cvv } = req.body;
  
  const totalAmount = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  
  try {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create order in Payload
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        customerName,
        customerEmail,
        address,
        city,
        zip,
        cardholderName,
        cardNumber: cardNumber.slice(-4), // Store only last 4 digits
        totalAmount,
        status: 'confirmed',
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });
    
    // Clear cart
    const sessionId = getSessionId(req);
    carts.delete(sessionId);
    
    // Redirect to confirmation
    res.redirect(`/shop/confirmation?orderId=${order.id}`);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).send(layout('Error', '<p class="empty">Failed to process checkout. Please try again.</p>'));
  }
});

// ── GET /shop/confirmation ────────────────────────────────────────────────

router.get('/confirmation', async (req, res) => {
  const orderId = req.query.orderId as string;
  
  if (!orderId) {
    return res.redirect('/shop');
  }
  
  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1
    });
    
    const body = `
      <div class="success-message">
        <h1>✓ Order Confirmed!</h1>
        <p>Thank you for your purchase, <strong data-testid="confirmation-name">${order.customerName}</strong>!</p>
      </div>
      <div style="background: #fff; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,.1);">
        <h2>Order Details</h2>
        <p><strong>Order Number:</strong> <span data-testid="confirmation-order-number">${order.orderNumber}</span></p>
        <p><strong>Email:</strong> <span data-testid="confirmation-email">${order.customerEmail}</span></p>
        <p><strong>Total Amount:</strong> <span data-testid="confirmation-total">$${order.totalAmount.toFixed(2)}</span></p>
        <p><strong>Status:</strong> <span class="badge active" data-testid="confirmation-status">${order.status}</span></p>
        <p><strong>Delivery Address:</strong> <span data-testid="confirmation-address">${order.address}, ${order.city} ${order.zip}</span></p>
        <div style="margin-top: 2rem;">
          <a href="/shop" class="btn">Back to Shop</a>
          <a href="/shop/orders" class="btn" style="margin-left: 1rem;">View All Orders</a>
        </div>
      </div>`;
    
    res.send(layout('Order Confirmation', body));
  } catch (error) {
    res.status(404).send(layout('Not Found', '<p class="empty">Order not found.</p>'));
  }
});

export default router;
