import { Category } from '../models/Category.js';

// Default starter categories
export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'EXPENSE', color: '#f43f5e', icon: 'Utensils', isDefault: true },
  { name: 'Salary', type: 'INCOME', color: '#10b981', icon: 'Briefcase', isDefault: true },
  { name: 'Transportation', type: 'EXPENSE', color: '#f97316', icon: 'Car', isDefault: true },
  { name: 'Shopping', type: 'EXPENSE', color: '#8b5cf6', icon: 'ShoppingBag', isDefault: true },
  { name: 'Housing & Rent', type: 'EXPENSE', color: '#ec4899', icon: 'Home', isDefault: true },
  { name: 'Utilities & Bills', type: 'EXPENSE', color: '#eab308', icon: 'Zap', isDefault: true },
  { name: 'Freelance & Side Gig', type: 'INCOME', color: '#06b6d4', icon: 'Laptop', isDefault: true },
  { name: 'Healthcare & Fitness', type: 'EXPENSE', color: '#14b8a6', icon: 'HeartPulse', isDefault: true },
  { name: 'Entertainment', type: 'EXPENSE', color: '#3b82f6', icon: 'Film', isDefault: true },
  { name: 'Investments', type: 'INCOME', color: '#6366f1', icon: 'TrendingUp', isDefault: true },
];

// @desc    Get all categories (system defaults + user custom)
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      $or: [{ user: null }, { user: req.user._id }],
    }).sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res, next) => {
  try {
    const { name, type, color, icon } = req.body;

    // Check duplicate for this user
    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name and type already exists.',
      });
    }

    const category = await Category.create({
      name,
      type: type || 'EXPENSE',
      color: color || '#6366f1',
      icon: icon || 'Tag',
      user: req.user._id,
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or default categories cannot be deleted.',
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
