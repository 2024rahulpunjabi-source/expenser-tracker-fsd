import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Receipt,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { onOpenAddModal } = useOutletContext() || {};
  const { user } = useAuth();
  const { stats, expenses, loading } = useExpenses();

  const { summary, categoryBreakdown, monthlyTrends } = stats;

  const statCards = [
    {
      title: 'Net Balance',
      amount: summary.netSavings,
      color: summary.netSavings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
      icon: Wallet,
      iconBg: 'bg-indigo-600 text-white',
      badge: summary.netSavings >= 0 ? 'Surplus' : 'Deficit',
    },
    {
      title: 'Total Income',
      amount: summary.totalIncome,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
      icon: TrendingUp,
      iconBg: 'bg-emerald-600 text-white',
      badge: '+ Inflow',
    },
    {
      title: 'Total Expenses',
      amount: summary.totalExpense,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
      icon: TrendingDown,
      iconBg: 'bg-rose-600 text-white',
      badge: '- Outflow',
    },
    {
      title: 'Savings Rate',
      amount: `${summary.savingsRate}%`,
      isPercent: true,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/50',
      icon: PiggyBank,
      iconBg: 'bg-violet-600 text-white',
      badge: `${summary.totalTransactions} Txns`,
    },
  ];

  // Max spending for normalized bar heights
  const maxMonthlyVal = Math.max(
    ...monthlyTrends.map((m) => Math.max(m.income, m.expense)),
    1000
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Financial Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome back, {user?.name || 'Explorer'} 👋
          </h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            Track your daily expenses, monitor category limits, and make informed financial decisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`p-5 rounded-3xl border ${c.bg} shadow-sm transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {c.title}
                </span>
                <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className={`text-2xl font-extrabold tracking-tight ${c.color}`}>
                  {c.isPercent ? c.amount : `₹${Number(c.amount || 0).toLocaleString('en-IN')}`}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                  {c.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cash Flow Trajectory Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Cash Flow (Last 6 Months)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison between income inflows and expense outflows
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expense
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 pt-4 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {monthlyTrends.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No monthly transactions recorded yet
              </div>
            ) : (
              monthlyTrends.map((m) => {
                const incomeHeight = (m.income / maxMonthlyVal) * 100;
                const expenseHeight = (m.expense / maxMonthlyVal) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-48">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                        className="w-1/2 max-w-[20px] rounded-t-lg bg-emerald-500/90 group-hover:bg-emerald-500 transition-all relative group/bar"
                      >
                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap pointer-events-none transition-opacity z-10">
                          ₹{m.income.toLocaleString('en-IN')}
                        </div>
                      </div>
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                        className="w-1/2 max-w-[20px] rounded-t-lg bg-rose-500/90 group-hover:bg-rose-500 transition-all relative group/bar"
                      >
                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap pointer-events-none transition-opacity z-10">
                          ₹{m.expense.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate w-full text-center">
                      {m.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Spending Categories */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Category Spending
            </h2>
            <Link
              to="/analytics"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No expense categories logged yet
              </p>
            ) : (
              categoryBreakdown.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                    <span className="text-slate-900 dark:text-white">
                      ₹{item.total.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] text-slate-400">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Active Budgets</span>
            <Link
              to="/budgets"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage Limits →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your latest monetary activities
            </p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
          >
            View All ({expenses.length})
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {expenses.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No transactions recorded yet.</p>
            <button
              onClick={onOpenAddModal}
              className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add your first transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Title</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenses.slice(0, 6).map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pl-2 font-semibold text-slate-800 dark:text-slate-200">
                        {tx.title}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 text-slate-500">{tx.paymentMethod}</td>
                      <td
                        className={`py-3 text-right pr-2 font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
