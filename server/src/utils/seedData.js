import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { Budget } from '../models/Budget.js';
import { Message } from '../models/Message.js';
import { DEFAULT_CATEGORIES } from '../controllers/categoryController.js';
import { logger } from './logger.js';

export const seedDatabase = async (autoClose = false) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    logger.info('Purging existing data for fresh seed...');

    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Expense.deleteMany(),
      Budget.deleteMany(),
      Message.deleteMany(),
    ]);

    logger.info('Creating default system categories...');
    const createdCategories = await Category.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({ ...cat, user: null }))
    );

    logger.info('Creating test users (Admin and Regular User)...');
    const adminUser = await User.create({
      name: 'Admin Rahul',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      currency: 'INR',
    });

    const regularUser = await User.create({
      name: 'Demo Student',
      email: 'user@example.com',
      password: 'User@123',
      role: 'user',
      currency: 'INR',
    });

    logger.info('Seeding sample transactions for demo user...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const sampleExpenses = [
      // Current Month
      {
        user: regularUser._id,
        title: 'Monthly Tech Internship Stipend',
        amount: 45000,
        type: 'INCOME',
        category: 'Salary',
        paymentMethod: 'NET_BANKING',
        date: new Date(currentYear, currentMonth, 1),
        notes: 'Monthly stipend credited to bank account',
      },
      {
        user: regularUser._id,
        title: 'Apartment Rent',
        amount: 14000,
        type: 'EXPENSE',
        category: 'Housing & Rent',
        paymentMethod: 'NET_BANKING',
        date: new Date(currentYear, currentMonth, 2),
        notes: 'Monthly house rent paid via NEFT',
      },
      {
        user: regularUser._id,
        title: 'Supermarket Grocery Haul',
        amount: 3250,
        type: 'EXPENSE',
        category: 'Food & Dining',
        paymentMethod: 'UPI',
        date: new Date(currentYear, currentMonth, 3),
        notes: 'Vegetables, fruits, and weekly household staples',
      },
      {
        user: regularUser._id,
        title: 'Broadband Internet Bill',
        amount: 999,
        type: 'EXPENSE',
        category: 'Utilities & Bills',
        paymentMethod: 'UPI',
        date: new Date(currentYear, currentMonth, 5),
        notes: 'Airtel Fiber 100Mbps plan',
      },
      {
        user: regularUser._id,
        title: 'Freelance Web Design Project',
        amount: 18500,
        type: 'INCOME',
        category: 'Freelance & Side Gig',
        paymentMethod: 'UPI',
        date: new Date(currentYear, currentMonth, 6),
        notes: 'Landing page design milestone payment',
      },
      {
        user: regularUser._id,
        title: 'College Metro Smart Card Recharge',
        amount: 800,
        type: 'EXPENSE',
        category: 'Transportation',
        paymentMethod: 'UPI',
        date: new Date(currentYear, currentMonth, 7),
        notes: 'Monthly commuter card recharge',
      },
      {
        user: regularUser._id,
        title: 'Weekend Dining with Friends',
        amount: 1450,
        type: 'EXPENSE',
        category: 'Food & Dining',
        paymentMethod: 'CARD',
        date: new Date(currentYear, currentMonth, 8),
        notes: 'Cafe dinner after college workshop',
      },
      {
        user: regularUser._id,
        title: 'Programming Reference Books',
        amount: 1200,
        type: 'EXPENSE',
        category: 'Shopping',
        paymentMethod: 'UPI',
        date: new Date(currentYear, currentMonth, 9),
        notes: 'Full Stack Web Development & React Architecture',
      },
      // Previous Month
      {
        user: regularUser._id,
        title: 'Previous Month Stipend',
        amount: 45000,
        type: 'INCOME',
        category: 'Salary',
        paymentMethod: 'NET_BANKING',
        date: new Date(currentYear, currentMonth - 1, 1),
      },
      {
        user: regularUser._id,
        title: 'Apartment Rent (Prev Month)',
        amount: 14000,
        type: 'EXPENSE',
        category: 'Housing & Rent',
        paymentMethod: 'NET_BANKING',
        date: new Date(currentYear, currentMonth - 1, 2),
      },
      {
        user: regularUser._id,
        title: 'Dining & Groceries',
        amount: 6200,
        type: 'EXPENSE',
        category: 'Food & Dining',
        paymentMethod: 'UPI',
        date: new Date(currentYear, currentMonth - 1, 15),
      },
    ];

    await Expense.insertMany(sampleExpenses);

    logger.info('Setting up sample budgets for demo user...');
    await Budget.create([
      {
        user: regularUser._id,
        category: 'Food & Dining',
        limit: 8000,
        month: currentMonth + 1,
        year: currentYear,
        alertThreshold: 75,
      },
      {
        user: regularUser._id,
        category: 'Housing & Rent',
        limit: 15000,
        month: currentMonth + 1,
        year: currentYear,
        alertThreshold: 90,
      },
      {
        user: regularUser._id,
        category: 'Transportation',
        limit: 2500,
        month: currentMonth + 1,
        year: currentYear,
        alertThreshold: 80,
      },
    ]);

    logger.info('Seeding welcome messages in live chat...');
    await Message.create([
      {
        sender: adminUser._id,
        senderName: adminUser.name,
        senderRole: adminUser.role,
        room: 'general',
        message: '👋 Welcome to Expense Tracker Pro! Feel free to ask any question or test the real-time live sync.',
      },
    ]);

    logger.info('==========================================');
    logger.info('✅ Database Seed Completed Successfully!');
    logger.info('🔑 Test User Credentials:');
    logger.info('   Admin: admin@example.com / Admin@123');
    logger.info('   User:  user@example.com / User@123');
    logger.info('==========================================');

    if (autoClose) {
      await closeDB();
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

// Run directly if invoked via CLI
if (process.argv[1].endsWith('seedData.js')) {
  seedDatabase(true);
}
