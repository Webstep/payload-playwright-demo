import { buildConfig } from 'payload/config';

const publicAccess = {
  read: () => true,
  create: () => true,
  update: () => true,
  delete: () => true,
};

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    disable: false,
  },
  collections: [
    // ── Auth ──────────────────────────────────────────────────────────────
    {
      slug: 'users',
      auth: true,
      fields: [],
    },

    // ── Webshop ───────────────────────────────────────────────────────────
    {
      slug: 'categories',
      access: publicAccess,
      fields: [
        { name: 'name',        type: 'text',     required: true },
        { name: 'description', type: 'textarea' },
        { name: 'slug',        type: 'text',     required: true, unique: true },
      ],
    },
    {
      slug: 'products',
      access: publicAccess,
      fields: [
        { name: 'name',        type: 'text',     required: true },
        { name: 'description', type: 'textarea' },
        { name: 'price',       type: 'number',   required: true },
        { name: 'stock',       type: 'number',   required: true, defaultValue: 0 },
        { name: 'sku',         type: 'text',     required: true, unique: true },
        { name: 'imageUrl',    type: 'text' },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Active',       value: 'active' },
            { label: 'Out of Stock', value: 'out_of_stock' },
            { label: 'Discontinued', value: 'discontinued' },
          ],
          defaultValue: 'active',
          required: true,
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
      ],
    },
    {
      slug: 'orders',
      access: publicAccess,
      fields: [
        { name: 'orderNumber',    type: 'text',   required: true, unique: true },
        { name: 'customerName',   type: 'text',   required: true },
        { name: 'customerEmail',  type: 'email',  required: true },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Pending',    value: 'pending' },
            { label: 'Confirmed',  value: 'confirmed' },
            { label: 'Shipped',    value: 'shipped' },
            { label: 'Delivered',  value: 'delivered' },
            { label: 'Cancelled',  value: 'cancelled' },
          ],
          defaultValue: 'pending',
          required: true,
        },
        {
          name: 'items',
          type: 'array',
          required: true,
          fields: [
            { name: 'product',          type: 'relationship', relationTo: 'products', required: true },
            { name: 'quantity',         type: 'number',       required: true },
            { name: 'priceAtPurchase',  type: 'number',       required: true },
          ],
        },
        { name: 'totalAmount', type: 'number', required: true },
        { name: 'notes',       type: 'textarea' },
      ],
    },
  ],
});