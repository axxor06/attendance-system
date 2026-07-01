import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import { User } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@college.edu').toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`[Seed] Admin account already exists for ${email}. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Head Admin',
    email,
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123',
    role: ROLES.HOD,
    isEmailVerified: true,
    isActive: true,
  });

  console.log('[Seed] HOD admin account created successfully:');
  console.log(`  Email: ${admin.email}`);
  console.log(`  Password: ${process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123'}`);
  console.log('  IMPORTANT: Log in and change this password immediately.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
