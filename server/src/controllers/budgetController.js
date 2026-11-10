import mongoose from 'mongoose';
import { Budget } from '../models/Budget.js';
import { Expense } from '../models/Expense.js';

// @desc    Get all budgets with actual spending progress for current/selected month
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res, next) => {
  try {
    const currentMonth = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const currentYear = parseInt(req.query.year, 10) || new Date().getFullYear();

    const budgets = await Budget.find({
      user: req.user._id,
      month: currentMonth,
      year: currentYear,
    });

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Get actual expense spending grouped by category for this month
    const categorySpending = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'EXPENSE',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const spendMap = {};
    categorySpending.forEach((item) => {
      spendMap[item._id] = item.spent;
    });

    const enrichedBudgets = budgets.map((b) => {
      const spent = spendMap[b.category] || 0;
      const remaining = Math.max(0, b.limit - spent);
      const percentUsed = Math.round((spent / b.limit) * 100);
      let status = 'NORMAL';
      if (percentUsed >= 100) status = 'EXCEEDED';
      else if (percentUsed >= b.alertThreshold) status = 'WARNING';

      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        spent,
        remaining,
        percentUsed,
        alertThreshold: b.alertThreshold,
        status,
        month: b.month,
        year: b.year,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedBudgets,
      month: currentMonth,
      year: currentYear,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update budget limit for a category
// @route   POST /api/budgets
// @access  Private
export const setBudget = async (req, res, next) => {
  try {
    const { category, limit, month, year, alertThreshold } = req.body;

    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        category,
        month: targetMonth,
        year: targetYear,
      },
      {
        limit: Number(limit),
        alertThreshold: alertThreshold || 80,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully!',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or unauthorized to delete.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
