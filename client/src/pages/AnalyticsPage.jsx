import React from 'react';
import { PieChart, TrendingUp, CreditCard, Layers, BarChart3 } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

export default function AnalyticsPage() {
  const { stats } = useExpenses();
  const { summary, categoryBreakdown, monthlyTrends, paymentMethods } = stats;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Spending & Income Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed visual insights into your expenditure channels and saving trends
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Average Monthly Outflow
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{Math.round(summary.totalExpense / Math.max(monthlyTrends.length, 1)).toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Based on past 6 months of logged expenses</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Net Accumulation
          </span>
          <h3 className={`text-2xl font-black mt-2 ${summary.netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{summary.netSavings.toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Overall balance surplus retained</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Lifetime Logged Volume
          </span>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            ₹{(summary.totalIncome + summary.totalExpense).toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Across {summary.totalTransactions} total entries</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Category Distribution
            </h2>
          </div>
          <div className="space-y-4">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No category data available</p>
            ) : (
              categoryBreakdown.map((item, idx) => {
                const colors = ['bg-rose-500', 'bg-indigo-500', 'bg-amber-500', 'bg-violet-500', 'bg-emerald-500', 'bg-blue-500'];
                const colorClass = colors[idx % colors.length];
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{item.category}</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        ₹{item.total.toLocaleString('en-IN')}{' '}
                        <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className={`h-full rounded-full ${colorClass}`}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Payment Method Breakdown
            </h2>
          </div>
          <div className="space-y-4">
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payment method logs</p>
            ) : (
              paymentMethods.map((p) => {
                const totalVol = summary.totalIncome + summary.totalExpense || 1;
                const percent = Math.round((p.total / totalVol) * 100);
                return (
                  <div
                    key={p.method}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {p.method}
                      </span>
                      <p className="text-[11px] text-slate-400">{p.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        ₹{p.total.toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {percent}% of total volume
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
