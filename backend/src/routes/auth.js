const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validator');

// Public routes
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
], authController.register);

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
], authController.login);

// Admin routes (approval system)
router.get('/pending-approvals', authMiddleware, authorize('admin'), authController.getPendingApprovals);
router.get('/all-user-stats', authMiddleware, authorize('admin'), authController.getAllUserStats);
router.put('/approve/:userId', authMiddleware, authorize('admin'), authController.approveUser);
router.delete('/reject/:userId', authMiddleware, authorize('admin'), authController.rejectUser);

// Authenticated routes
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
