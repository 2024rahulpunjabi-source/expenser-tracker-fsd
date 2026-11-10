import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Budget must belong to a user'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide category for budget'],
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, 'Please provide budget limit amount'],
      min: [1, 'Budget limit must be at least 1'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: () => new Date().getMonth() + 1,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    alertThreshold: {
      type: Number,
      default: 80, // Alert triggered at 80% utilization
      min: 10,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

BudgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', BudgetSchema);
