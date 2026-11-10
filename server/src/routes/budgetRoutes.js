import express from 'express';
import {
  getBudgets,
  setBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import {
  budgetValidationRules,
  validate,
} from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getBudgets)
  .post(budgetValidationRules, validate, setBudget);

router.route('/:id').delete(deleteBudget);

export default router;
