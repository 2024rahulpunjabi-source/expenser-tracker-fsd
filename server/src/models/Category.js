import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Please specify category type (EXPENSE or INCOME)'],
      enum: ['EXPENSE', 'INCOME'],
      default: 'EXPENSE',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: 'Tag',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means global system category
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + category name uniqueness
CategorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model('Category', CategorySchema);
