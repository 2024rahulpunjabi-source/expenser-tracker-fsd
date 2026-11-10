import { body, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Rules for user registration
export const registerValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
];

// Rules for user login
export const loginValidationRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Rules for expense creation & update
export const expenseValidationRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),
  body('amount').isNumeric().withMessage('Amount must be a number').custom((val) => val > 0).withMessage('Amount must be greater than 0'),
  body('type').optional().isIn(['EXPENSE', 'INCOME']).withMessage('Type must be EXPENSE or INCOME'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('paymentMethod').optional().isIn(['UPI', 'CARD', 'CASH', 'NET_BANKING', 'OTHER']).withMessage('Invalid payment method'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date string'),
];

// Rules for budget creation
export const budgetValidationRules = [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('limit').isNumeric().withMessage('Limit must be a number').custom((val) => val > 0).withMessage('Budget limit must be greater than 0'),
  body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid'),
];
