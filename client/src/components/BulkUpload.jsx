import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  Check,
} from "lucide-react";
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredCategories,
  transactionApi,
} from "../services/api";

export default function BulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sample CSV generator & downloader
  const handleDownloadSample = () => {
    const csvContent =
      "date,description,type,category,payment_type,amount\n" +
      "2026-10-18,Whole Foods Market,EXPENSE,Food & Dining,UPI,1500\n" +
      "2026-10-18,Freelance Web Design,INCOME,Freelance / Side Gig,CARD,25000\n" +
      "2026-10-17,Petrol Fuel,EXPENSE,Transportation,CASH,800\n" +
      "2026-10-16,High Speed Internet,EXPENSE,Utilities & Bills,UPI,999\n" +
      "2026-10-15,Monthly Salary,INCOME,Salary,CARD,65000\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "expense_tracker_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Text Parsing logic
  const parseCSVText = (text) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParseErrors(["The uploaded file appears to be empty or has no data rows."]);
      return;
    }

    // Parse header
    const headers = lines[0]
      .split(",")
      .map((h) => h.replace(/["']/g, "").trim().toLowerCase());

    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const descIdx = headers.findIndex((h) => h.includes("desc"));
    const typeIdx = headers.findIndex((h) => h.includes("type") && !h.includes("pay"));
    const catIdx = headers.findIndex((h) => h.includes("cat"));
    const payIdx = headers.findIndex((h) => h.includes("pay") || h.includes("method"));
    const amtIdx = headers.findIndex((h) => h.includes("amount") || h.includes("price") || h.includes("cost"));

    if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) {
      setParseErrors([
        "CSV header missing required columns! Make sure you have at least: date, description, amount (download sample above for guidance).",
      ]);
      return;
    }

    const rows = [];
    const errors = [];
    const validCategories = getStoredCategories();

    for (let i = 1; i < lines.length; i++) {
      // Split with support for quoted strings
      const rowLine = lines[i];
      const cells = rowLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowLine.split(",");

      const rawDate = cells[dateIdx] ? cells[dateIdx].replace(/["']/g, "").trim() : "";
      const rawDesc = cells[descIdx] ? cells[descIdx].replace(/["']/g, "").trim() : "";
      const rawType = typeIdx !== -1 && cells[typeIdx] ? cells[typeIdx].replace(/["']/g, "").trim().toUpperCase() : "EXPENSE";
      const rawCat = catIdx !== -1 && cells[catIdx] ? cells[catIdx].replace(/["']/g, "").trim() : "General";
      const rawPay = payIdx !== -1 && cells[payIdx] ? cells[payIdx].replace(/["']/g, "").trim().toUpperCase() : "UPI";
      const rawAmt = cells[amtIdx] ? parseFloat(cells[amtIdx].replace(/["'₹$]/g, "").trim()) : NaN;

      const rowErrors = [];
      if (!rawDate) rowErrors.push("Date missing");
      if (!rawDesc) rowErrors.push("Description missing");
      if (isNaN(rawAmt) || rawAmt <= 0) rowErrors.push("Invalid positive amount");

      const normalizedType = rawType === "INCOME" ? "INCOME" : "EXPENSE";
      const normalizedPay = ["UPI", "CARD", "CASH"].includes(rawPay) ? rawPay : "UPI";

      rows.push({
        id: `row-${i}`,
        date_of_transaction: rawDate || new Date().toISOString().split("T")[0],
        description: rawDesc || "Untitled Transaction",
        type: normalizedType,
        category_name: rawCat,
        category_id: 1,
        payment_type: normalizedPay,
        amount: isNaN(rawAmt) ? 0 : rawAmt,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    setParsedData(rows);
    setParseErrors(errors);
  };

  const handleFileUpload = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv")) {
      setParseErrors(["Please upload a valid .csv file."]);
      return;
    }

    setFile(selectedFile);
    setParseErrors([]);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      parseCSVText(content);
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setIsProcessing(true);

    const formattedTransactions = validRows.map((r, i) => ({
      transaction_id: Date.now() + i,
      user_id: 1,
      category_id: 1,
      category_name: r.category_name,
      type: r.type,
      amount: r.amount,
      description: r.description,
      payment_type: r.payment_type,
      date_of_transaction: r.date_of_transaction,
      created_at: new Date().toISOString(),
      active_yn: 1,
    }));

    await transactionApi.bulkCreate(formattedTransactions);
    setIsProcessing(false);
    setUploadSuccess(true);
  };

  // Delete single row from preview
  const handleRemoveRow = (rowId) => {
    setParsedData((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Summary Metrics
  const validCount = parsedData.filter((r) => r.isValid).length;
  const totalInflow = parsedData
    .filter((r) => r.isValid && r.type === "INCOME")
    .reduce((acc, r) => acc + r.amount, 0);
  const totalOutflow = parsedData
    .filter((r) => r.isValid && r.type === "EXPENSE")
    .reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/transactions"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1 font-semibold text-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Transactions</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200"
            >
              <Download className="w-4 h-4" />
              <span>Sample CSV Template</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Page Title & Clear Instructions */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 mb-3 border border-white/10">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Bulk Transaction Importer
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Upload Multiple Transactions via CSV
            </h1>
            <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
              Import a whole month of bank statements or previous spending logs in one second. Follow
              the 3 simple steps below:
            </p>
          </div>

          {/* 3 Step Visual Guidance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/10 rounded-2xl p-3.5 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Get CSV Template</h4>
                <p className="text-[11px] text-indigo-200">
                  Click the template button to see required columns.
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3.5 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Upload File</h4>
                <p className="text-[11px] text-indigo-200">
                  Drop your CSV file into the dropzone below.
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3.5 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">Preview & Confirm</h4>
                <p className="text-[11px] text-indigo-200">
                  Verify the table rows and hit Import!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {uploadSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-200">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Transactions Successfully Imported!
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {validCount} transactions have been added to your ledger.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/transactions")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 transition"
            >
              Go to Transactions →
            </button>
          </div>
        )}

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/50 scale-[1.01]"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {file ? file.name : "Drag and drop your CSV file here"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Files must have headers:{" "}
            <span className="font-mono text-indigo-600 font-semibold">
              date, description, type, category, payment_type, amount
            </span>
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <label className="cursor-pointer px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-200 transition">
              Browse CSV File
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Parsing Error Messages */}
        {parseErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Formatting Errors</span>
            </div>
            {parseErrors.map((err, i) => (
              <p key={i} className="text-xs text-rose-700 pl-6">
                • {err}
              </p>
            ))}
          </div>
        )}

        {/* Parsed Preview Section */}
        {parsedData.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Rows
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{parsedData.length}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Valid Rows
                </span>
                <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  {validCount} / {parsedData.length}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Total Inflow
                </span>
                <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  +₹{totalInflow.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  Total Outflow
                </span>
                <p className="text-xl font-extrabold text-rose-700 mt-0.5">
                  -₹{totalOutflow.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Preview Table Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Parsed Data Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Review the extracted transactions below before importing
                </p>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={isProcessing || validCount === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center gap-2 ${
                  validCount > 0
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-95"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isProcessing
                  ? "Importing..."
                  : `Confirm & Import ${validCount} Transactions`}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {parsedData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {row.date_of_transaction}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-slate-800">
                        {row.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            row.type === "EXPENSE"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {row.category_name}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {row.payment_type}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-extrabold text-xs whitespace-nowrap ${
                          row.type === "EXPENSE" ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {row.type === "EXPENSE" ? "-" : "+"}₹{row.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
