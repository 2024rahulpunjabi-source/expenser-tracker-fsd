import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title or description'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    type: {
      type: String,
      required: [true, 'Please specify transaction type'],
      enum: ['EXPENSE', 'INCOME'],
      default: 'EXPENSE',
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide or select a category'],
      trim: true,
      index: true,
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please select payment method'],
      enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'OTHER'],
      default: 'UPI',
    },
    date: {
      type: Date,
      required: [true, 'Please specify transaction date'],
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    receiptUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimized filtering and sorting queries
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ user: 1, type: 1, date: -1 });
ExpenseSchema.index({ user: 1, category: 1 });

export const Expense = mongoose.model('Expense', ExpenseSchema);
