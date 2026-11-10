import React, { useState } from 'react';
import { Target, PlusCircle, AlertTriangle, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import SetBudgetModal from '../components/SetBudgetModal';

export default function BudgetsPage() {
  const { budgets, deleteBudget } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Category Budgets & Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set spending caps per category and get notified automatically before you overspend
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          Set Budget Limit
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No active budgets for this month</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Setting monthly budgets helps you stay in control of your discretionary spending.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isExceeded = b.percentUsed >= 100;
            const isWarning = b.percentUsed >= b.alertThreshold && !isExceeded;

            return (
              <div
                key={b._id}
                className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${
                  isExceeded
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : isWarning
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {b.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isExceeded
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-300'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300'
                      }`}
                    >
                      {b.status}
                    </span>
                    <button
                      onClick={() => deleteBudget(b._id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Spent: ₹{b.spent.toLocaleString('en-IN')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Limit: ₹{b.limit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>{b.percentUsed}% utilized</span>
                    <span>Remaining: ₹{b.remaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Alert threshold: <strong className="text-slate-600 dark:text-slate-300">{b.alertThreshold}%</strong>
                  </span>
                  {isExceeded ? (
                    <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5" /> Over budget!
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> Approaching cap
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Within target
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SetBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
