import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Budget } from '../models/Budget.js';
import { getIO } from '../sockets/socketHandler.js';
import { logger } from '../utils/logger.js';

// Helper to notify budget threshold check
const checkBudgetThreshold = async (userId, category, amount, date) => {
  try {
    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const budget = await Budget.findOne({ user: userId, category, month, year });
    if (!budget) return;

    // Calculate total spend in this category for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const totalSpentResult = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          category,
          type: 'EXPENSE',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalSpent = totalSpentResult[0]?.total || 0;
    const percentUsed = (totalSpent / budget.limit) * 100;

    const io = getIO();
    if (io && percentUsed >= budget.alertThreshold) {
      io.to(`user:${userId}`).emit('budget:alert', {
        category,
        totalSpent,
        limit: budget.limit,
        percentUsed: Math.round(percentUsed),
        message: `⚠️ Alert: You have used ${Math.round(percentUsed)}% of your ${category} budget (₹${totalSpent} / ₹${budget.limit})`,
      });
    }
  } catch (err) {
    logger.warn(`Error in checkBudgetThreshold: ${err.message}`);
  }
};

// @desc    Create a new transaction (expense or income)
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, type, category, categoryRef, paymentMethod, date, notes, tags } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount: Number(amount),
      type: type || 'EXPENSE',
      category,
      categoryRef: categoryRef || null,
      paymentMethod: paymentMethod || 'UPI',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      tags: tags || [],
    });

    // Populate user details for return
    await expense.populate('user', 'name email role');

    // Socket.io real-time broadcast
    const io = getIO();
    if (io) {
      io.to(`user:${req.user._id}`).emit('expense:added', expense);
      io.emit('activity:feed', {
        type: 'transaction_added',
        userName: req.user.name,
        action: `added a new ${expense.type.toLowerCase()}`,
        amount: expense.amount,
        category: expense.category,
        timestamp: new Date(),
      });
    }

    // Check budget threshold asynchronously if this was an expense
    if (expense.type === 'EXPENSE') {
      checkBudgetThreshold(req.user._id, expense.category, expense.amount, expense.date);
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully!',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions with search, filters, pagination, and sorting
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const {
      search,
      type,
      category,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { user: req.user._id };

    // Search by title or notes (case-insensitive regex)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by type (EXPENSE / INCOME)
    if (type && type !== 'ALL') {
      query.type = type.toUpperCase();
    }

    // Filter by category
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Filter by payment method
    if (paymentMethod && paymentMethod !== 'ALL') {
      query.paymentMethod = paymentMethod.toUpperCase();
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .populate('user', 'name email'),
      Expense.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('user', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you do not have permission to view it.',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized to edit.',
      });
    }

    const { title, amount, type, category, categoryRef, paymentMethod, date, notes, tags } = req.body;

    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = Number(amount);
    if (type !== undefined) expense.type = type;
    if (category !== undefined) expense.category = category;
    if (categoryRef !== undefined) expense.categoryRef = categoryRef;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (date !== undefined) expense.date = new Date(date);
    if (notes !== undefined) expense.notes = notes;
    if (tags !== undefined) expense.tags = tags;

    const updatedExpense = await expense.save();
    await updatedExpense.populate('user', 'name email');

    const io = getIO();
    if (io) {
      io.to(`user:${req.user._id}`).emit('expense:updated', updatedExpense);
    }

    if (updatedExpense.type === 'EXPENSE') {
      checkBudgetThreshold(req.user._id, updatedExpense.category, updatedExpense.amount, updatedExpense.date);
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully!',
      data: updatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized to delete.',
      });
    }

    const io = getIO();
    if (io) {
      io.to(`user:${req.user._id}`).emit('expense:deleted', { id: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate statistics and analytics for expenses
// @route   GET /api/expenses/stats/summary
// @access  Private
export const getExpenseStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Overall Totals
    const totals = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransactions = 0;

    totals.forEach((t) => {
      if (t._id === 'INCOME') totalIncome = t.total;
      if (t._id === 'EXPENSE') totalExpense = t.total;
      totalTransactions += t.count;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // 2. Spending by Category (Expenses only)
    const categoryBreakdown = await Expense.aggregate([
      { $match: { user: userId, type: 'EXPENSE' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const formattedCategoryBreakdown = categoryBreakdown.map((c) => ({
      category: c._id,
      total: c.total,
      count: c.count,
      percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
    }));

    // 3. Monthly Trends (Past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Expense.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly trends into clean chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};

    // Initialize 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      trendMap[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        income: 0,
        expense: 0,
      };
    }

    monthlyTrends.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (trendMap[key]) {
        if (item._id.type === 'INCOME') trendMap[key].income = item.total;
        if (item._id.type === 'EXPENSE') trendMap[key].expense = item.total;
      }
    });

    // 4. Payment method distribution
    const paymentMethods = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netSavings,
          savingsRate,
          totalTransactions,
        },
        categoryBreakdown: formattedCategoryBreakdown,
        monthlyTrends: Object.values(trendMap),
        paymentMethods: paymentMethods.map((p) => ({ method: p._id, total: p.total, count: p.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create/import transactions (JSON array)
// @route   POST /api/expenses/bulk
// @access  Private
export const bulkImportExpenses = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of transaction items to import.',
      });
    }

    const preparedItems = items.map((item) => ({
      user: req.user._id,
      title: item.title || item.description || 'Imported Transaction',
      amount: Number(item.amount) || 0,
      type: item.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      category: item.category || 'General',
      paymentMethod: item.paymentMethod || item.payment_type || 'UPI',
      date: item.date ? new Date(item.date) : new Date(),
      notes: item.notes || '',
    }));

    const inserted = await Expense.insertMany(preparedItems);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} transactions!`,
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
};
