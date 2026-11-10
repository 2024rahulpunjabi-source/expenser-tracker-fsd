import { User } from '../models/User.js';
import { Expense } from '../models/Expense.js';

// @desc    Get all users with summary info (Admin only)
// @route   GET /api/admin/users
// @access  Private / Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Enrich with transaction counts
    const userStats = await Expense.aggregate([
      {
        $group: {
          _id: '$user',
          transactionCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const statsMap = {};
    userStats.forEach((s) => {
      statsMap[s._id.toString()] = s;
    });

    const enrichedUsers = users.map((u) => {
      const stat = statsMap[u._id.toString()] || { transactionCount: 0, totalSpent: 0 };
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        currency: u.currency,
        createdAt: u.createdAt,
        transactionCount: stat.transactionCount,
        totalSpent: stat.totalSpent,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedUsers,
      totalUsers: users.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system-wide platform statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Private / Admin
export const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, adminCount, activeCount, totalTransactions, financialStats] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ isActive: true }),
        Expense.countDocuments(),
        Expense.aggregate([
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
            },
          },
        ]),
      ]);

    let systemIncome = 0;
    let systemExpense = 0;
    financialStats.forEach((f) => {
      if (f._id === 'INCOME') systemIncome = f.total;
      if (f._id === 'EXPENSE') systemExpense = f.total;
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        adminCount,
        activeCount,
        totalTransactions,
        systemIncome,
        systemExpense,
        platformVolume: systemIncome + systemExpense,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private / Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either user or admin.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (Admin only)
// @route   PUT /api/admin/users/:id/status
// @access  Private / Admin
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deactivating own admin account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and their transactions (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private / Admin
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete associated expenses
    await Expense.deleteMany({ user: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User and all associated transactions successfully deleted.',
    });
  } catch (error) {
    next(error);
  }
};
