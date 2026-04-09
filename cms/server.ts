import express from 'express';
import payload from 'payload';
import dotenv from 'dotenv';
import { seed } from './seed';
import storefrontRouter from './storefront';

dotenv.config();

const app = express();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'password';
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET;

const ensureAdminUser = async () => {
  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: ADMIN_EMAIL,
      },
    },
    limit: 1,
    depth: 0,
  });

  if (existingUsers.totalDocs > 0) {
    payload.logger.info(`Admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }

  await payload.create({
    collection: 'users',
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  payload.logger.info(`Created admin user: ${ADMIN_EMAIL}`);
};

// Public storefront
app.use('/shop', storefrontRouter);

// Root → shop
app.get('/', (_, res) => {
  res.redirect('/shop');
});

const start = async () => {
  if (!PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is required. Set it in your environment or .env file.');
  }

  await payload.init({
    secret: PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI ?? 'mongodb://mongo:27017/payload',
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  await ensureAdminUser();
  await seed();

  app.listen(3000, () => {
    payload.logger.info('Server listening on http://localhost:3000');
  });
};

start();
