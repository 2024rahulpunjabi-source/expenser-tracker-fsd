import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { expenseApi, categoryApi, budgetApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({
    summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0, totalTransactions: 0 },
    categoryBreakdown: [],
    monthlyTrends: [],
    paymentMethods: [],
  });
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch expenses with filter params
  const fetchExpenses = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await expenseApi.getAll(params);
      if (res.data.success) {
        setExpenses(res.data.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch analytics stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setStatsLoading(true);
      const res = await expenseApi.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await categoryApi.getAll();
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [isAuthenticated]);

  // Fetch budgets
  const fetchBudgets = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    try {
      const res = await budgetApi.getAll(params);
      if (res.data.success) {
        setBudgets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    }
  }, [isAuthenticated]);

  // Load initial data upon authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchExpenses();
      fetchStats();
      fetchCategories();
      fetchBudgets();
    } else {
      setExpenses([]);
      setCategories([]);
      setBudgets([]);
    }
  }, [isAuthenticated, fetchExpenses, fetchStats, fetchCategories, fetchBudgets]);

  // WebSocket real-time subscription for instant synchronization
  useEffect(() => {
    if (!socket) return;

    const handleExpenseAdded = (newExpense) => {
      const isOwner =
        newExpense.user?._id === user?._id ||
        newExpense.user === user?._id;
      const isAdmin = user?.role === 'admin';

      if (isOwner || isAdmin) {
        setExpenses((prev) => [newExpense, ...prev.filter((e) => e._id !== newExpense._id)]);
        fetchStats();
        fetchBudgets();
        if (!isOwner && isAdmin) {
          toast(
            `⚡ Live Activity: ${newExpense.user?.name || 'User'} added "${newExpense.title}" (₹${newExpense.amount})`,
            { icon: '🔔' }
          );
        }
      }
    };

    const handleExpenseUpdated = (updated) => {
      const isOwner =
        updated.user?._id === user?._id ||
        updated.user === user?._id;
      const isAdmin = user?.role === 'admin';

      if (isOwner || isAdmin) {
        setExpenses((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
        fetchStats();
        fetchBudgets();
      }
    };

    const handleExpenseDeleted = ({ id }) => {
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      fetchStats();
      fetchBudgets();
    };

    socket.on('expense:added', handleExpenseAdded);
    socket.on('expense:updated', handleExpenseUpdated);
    socket.on('expense:deleted', handleExpenseDeleted);

    return () => {
      socket.off('expense:added', handleExpenseAdded);
      socket.off('expense:updated', handleExpenseUpdated);
      socket.off('expense:deleted', handleExpenseDeleted);
    };
  }, [socket, user, fetchStats, fetchBudgets]);

  // CRUD Actions
  const addExpense = async (data) => {
    try {
      const res = await expenseApi.create(data);
      if (res.data.success) {
        toast.success('Transaction added successfully!');
        fetchExpenses();
        fetchStats();
        fetchBudgets();
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create transaction.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const editExpense = async (id, data) => {
    try {
      const res = await expenseApi.update(id, data);
      if (res.data.success) {
        toast.success('Transaction updated successfully!');
        fetchExpenses();
        fetchStats();
        fetchBudgets();
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update transaction.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const removeExpense = async (id) => {
    try {
      const res = await expenseApi.delete(id);
      if (res.data.success) {
        toast.success('Transaction removed.');
        setExpenses((prev) => prev.filter((e) => e._id !== id));
        fetchStats();
        fetchBudgets();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete transaction.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const importExpenses = async (items) => {
    try {
      const res = await expenseApi.bulkImport(items);
      if (res.data.success) {
        toast.success(res.data.message || 'Transactions imported successfully!');
        fetchExpenses();
        fetchStats();
        fetchBudgets();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to import transactions.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const saveBudget = async (data) => {
    try {
      const res = await budgetApi.set(data);
      if (res.data.success) {
        toast.success('Budget saved successfully!');
        fetchBudgets();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to set budget.';
      toast.error(msg);
      return { success: false };
    }
  };

  const deleteBudget = async (id) => {
    try {
      const res = await budgetApi.delete(id);
      if (res.data.success) {
        toast.success('Budget deleted.');
        fetchBudgets();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete budget.';
      toast.error(msg);
      return { success: false };
    }
  };

  const addCategory = async (data) => {
    try {
      const res = await categoryApi.create(data);
      if (res.data.success) {
        toast.success('Category created successfully!');
        fetchCategories();
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add category.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const value = {
    expenses,
    pagination,
    stats,
    categories,
    budgets,
    loading,
    statsLoading,
    fetchExpenses,
    fetchStats,
    fetchCategories,
    fetchBudgets,
    addExpense,
    editExpense,
    removeExpense,
    importExpenses,
    saveBudget,
    deleteBudget,
    addCategory,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export default ExpenseContext;
