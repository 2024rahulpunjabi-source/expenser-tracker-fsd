import express from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  bulkImportExpenses,
} from '../controllers/expenseController.js';
import {
  expenseValidationRules,
  validate,
} from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All expense routes require authentication
router.use(protect);

router.route('/stats/summary').get(getExpenseStats);
router.route('/bulk').post(bulkImportExpenses);

router
  .route('/')
  .post(expenseValidationRules, validate, createExpense)
  .get(getExpenses);

router
  .route('/:id')
  .get(getExpenseById)
  .put(expenseValidationRules, validate, updateExpense)
  .delete(deleteExpense);

export default router;
