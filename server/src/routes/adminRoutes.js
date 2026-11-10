import express from 'express';
import {
  getAllUsers,
  getAdminStats,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Enforce both JWT authentication and admin authorization on all routes
router.use(protect);
router.use(authorize('admin'));

router.route('/users').get(getAllUsers);
router.route('/stats').get(getAdminStats);
router.route('/users/:id/role').put(updateUserRole);
router.route('/users/:id/status').put(toggleUserStatus);
router.route('/users/:id').delete(deleteUser);

export default router;
