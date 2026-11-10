import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Pencil,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  PieChart,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import AddCategoryModal from "./AddCategoryModal";
import EditTransactionModal from "./EditTransactionModal";
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredCategories,
  saveStoredCategories,
  transactionApi,
} from "../services/api";

export default function Transactions() {
  // State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
  const [toastMessage, setToastMessage] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | EXPENSE | INCOME
  const [filterPayment, setFilterPayment] = useState("ALL"); // ALL | UPI | CARD | CASH

  // Form State
  const [txType, setTxType] = useState("EXPENSE"); // EXPENSE | INCOME
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("UPI"); // UPI | CARD | CASH
  const [dateOfTransaction, setDateOfTransaction] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [categoryId, setCategoryId] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // STEP 1: Fetch categories
        const categoryResponse = await fetch(
          "http://localhost:8080/api/categories",
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!categoryResponse.ok) {
          throw new Error("Unable to fetch categories.");
        }
        const categoryData = await categoryResponse.json();
        setCategories(categoryData);

        const defaultCat = categoryData.find((cat) => cat.type === "EXPENSE");

        if (defaultCat) {
          setCategoryId(String(defaultCat.id));
        }

        // STEP 2: Fetch transactions
        const transactionResponse = await fetch(
          "http://localhost:8080/api/transactions",
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!transactionResponse.ok) {
          throw new Error("Unable to fetch transactions.");
        }

        const transactionData = await transactionResponse.json();

        // STEP 3: Match category IDs and names
        const formattedTransactions = transactionData.map((tx) => {
          const selectedCategory = categoryData.find(
            (category) => Number(category.id) === Number(tx.categoryId),
          );

          return {
            ...tx,
            transaction_id: tx.transactionId,
            user_id: tx.userId,
            category_id: tx.categoryId,
            category_name: selectedCategory ? selectedCategory.name : "General",
            type: selectedCategory ? selectedCategory.type : "EXPENSE",
            payment_type: tx.paymentType,
            date_of_transaction: tx.dateOfTransaction,
            active_yn: tx.active_yn ?? 1,
          };
        });

        // STEP 4: Update transactions state
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setToastMessage({
          type: "error",
          title: "Fetch failed",
          text: error.message || "Unable to load transactions from server.",
        });
      }
    };

    fetchTransactions();
  }, []);

  // const response = await fetch("http://localhost:8080/api/transactions")
  // const data = await response.json();
  // console.log("Transactions Data:", data);

  // When txType switches, auto-select a matching category if current doesn't match
  const filteredCategoriesForForm = useMemo(() => {
    return categories.filter((c) => c.type === txType);
  }, [categories, txType]);

  useEffect(() => {
    if (filteredCategoriesForForm.length > 0) {
      const currentCatValid = filteredCategoriesForForm.some(
        (c) => c.id === Number(categoryId),
      );
      if (!currentCatValid) {
        setCategoryId(String(filteredCategoriesForForm[0].id));
      }
    }
  }, [txType, filteredCategoriesForForm]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Financial Metrics
  const { totalBalance, totalIncome, totalExpense, expensePercentage } =
    useMemo(() => {
      let income = 0;
      let expense = 0;

      transactions.forEach((tx) => {
        const val = parseFloat(tx.amount) || 0;
        if (tx.type === "INCOME") {
          income += val;
        } else {
          expense += val;
        }
      });

      const balance = income - expense;
      const expPct =
        income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;

      return {
        totalBalance: balance,
        totalIncome: income,
        totalExpense: expense,
        expensePercentage: expPct,
      };
    }, [transactions]);

  // Category Breakdown for the visual diagram
  const categorySpendingBreakdown = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "EXPENSE");
    const catMap = {};
    let totalExp = 0;

    expenses.forEach((tx) => {
      const amt = parseFloat(tx.amount) || 0;
      totalExp += amt;
      catMap[tx.category_name] = (catMap[tx.category_name] || 0) + amt;
    });

    return Object.entries(catMap)
      .map(([name, sum]) => ({
        name,
        amount: sum,
        percentage: totalExp > 0 ? Math.round((sum / totalExp) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== "ALL" && tx.type !== filterType) return false;
      if (filterPayment !== "ALL" && tx.payment_type !== filterPayment)
        return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = (tx.description || "").toLowerCase().includes(query);
        const catMatch = (tx.category_name || "").toLowerCase().includes(query);
        const amountMatch = (tx.amount || "").toString().includes(query);
        const payMatch = (tx.payment_type || "").toLowerCase().includes(query);
        if (!descMatch && !catMatch && !amountMatch && !payMatch) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterPayment, searchQuery]);

  // CREATE: Add Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!description.trim()) {
      errors.description = "Please describe what this transaction was for";
    }
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = "Please enter an amount greater than ₹0";
    }
    if (!categoryId || Number(categoryId) <= 0) {
      errors.category = "Please select a valid category";
    }
    if (!dateOfTransaction) {
      errors.date = "Please choose a transaction date";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // const selectedCat = categories.find((c) => c.id === Number(categoryId));

    const newTransaction = {
      description: description.trim(),
      amount: Number(amount),
      paymentType: paymentType,
      dateOfTransaction: dateOfTransaction,
      categoryId: Number(categoryId),
    };

    try {
      // STEP 1: Save transaction
      const response = await fetch("http://localhost:8080/api/transactions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // STEP 2: Fetch the latest transactions
      const transactionResponse = await fetch(
        "http://localhost:8080/api/transactions",
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!transactionResponse.ok) {
        throw new Error(
          "Transaction saved, but unable to refresh the transaction list.",
        );
      }

      const transactionData = await transactionResponse.json();

      // STEP 3: Map transactions with their categories
      const formattedTransactions = transactionData.map((tx) => {
        const selectedCategory = categories.find(
          (category) => Number(category.id) === Number(tx.categoryId),
        );

        return {
          ...tx,
          transaction_id: tx.transactionId,
          user_id: tx.userId,
          category_id: tx.categoryId,
          category_name: selectedCategory ? selectedCategory.name : "General",
          type: selectedCategory?.type ?? "UNKNOWN",
          payment_type: tx.paymentType,
          date_of_transaction: tx.dateOfTransaction,
          active_yn: tx.active_yn ?? 1,
        };
      });

      // STEP 4: Update transactions state
      setTransactions(formattedTransactions);

      // STEP 5: Reset form fields
      setDescription("");
      setAmount("");

      // STEP 6: Show success message
      setToastMessage({
        type: "success",
        title: "Transaction Saved",
        text: `${newTransaction.description} (₹${newTransaction.amount.toLocaleString("en-IN")}) added successfully!`,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);

      setToastMessage({
        type: "error",
        title: "Transaction Failed",
        text: error.message || "Unable to save transaction.",
      });
    }
  };

  // UPDATE: Save Updated Transaction
  const handleUpdateTransaction = async (updatedTx) => {
    await transactionApi.update(updatedTx.transaction_id, updatedTx);
    const updatedList = transactions.map((t) =>
      t.transaction_id === updatedTx.transaction_id ? updatedTx : t,
    );
    setTransactions(updatedList);
    saveStoredTransactions(updatedList);

    setToastMessage({
      type: "success",
      title: "Transaction Updated",
      text: `Changes to "${updatedTx.description}" saved successfully!`,
    });
  };

  // DELETE: Delete Transaction
  const handleDeleteTransaction = (id) => {
    const itemToDelete = transactions.find((t) => t.transaction_id === id);
    const updated = transactions.filter((tx) => tx.transaction_id !== id);
    setTransactions(updated);
    saveStoredTransactions(updated);

    setToastMessage({
      type: "info",
      title: "Transaction Deleted",
      text: itemToDelete
        ? `Removed "${itemToDelete.description}"`
        : "Transaction removed.",
    });
  };

  // Quick Amount preset increment
  const handlePresetAmount = (val) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
    if (formErrors.amount) {
      setFormErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  // Add Category Modal save
  const handleCategoryAdded = async (newCat) => {
    try {
      // Step 1: Prepare data according to CategoryRequestDTO
      const categoryRequest = {
        name: newCat.category_name,
        type: newCat.type,
      };

      // Step 2: Send category to Spring Boot backend
      const response = await fetch(
        "http://localhost:8080/api/categories/add-category",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoryRequest),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.body || "Failed to add category.");
      }

      // Step 3: Fetch updated categories from backend
      const categoryResponse = await fetch(
        "http://localhost:8080/api/categories",
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!categoryResponse.ok) {
        throw new Error("Category added, but unable to refresh categories.");
      }

      const updatedCategories = await categoryResponse.json();

      // Step 4: Update React state
      setCategories(updatedCategories);

      // Step 5: Find the newly added category
      const addedCategory = updatedCategories.find(
        (cat) =>
          cat.name === categoryRequest.name &&
          cat.type === categoryRequest.type,
      );

      // Step 6: Select it if it matches the current transaction type
      if (addedCategory && addedCategory.type === txType) {
        setCategoryId(String(addedCategory.id));
      }

      // Step 7: Show success message
      setToastMessage({
        type: "success",
        title: "New Category Added",
        text: `Category "${categoryRequest.name}" is ready!`,
      });
    } catch (error) {
      console.error("Error adding category:", error);

      setToastMessage({
        type: "error",
        title: "Category Creation Failed",
        text: error.message || "Unable to add category.",
      });
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions available to export.");
      return;
    }
    const headers = [
      "Date",
      "Description",
      "Type",
      "Category",
      "Payment Method",
      "Amount (INR)",
    ];
    const rows = transactions.map((t) => [
      t.date_of_transaction,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      `"${t.category_name}"`,
      t.payment_type,
      t.type === "EXPENSE" ? `-${t.amount}` : `+${t.amount}`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `transactions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Donut calculation
  const totalVolume = totalIncome + totalExpense;
  const incomeStroke =
    totalVolume > 0 ? (totalIncome / totalVolume) * 283 : 141.5;
  const expenseStroke =
    totalVolume > 0 ? (totalExpense / totalVolume) * 283 : 141.5;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 animate-slideDown max-w-sm">
          {toastMessage.type === "success" ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
          <div className="text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              {toastMessage.title}
            </h4>
            <p className="text-xs font-medium text-slate-600 line-clamp-1">
              {toastMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Sub-tag */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 font-extrabold text-xl">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Expense Tracker
                </h1>
                <span className="text-[11px] uppercase font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Manage transactions, track spending & view insights
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bulk Upload Page Link */}
            <Link
              to="/bulk-upload"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk CSV Upload</span>
              <span className="sm:hidden">Upload</span>
            </Link>

            {/* Add Category Modal Trigger */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>

            {/* Auth Links */}
            <div className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-3">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Summary Cards with Clear Big Typography */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Total Balance Card */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                Total Available Balance
              </span>
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              ₹
              {totalBalance.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold">
              <span
                className={`px-2.5 py-1 rounded-full ${
                  totalBalance >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}
              >
                {totalBalance >= 0
                  ? "● Net Positive Cashflow"
                  : "● Spending Exceeds Income"}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-indigo-600" />
          </div>

          {/* Total Income Card */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                Total Income (Inflow)
              </span>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600">
              +₹
              {totalIncome.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <ArrowUpRight className="w-4 h-4" /> Received
              </span>
              <span>
                {transactions.filter((t) => t.type === "INCOME").length} income
                entries
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-emerald-500" />
          </div>

          {/* Total Expense Card */}
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                Total Expense (Outflow)
              </span>
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-rose-600">
              -₹
              {totalExpense.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <ArrowDownRight className="w-4 h-4" /> Spent
              </span>
              <span>
                {transactions.filter((t) => t.type === "EXPENSE").length}{" "}
                expense entries
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-rose-500" />
          </div>
        </section>

        {/* VISUAL STATUS & DIAGRAMS SECTION (Visually appealing charts for quick clarity) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Visual Cashflow Breakdown & Analytics
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Understand where your money goes at a single glance
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{" "}
                Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>{" "}
                Expenses
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Visual Donut Diagram */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />
                  {/* Income Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${incomeStroke} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                  {/* Expense Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="10"
                    strokeDasharray={`${expenseStroke} 283`}
                    strokeDashoffset={`-${incomeStroke}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Savings Rate
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {totalIncome > 0 ? `${100 - expensePercentage}%` : "0%"}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-600">
                    {totalBalance >= 0 ? "Saved" : "Deficit"}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs font-bold text-slate-700">
                  {expensePercentage > 75
                    ? "⚠️ High spending rate this period"
                    : expensePercentage > 40
                      ? "⚖️ Balanced budget healthy range"
                      : "🌟 Excellent financial discipline!"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You spent ₹{totalExpense.toLocaleString("en-IN")} out of ₹
                  {totalIncome.toLocaleString("en-IN")} income
                </p>
              </div>
            </div>

            {/* Category Distribution Progress Bars */}
            <div className="md:col-span-7 space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Top Expense Categories
              </h4>
              {categorySpendingBreakdown.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center italic">
                  No expense records found yet. Add an expense below!
                </div>
              ) : (
                categorySpendingBreakdown.slice(0, 4).map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {cat.name}
                      </span>
                      <span className="text-slate-600">
                        ₹{cat.amount.toLocaleString("en-IN")}{" "}
                        <span className="text-slate-400 font-normal">
                          ({cat.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* STEP-BY-STEP USER GUIDED FLOW (Zero Confusion for First-Time Users) */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-100 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Any Expense or Income? Record It Right Below
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Whether you bought groceries, paid a bill, or received your
                paycheck — log it in 3 quick steps.
              </p>
            </div>
          </div>
        </div>

        {/* 2-COLUMN SECTION: New Transaction Form (Left) & Ledger (Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: New Transaction Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                New Transaction
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Step 1: Choose type → Step 2: Enter amount → Step 3: Save!
              </p>
            </div>

            {/* STEP 1: Two Prominent Choice Cards (Expense vs Income) */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Step 1: What type of transaction is this?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Expense Choice */}
                <button
                  type="button"
                  onClick={() => setTxType("EXPENSE")}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    txType === "EXPENSE"
                      ? "border-rose-500 bg-rose-50/60 shadow-md shadow-rose-100"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black text-rose-600">
                      🔴 MONEY SPENT
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        txType === "EXPENSE"
                          ? "border-rose-500 bg-rose-500"
                          : "border-slate-300"
                      }`}
                    >
                      {txType === "EXPENSE" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Expense
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Food, bills, fuel, rent
                  </span>
                </button>

                {/* Income Choice */}
                <button
                  type="button"
                  onClick={() => setTxType("INCOME")}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    txType === "INCOME"
                      ? "border-emerald-500 bg-emerald-50/60 shadow-md shadow-emerald-100"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black text-emerald-600">
                      🟢 MONEY RECEIVED
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        txType === "INCOME"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300"
                      }`}
                    >
                      {txType === "INCOME" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Income
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Salary, freelance, gift
                  </span>
                </button>
              </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleAddTransaction} className="space-y-5">
              {/* STEP 2: AMOUNT INPUT */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Step 2: Enter Amount (₹){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-black text-xl">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (formErrors.amount) {
                        setFormErrors((prev) => ({ ...prev, amount: null }));
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border font-black text-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                      formErrors.amount
                        ? "border-rose-400 bg-rose-50/30 focus:ring-rose-200"
                        : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-600"
                    }`}
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-xs text-rose-500 mt-1 font-bold">
                    {formErrors.amount}
                  </p>
                )}

                {/* Quick Add Amount Increments */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="text-[11px] font-bold text-slate-400">
                    Tap to add:
                  </span>
                  {[100, 500, 1000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePresetAmount(val)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                    >
                      +₹{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description / Note <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Groceries at Supermarket, Metro ticket, Client payment"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (formErrors.description) {
                      setFormErrors((prev) => ({ ...prev, description: null }));
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    formErrors.description
                      ? "border-rose-400 bg-rose-50/30 focus:ring-rose-200"
                      : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-600"
                  }`}
                />
                {formErrors.description && (
                  <p className="text-xs text-rose-500 mt-1 font-bold">
                    {formErrors.description}
                  </p>
                )}

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(txType === "EXPENSE"
                    ? [
                        "Groceries",
                        "Metro Recharge",
                        "Dinner",
                        "Coffee",
                        "Electricity",
                        "Medicine",
                      ]
                    : [
                        "Monthly Salary",
                        "Freelance Gig",
                        "Stock Dividend",
                        "Bonus",
                      ]
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDescription(item)}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* PAYMENT TYPE (Enum: 'UPI', 'CARD', 'CASH') */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "UPI",
                      label: "UPI",
                      icon: Smartphone,
                      color: "text-purple-600",
                    },
                    {
                      id: "CASH",
                      label: "Cash",
                      icon: Banknote,
                      color: "text-emerald-600",
                    },
                    {
                      id: "CARD",
                      label: "Card",
                      icon: CreditCard,
                      color: "text-blue-600",
                    },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentType === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentType(method.id)}
                        className={`py-3 px-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isSelected ? "text-indigo-600" : method.color}`}
                        />
                        <span className="text-xs font-black">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DATE OF TRANSACTION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Transaction Date
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDateOfTransaction(
                          new Date().toISOString().split("T")[0],
                        )
                      }
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Today
                    </button>
                    <span className="text-slate-300 text-xs">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setDateOfTransaction(d.toISOString().split("T")[0]);
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={dateOfTransaction}
                  onChange={(e) => setDateOfTransaction(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition"
                />
              </div>

              {/* CATEGORY SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Category Tag
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Category
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition cursor-pointer"
                >
                  {filteredCategoriesForForm.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type})
                    </option>
                  ))}
                  {filteredCategoriesForForm.length === 0 && (
                    <option value="" disabled>
                      No {txType.toLowerCase()} categories found. Click + Add
                      New Category!
                    </option>
                  )}
                </select>
              </div>

              {/* BIG CLEAR SUBMIT CTA */}
              <button
                type="submit"
                className={`w-full py-4 px-4 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                  txType === "EXPENSE"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                }`}
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                {amount && parseFloat(amount) > 0
                  ? `Save ${txType === "EXPENSE" ? "Expense" : "Income"} of ₹${parseFloat(
                      amount,
                    ).toLocaleString("en-IN")}`
                  : `Add ${txType === "EXPENSE" ? "Expense" : "Income"} Entry`}
              </button>
            </form>
          </div>

          {/* RIGHT: Transactions Ledger Table & Cards */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition space-y-5">
            {/* Header & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Transactions Ledger
                  </h2>
                  <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs">
                    {filteredTransactions.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  View, edit, or delete your recorded transactions
                </p>
              </div>

              {/* View switch & CSV Export */}
              <div className="flex items-center gap-2">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-lg transition ${
                      viewMode === "table"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Table View"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-2 rounded-lg transition ${
                      viewMode === "card"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Card / Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  title="Export records to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, category, payment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "EXPENSE", "INCOME"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                      filterType === type
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type === "ALL"
                      ? "All"
                      : type === "EXPENSE"
                        ? "Expenses"
                        : "Income"}
                  </button>
                ))}

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border-none focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
              <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-800">
                  No transactions match
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Adjust your search terms or filters above, or log a new
                  transaction on the left!
                </p>
                {(searchQuery ||
                  filterType !== "ALL" ||
                  filterPayment !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("ALL");
                      setFilterPayment("ALL");
                    }}
                    className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            )}

            {/* TABLE VIEW (With Edit & Delete CRUD buttons) */}
            {viewMode === "table" && filteredTransactions.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredTransactions.map((tx) => {
                      const isExpense = tx.type === "EXPENSE";
                      return (
                        <tr
                          key={tx.transaction_id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Date */}
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {tx.date_of_transaction}
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {tx.description}
                            </span>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                isExpense
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              }`}
                            >
                              {tx.category_name}
                            </span>
                          </td>

                          {/* Payment */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              {tx.payment_type === "UPI" && (
                                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                              )}
                              {tx.payment_type === "CARD" && (
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              {tx.payment_type === "CASH" && (
                                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              {tx.payment_type}
                            </span>
                          </td>

                          {/* Amount */}
                          <td
                            className={`py-3.5 px-4 text-right font-black whitespace-nowrap text-sm sm:text-base ${
                              isExpense ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {isExpense ? "-" : "+"}₹
                            {parseFloat(tx.amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 0,
                            })}
                          </td>

                          {/* Actions: EDIT & DELETE */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => setEditingTransaction(tx)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit Transaction"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() =>
                                  handleDeleteTransaction(tx.transaction_id)
                                }
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* CARD / GRID VIEW */}
            {viewMode === "card" && filteredTransactions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTransactions.map((tx) => {
                  const isExpense = tx.type === "EXPENSE";
                  return (
                    <div
                      key={tx.transaction_id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                              isExpense
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}
                          >
                            {tx.category_name}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {tx.description}
                          </h4>
                        </div>
                        <span
                          className={`font-black text-base whitespace-nowrap ${
                            isExpense ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {isExpense ? "-" : "+"}₹
                          {parseFloat(tx.amount).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {tx.date_of_transaction}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">
                            {tx.payment_type}
                          </span>
                        </div>

                        {/* Edit and Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteTransaction(tx.transaction_id)
                            }
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer with Balance Status */}
            {filteredTransactions.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">
                  Showing {filteredTransactions.length} of {transactions.length}{" "}
                  records
                </span>
                <span className="font-bold text-slate-700">
                  Net Ledger:{" "}
                  <span
                    className={
                      filteredTransactions.reduce(
                        (acc, t) =>
                          acc + (t.type === "INCOME" ? t.amount : -t.amount),
                        0,
                      ) >= 0
                        ? "text-emerald-600 font-black"
                        : "text-rose-600 font-black"
                    }
                  >
                    ₹
                    {filteredTransactions
                      .reduce(
                        (acc, t) =>
                          acc + (t.type === "INCOME" ? t.amount : -t.amount),
                        0,
                      )
                      .toLocaleString("en-IN")}
                  </span>
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryAdded={handleCategoryAdded}
      />

      {/* Edit Transaction Modal (Complete CRUD in UI) */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        onSave={handleUpdateTransaction}
      />
    </div>
  );
}
